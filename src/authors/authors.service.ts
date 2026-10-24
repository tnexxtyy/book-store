import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from './entities/author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private readonly authorsRepository: Repository<Author>,
  ) {}
  async findAll(page = 1, limit = 20): Promise<Author[]> {
    return this.authorsRepository.find({
      relations: { books: true },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
  async findOne(id: number): Promise<Author> {
    const author = await this.authorsRepository.findOne({
      where: { id },
      relations: { books: true },
    });
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    return author;
  }
  async create(dto: CreateAuthorDto): Promise<Author> {
    if (dto.birthYear > new Date().getFullYear()) {
      throw new BadRequestException('Birth year cannot be in the future');
    }
    const author = this.authorsRepository.create(dto);
    return this.authorsRepository.save(author);
  }
  async update(id: number, dto: UpdateAuthorDto): Promise<Author> {
    const author = await this.findOne(id);
    if (
      dto.birthYear !== undefined &&
      dto.birthYear > new Date().getFullYear()
    ) {
      throw new BadRequestException('Birth year cannot be in the future');
    }
    Object.assign(author, dto);
    return this.authorsRepository.save(author);
  }
  async remove(id: number): Promise<void> {
    const author = await this.findOne(id);
    if (author.books.length > 0) {
      throw new ConflictException('Cannot delete an author who has books');
    }
    await this.authorsRepository.remove(author);
  }
}
