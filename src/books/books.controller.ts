import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Controller('books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Get()
  getBooks() {
    return this.booksService.findAll();
  }

  @Get(':id')
  getBookById(@Param('id') id: string) {
    return this.booksService.findOne(Number(id));
  }

  @Post()
  createBook(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Patch(':id')
  updateBook(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.update(Number(id), updateBookDto);
  }

  @Delete(':id')
  deleteBook(@Param('id') id: string) {
    return this.booksService.remove(Number(id));
  }
}
