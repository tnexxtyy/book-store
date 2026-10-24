import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Book } from '../authors/entities/book.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let dataSource: { transaction: jest.Mock };
  let orderRepository: any;
  let userRepository: any;
  let bookRepository: any;
  let orderQueryBuilder: any;
  let bookQueryBuilder: any;
  let manager: any;

  beforeEach(async () => {
    orderQueryBuilder = {
      where: jest.fn(),
      setLock: jest.fn(),
      getOne: jest.fn(),
      relation: jest.fn(),
      of: jest.fn(),
      loadMany: jest.fn(),
    };

    orderQueryBuilder.where.mockReturnValue(orderQueryBuilder);
    orderQueryBuilder.setLock.mockReturnValue(orderQueryBuilder);
    orderQueryBuilder.relation.mockReturnValue(orderQueryBuilder);
    orderQueryBuilder.of.mockReturnValue(orderQueryBuilder);

    bookQueryBuilder = {
      where: jest.fn(),
      setLock: jest.fn(),
      getOne: jest.fn(),
    };

    bookQueryBuilder.where.mockReturnValue(bookQueryBuilder);
    bookQueryBuilder.setLock.mockReturnValue(bookQueryBuilder);

    orderRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(orderQueryBuilder),
      create: jest.fn(),
      save: jest.fn(),
      findOneOrFail: jest.fn(),
    };

    userRepository = {
      findOneBy: jest.fn(),
    };

    bookRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(bookQueryBuilder),
      save: jest.fn(),
    };

    manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Order) return orderRepository;
        if (entity === User) return userRepository;
        if (entity === Book) return bookRepository;
        throw new Error('Unexpected entity');
      }),
    };

    dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('запрещает повторяющиеся ID книг при создании заказа', async () => {
    await expect(
      service.create({
        userId: 1,
        bookIds: [1, 1],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('выбрасывает 404, если пользователь не найден', async () => {
    userRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({
        userId: 999,
        bookIds: [1],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('выбрасывает 404, если книга не найдена', async () => {
    userRepository.findOneBy.mockResolvedValue({
      id: 1,
    });

    bookQueryBuilder.getOne.mockResolvedValue(null);

    await expect(
      service.create({
        userId: 1,
        bookIds: [999],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('выбрасывает 409, если книги нет в наличии', async () => {
    userRepository.findOneBy.mockResolvedValue({
      id: 1,
    });

    bookQueryBuilder.getOne.mockResolvedValue({
      id: 1,
      title: 'Test Book',
      price: 100,
      stock: 0,
    });

    await expect(
      service.create({
        userId: 1,
        bookIds: [1],
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('запрещает переход из отменённого заказа в другой статус', async () => {
    orderQueryBuilder.getOne.mockResolvedValue({
      id: 1,
      status: OrderStatus.CANCELLED,
    });

    await expect(
      service.update(1, {
        status: OrderStatus.PAID,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('выбрасывает 404, если заказ не найден при обновлении', async () => {
    orderQueryBuilder.getOne.mockResolvedValue(null);

    await expect(
      service.update(999, {
        status: OrderStatus.CANCELLED,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
