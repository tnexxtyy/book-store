
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../authors/entities/book.entity';
import { Author } from '../authors/entities/author.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,

    @InjectRepository(Author)
    private readonly authorsRepository: Repository<Author>,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    authorId?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }): Promise<{
    data: Book[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const allowedSortFields = [
      'id',
      'title',
      'price',
      'publishedYear',
      'stock',
      'createdAt',
    ];
    const sortBy = allowedSortFields.includes(query.sortBy ?? '')
      ? query.sortBy!
      : 'id';
    const order = query.order === 'DESC' ? 'DESC' : 'ASC';

    const qb = this.booksRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author');

    if (query.search?.trim()) {
      qb.andWhere('LOWER(book.title) LIKE LOWER(:search)', {
        search: `%${query.search.trim()}%`,
      });
    }

    if (query.authorId !== undefined && query.authorId !== null) {
      const authorId = Number(query.authorId);

      if (!Number.isInteger(authorId) || authorId < 1) {
        throw new BadRequestException('authorId must be a positive integer');
      }

      qb.andWhere('author.id = :authorId', { authorId });
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

  async findByAuthor(authorId: number): Promise<Book[]> {
    const author = await this.authorsRepository.findOneBy({ id: authorId });

    if (!author) {
      throw new NotFoundException('Author not found');
    }

    return this.booksRepository.find({
      where: { author: { id: authorId } },
      relations: { author: true },
      order: { id: 'ASC' },
    });
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

    const { authorId, ...bookData } = dto;
    const book = this.booksRepository.create({
      ...bookData,
      author,
    });

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

    const { authorId, ...bookData } = dto;
    Object.assign(book, bookData);

    return this.booksRepository.save(book);
  }

  async remove(id: number): Promise<void> {
    const book = await this.findOne(id);
    await this.booksRepository.remove(book);
  }
}











