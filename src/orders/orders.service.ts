import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Book } from '../authors/entities/book.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    if (new Set(dto.bookIds).size !== dto.bookIds.length) {
      throw new BadRequestException('Duplicate book IDs are not allowed');
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const bookRepository = manager.getRepository(Book);
      const orderRepository = manager.getRepository(Order);

      const user = await userRepository.findOneBy({ id: dto.userId });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const books: Book[] = [];

      for (const bookId of dto.bookIds) {
        const book = await bookRepository
          .createQueryBuilder('book')
          .where('book.id = :bookId', { bookId })
          .setLock('pessimistic_write')
          .getOne();

        if (!book) {
          throw new NotFoundException(`Book ${bookId} not found`);
        }

        if (book.stock < 1) {
          throw new ConflictException(`Book "${book.title}" is out of stock`);
        }

        book.stock -= 1;
        await bookRepository.save(book);
        books.push(book);
      }

      const totalPrice = books.reduce(
        (total, book) => total + Number(book.price),
        0,
      );

      const order = orderRepository.create({
        user,
        books,
        totalPrice,
        status: OrderStatus.NEW,
      });

      return orderRepository.save(order);
    });
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: { user: true, books: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { user: true, books: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);
      const bookRepository = manager.getRepository(Book);

      // Lock only the order row, not nullable LEFT JOIN rows.
      const order = await orderRepository
        .createQueryBuilder('order')
        .where('order.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      const books = await orderRepository
        .createQueryBuilder('order')
        .relation(Order, 'books')
        .of(order)
        .loadMany<Book>();

      if (
        dto.status === OrderStatus.CANCELLED &&
        order.status !== OrderStatus.CANCELLED
      ) {
        for (const item of books) {
          const book = await bookRepository
            .createQueryBuilder('book')
            .where('book.id = :id', { id: item.id })
            .setLock('pessimistic_write')
            .getOne();

          if (book) {
            book.stock += 1;
            await bookRepository.save(book);
          }
        }
      }

      if (
        order.status === OrderStatus.CANCELLED &&
        dto.status !== OrderStatus.CANCELLED
      ) {
        throw new BadRequestException('A cancelled order cannot be reopened');
      }

      order.status = dto.status;
      await orderRepository.save(order);

      return orderRepository.findOneOrFail({
        where: { id },
        relations: { user: true, books: true },
      });
    });
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.CANCELLED) {
      throw new BadRequestException('Cancel the order before deleting it');
    }

    await this.ordersRepository.delete(id);
  }

  async findByUser(userId: number): Promise<Order[]> {
    const user = await this.dataSource
      .getRepository(User)
      .findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.ordersRepository.find({
      where: { user: { id: userId } },
      relations: { user: true, books: true },
      order: { id: 'DESC' },
    });
  }
}
