import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './books.controller';
import { Book } from '../authors/entities/book.entity';
import { BooksService } from './books.service';
import { Author} from '../authors/entities/author.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book,Author])],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
