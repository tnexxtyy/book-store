import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    @InjectRepository(Author)
    private readonly authorsRepository: Repository<Author>,
  ) {}

  async findAll(query: FindBooksQueryDto): Promise<{
    data: Book[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit } = query;

    // Белый список защищает orderBy от инъекции, даже если сервис вызовут в обход DTO.
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
      // % и _ из запроса — обычные символы, а не шаблон LIKE.
      const search = query.search.trim().replace(/[\\%_]/g, '\\$&');
      qb.andWhere('book.title ILIKE :search', { search: `%${search}%` });
    }

    if (query.authorId !== undefined) {
      qb.andWhere('author.id = :authorId', { authorId: query.authorId });
    }

    const [data, total] = await qb
      .orderBy(`book.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

    return this.booksRepository.save(book);
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

    return this.booksRepository.save(book);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    try {
      // delete, а не remove: remove() сам удалил бы строки orders_books,
      // и книга молча пропала бы из заказов вопреки RESTRICT.
      await this.booksRepository.delete(id);
    } catch (error) {
      if (isPgError(error, PG_FOREIGN_KEY_VIOLATION)) {
        throw new ConflictException('Cannot delete a book that is in orders');
      }
      throw error;
    }
  }
}
