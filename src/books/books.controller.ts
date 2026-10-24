import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from '../authors/entities/book.entity';
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}
  @Get()
  getBooks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('authorId') authorId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    return this.booksService.findAll({
      page: page === undefined ? undefined : Number(page),
      limit: limit === undefined ? undefined : Number(limit),
      search,
      authorId: authorId === undefined ? undefined : Number(authorId),
      sortBy,
      order,
    });
  }
  @Get('author/:authorId')
  getBooksByAuthor(
    @Param('authorId', ParseIntPipe) authorId: number,
  ): Promise<Book[]> {
    return this.booksService.findByAuthor(authorId);
  }
  @Get(':id')
  getBookById(@Param('id', ParseIntPipe) id: number): Promise<Book> {
    return this.booksService.findOne(id);
  }
  @Post()
  createBook(@Body() dto: CreateBookDto): Promise<Book> {
    return this.booksService.create(dto);
  }
  @Patch(':id')
  updateBook(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookDto,
  ): Promise<Book> {
    return this.booksService.update(id, dto);
  }
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.booksService.remove(id);
  }
}
