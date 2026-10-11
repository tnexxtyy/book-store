import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
  ) {}
  findAll(): Promise<Book[]> {
    return this.booksRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }
  async findOne(id: number): Promise<Book> {
    const book = await this.booksRepository.findOneBy({ id });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async create(createBookDto: CreateBookDto): Promise<Book> {
    const book: Book = this.booksRepository.create(createBookDto);
    return this.booksRepository.save(book);
  }
  async update(id: number, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    this.booksRepository.merge(book, dto);
    return this.booksRepository.save(book);
  }
  async remove(id: number): Promise<void> {
    const result = await this.booksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Book not found');
    }
  }
}
