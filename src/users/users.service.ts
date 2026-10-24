import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { isPgError, PG_UNIQUE_VIOLATION } from '../common/pg-error';

const EMAIL_TAKEN = 'Пользователь с таким email уже существует';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.usersRepository.findOneBy({ email });

    if (existingUser) {
      throw new ConflictException(EMAIL_TAKEN);
    }

    const user = this.usersRepository.create({
      name: dto.name,
      age: dto.age,
      email,
    });

    return this.saveUser(user);
  }

  async findAll(page = 1, limit = 20): Promise<User[]> {
    return this.usersRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { orders: true },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();

      if (email !== user.email) {
        const existingUser = await this.usersRepository.findOneBy({ email });

        if (existingUser) {
          throw new ConflictException(EMAIL_TAKEN);
        }
      }

      dto.email = email;
    }

    Object.assign(user, dto);

    return this.saveUser(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { orders: true },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    if (user.orders.length > 0) {
      throw new ConflictException(
        'Нельзя удалить пользователя, у которого есть заказы',
      );
    }

    await this.usersRepository.remove(user);
  }

  // Проверка выше даёт понятный ответ в обычном случае, но два одновременных
  // запроса она пропустит оба — второй упрётся в UQ_users_email.
  private async saveUser(user: User): Promise<User> {
    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (isPgError(error, PG_UNIQUE_VIOLATION)) {
        throw new ConflictException(EMAIL_TAKEN);
      }
      throw error;
    }
  }
}
