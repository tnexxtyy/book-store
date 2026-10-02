import { Body, Controller, Get, Param, Post, Patch,Delete } from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto} from './dto/update-book.dto';

@Controller('books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Get()
  getBooks() {
    return this.booksService.getBooks();
  }

  @Get(':id')
  getBookById(@Param('id') id: string) {
    return this.booksService.getBookById(Number(id));
  }

  @Post()
  createBook(@Body() createBookDto: CreateBookDto) {
    return this.booksService.createBook(createBookDto);
  }

  @Patch(':id')
  updateBook(
    @Param('id')id: string,
    @Body() updateBookDto:UpdateBookDto,
  ){
    return this.booksService.updateBook(Number(id), updateBookDto);
  }

  @Delete(':id')
  deleteBook(@Param('id')id: string){
    return this.booksService.deleteBook(Number(id));
  }
}