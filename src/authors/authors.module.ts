import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Author } from './entities/author.entity';
import { Book } from './entities/book.entity';
import { AuthorsService } from './authors.service';
import { AuthorsController } from './authors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Author, Book])],
  controllers: [AuthorsController],
  providers: [AuthorsService],
  exports: [AuthorsService],
})
export class AuthorsModule {}
