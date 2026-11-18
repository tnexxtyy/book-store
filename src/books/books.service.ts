import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './entities/book.entity';
import { Author } from '../authors/entities/author.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import {
  FindBooksQueryDto,
  BOOK_SORT_FIELDS,
} from './dto/find-books-query.dto';
import { isPgError, PG_FOREIGN_KEY_VIOLATION } from '../common/pg-error';
@Injectable()
export class BooksService {
  private readonly booksCachePrefix = 'books:';

  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    @InjectRepository(Author)
    private readonly authorsRepository: Repository<Author>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async findAll(query: FindBooksQueryDto): Promise<
    | {
        data: Book[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }
    | {
        data: Book[];
        limit: number;
        nextCursor: number | null;
      }
  > {

    const { page, limit } = query;
    const cacheKey = `${this.booksCachePrefix}${JSON.stringify(query)}`;

    const cachedResult = await this.cacheManager.get<{
      data: Book[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);

    if (cachedResult) {
      console.log('CACHE HIT:', cacheKey);
      return cachedResult;
    }
    console.log('CACHE MISS:', cacheKey);
    const sortBy = (BOOK_SORT_FIELDS as readonly string[]).includes(
      query.sortBy ?? '',
    )
      ? query.sortBy!
      : 'id';

    const order = query.order === 'DESC' ? 'DESC' : 'ASC';
    const qb = this.booksRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author');
    if (query.search?.trim()) {
      const search = query.search.trim().replace(/[\\%_]/g, '\\$&');
      qb.andWhere('book.title ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (query.authorId !== undefined) {
      qb.andWhere('author.id = :authorId', {
        authorId: query.authorId,
      });
    }
    if (query.cursor!== undefined){
      const books = await qb
        .andWhere('book.id > :cursor', { cursor: query.cursor })
        .orderBy('book.id', 'ASC')
        .take(limit + 1)
        .getMany();

      const hasNextPage =books.length > limit;
      const data =hasNextPage ? books.slice(0,limit):books;

      const result  ={
        data,
        limit,
        nextCursor:hasNextPage ? data[data.length - 1 ].id : null,
      };
      await this.cacheManager.set(cacheKey,result,60_000);
      console.log('CACHE SAVED:',cacheKey)
      return result;
    }
    const [data,total] = await qb
      .orderBy(`book.${sortBy}`,order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const result ={
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    await this.cacheManager.set(cacheKey,result,60_000);
    console.log('CACHE SAVED:',cacheKey);
    return result;

  }
  private async clearBooksCache(): Promise<void> {
    const store = this.cacheManager.stores[0];
    const keysToDelete: string[] = [];
    if (!store || typeof store.iterator !== 'function') {
      return;
    }
    for await (const [key] of store.iterator({})) {
      if (typeof key === 'string' && key.startsWith(this.booksCachePrefix)) {
        keysToDelete.push(key);
      }
    }
    if (keysToDelete.length > 0) {
      await this.cacheManager.mdel(keysToDelete);
    }
  }
  async findOne(id: number): Promise<Book> {
    const book = await this.booksRepository.findOne({
      where: { id },
      relations: { author: true },
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }
  async create(dto: CreateBookDto): Promise<Book> {
    const author = await this.authorsRepository.findOneBy({
      id: dto.authorId,
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    if (dto.publishedYear > new Date().getFullYear()) {
      throw new BadRequestException('Published year cannot be in the future');
    }
    const { authorId: _authorId, ...bookData } = dto;
    const book = this.booksRepository.create({ ...bookData, author });
    const savedBook = await this.booksRepository.save(book);
    await this.clearBooksCache();
    return savedBook;
  }
  async update(id: number, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    if (
      dto.publishedYear !== undefined &&
      dto.publishedYear > new Date().getFullYear()
    ) {
      throw new BadRequestException('Published year cannot be in the future');
    }
    if (dto.authorId !== undefined) {
      const author = await this.authorsRepository.findOneBy({
        id: dto.authorId,
      });
      if (!author) {
        throw new NotFoundException('Author not found');
      }
      book.author = author;
    }
    const { authorId: _authorId, ...bookData } = dto;
    Object.assign(book, bookData);
    const savedBook = await this.booksRepository.save(book);
    await this.clearBooksCache();
    return savedBook;
  }
  async remove(id: number): Promise<void> {
    await this.findOne(id);
    try {
      await this.booksRepository.delete(id);
      await this.clearBooksCache();
    } catch (error) {
      if (isPgError(error, PG_FOREIGN_KEY_VIOLATION)) {
        throw new ConflictException('Cannot delete a book that is in orders');
      }
      throw error;
    }
  }
}
