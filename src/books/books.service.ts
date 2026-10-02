import { Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto} from './dto/update-book.dto';
@Injectable()
export class BooksService {
  private books = [
    {
      id: 1,
      title: '1984',
      author: 'George Orwell',
      price: 500,
    },
    {
      id: 2,
      title: 'Мастер и Маргарита',
      author: 'Михаил Булгаков',
      price: 700,
    },
  ];

  getBooks() {
    return this.books;
  }

  createBook(createBookDto: CreateBookDto) {
    const newBook = {
      id: this.books.length + 1,
      ...createBookDto,
    };

    this.books.push(newBook);

    return newBook;
  }

  getBookById(id: number) {
    console.log('ID:', id);
    console.log('BOOKS:', this.books);

    const book = this.books.find((book) => book.id === id);

    console.log('FOUND:', book);

    return book;
  }


  updateBook(id:number,updateBookDto:UpdateBookDto){
    const book = this.books.find((book)=>book.id === id);

    if(!book){
      return null;
    }
    Object.assign(book,updateBookDto);

    return book;
  }

  deleteBook(id:number){
    const bookIndex = this.books.findIndex((book)=>book.id===id);
    if (bookIndex === -1){
      return null;
    }
    const deletedBook = this.books.splice(bookIndex,1);

    return deletedBook;
  }
}
