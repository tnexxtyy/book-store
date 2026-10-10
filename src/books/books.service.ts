import{Injectable,NotFoundException} from '@nestjs/common';
import{InjectRepository} from '@nestjs/typeorm';
import{Repository} from 'typeorm';
import{Book} from'./book.entity';
import{CreateBookDto}from './dto/create-book.dto';
import{UpdateBookDto} from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
  ) {}
  async findAll():Promise<Book[]>{
    return this.booksRepository.find();
  }
  async findOne(id:number):Promise<Book>{
    const book = await this.booksRepository.findOneBy({id});

    if (!book){
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  async create(createBookDto:CreateBookDto):Promise<Book>{
    const book: Book = this.booksRepository.create(createBookDto);
    return this.booksRepository.save(book);
  }
  async update(
    id:number,
    updateBookDto:UpdateBookDto,
  ):Promise<Book>{
    await this.findOne(id);
    await this.booksRepository.update(id, updateBookDto);


    return this.findOne(id);

  }

  async remove(id:number):Promise<{message:string}>{
    await this.findOne(id);

    await this.booksRepository.delete(id);

    return {message:'Book deleted'};
  }
}