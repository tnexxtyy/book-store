import { Injectable } from '@nestjs/common';
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

  async findAll() {
    return this.booksRepository.find();
  }

  async findOne(id: number) {
    return this.booksRepository.findOneBy({ id });
  }

  async create(createBookDto: CreateBookDto) {
    const book = this.booksRepository.create(createBookDto);

    return this.booksRepository.save(book);
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    await this.booksRepository.update(id, updateBookDto);

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.booksRepository.delete(id);

    return { message: 'Book deleted' };
  }
}
