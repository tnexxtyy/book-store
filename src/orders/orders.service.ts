import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

// Из какого статуса в какой можно перейти. cancelled — конечный: остатки уже
// вернулись на склад, и второй раз списать их нельзя.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.NEW]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.CANCELLED],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    const bookIds = dto.items.map((item) => item.bookId);

    if (new Set(bookIds).size !== bookIds.length) {
      throw new BadRequestException('Duplicate book IDs are not allowed');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).findOneBy({
        id: dto.userId,
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const books = await this.lockBooks(manager, bookIds);

      const missing = bookIds.filter(
        (id) => !books.some((book) => book.id === id),
      );
      if (missing.length > 0) {
        throw new NotFoundException(`Books not found: ${missing.join(', ')}`);
      }

      const outOfStock = dto.items.filter((item) => {
        const book = books.find((b) => b.id === item.bookId)!;
        return book.stock < item.quantity;
      });
      if (outOfStock.length > 0) {
        const titles = outOfStock
          .map((item) => {
            const book = books.find((b) => b.id === item.bookId)!;
            return `"${book.title}"`;
          })
          .join(', ');
        throw new ConflictException(`Out of stock: ${titles}`);
      }

      const items = dto.items.map((line) => {
        const book = books.find((b) => b.id === line.bookId)!;
        book.stock -= line.quantity;

        return manager.getRepository(OrderItem).create({
          book,
          quantity: line.quantity,
          unitPrice: book.price,
        });
      });

      await manager.getRepository(Book).save(books);

      const totalPrice = items.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0,
      );

      const orderRepository = manager.getRepository(Order);
      return orderRepository.save(
        orderRepository.create({
          user,
          items,
          totalPrice,
          status: OrderStatus.NEW,
        }),
      );
    });
  }

  async findAll(page = 1, limit = 20): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: { user: true, items: { book: true } },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { user: true, items: { book: true } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: number, dto: UpdateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);

      // Блокируем только строку заказа: FOR UPDATE нельзя повесить на nullable-сторону LEFT JOIN.
      const order = await orderRepository
        .createQueryBuilder('order')
        .where('order.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (dto.status !== order.status) {
        if (!ALLOWED_TRANSITIONS[order.status].includes(dto.status)) {
          throw new BadRequestException(
            `Cannot change order status from ${order.status} to ${dto.status}`,
          );
        }

        if (dto.status === OrderStatus.CANCELLED) {
          await this.returnStock(manager, id);
        }

        order.status = dto.status;
        await orderRepository.save(order);
      }

      return orderRepository.findOneOrFail({
        where: { id },
        relations: { user: true, items: { book: true } },
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
      relations: { user: true, items: { book: true } },
      order: { id: 'DESC' },
    });
  }

  // Возвращает остатки по позициям заказа; вызывается внутри транзакции.
  private async returnStock(manager: EntityManager, orderId: number) {
    const items = await manager.getRepository(OrderItem).find({
      where: { order: { id: orderId } },
      relations: { book: true },
    });

    const books = await this.lockBooks(
      manager,
      items.map((item) => item.book.id),
    );

    for (const book of books) {
      const item = items.find((i) => i.book.id === book.id)!;
      book.stock += item.quantity;
    }

    await manager.getRepository(Book).save(books);
  }

  // Все книги одним запросом и всегда по возрастанию id: если два заказа берут
  // блокировки в разном порядке, каждый ждёт строку другого, и Postgres
  // обрывает одну транзакцию с deadlock.
  private async lockBooks(
    manager: EntityManager,
    bookIds: number[],
  ): Promise<Book[]> {
    if (bookIds.length === 0) {
      return [];
    }

    return manager.getRepository(Book).find({
      where: { id: In(bookIds) },
      order: { id: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });
  }
}
