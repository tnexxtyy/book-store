import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: any;

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('создаёт пользователя и нормализует email', async () => {
    const dto = {
      name: 'Test User',
      email: '  Test@Mail.com ',
      age: 20,
    };

    const user = {
      id: 1,
      name: 'Test User',
      email: 'test@mail.com',
      age: 20,
    };

    repository.findOneBy.mockResolvedValue(null);
    repository.create.mockReturnValue(user);
    repository.save.mockResolvedValue(user);

    await expect(service.create(dto)).resolves.toEqual(user);

    expect(repository.findOneBy).toHaveBeenCalledWith({
      email: 'test@mail.com',
    });

    expect(repository.create).toHaveBeenCalledWith({
      ...dto,
      email: 'test@mail.com',
    });
  });

  it('запрещает создание пользователя с существующим email', async () => {
    repository.findOneBy.mockResolvedValue({
      id: 1,
      email: 'test@mail.com',
    });

    await expect(
      service.create({
        name: 'Another User',
        email: 'TEST@MAIL.COM',
        age: 25,
      }),
    ).rejects.toThrow(ConflictException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('выбрасывает 404, если пользователь не найден', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('обновляет email с нормализацией', async () => {
    const user = {
      id: 1,
      name: 'Test User',
      email: 'old@mail.com',
      age: 20,
      orders: [],
    };

    repository.findOne.mockResolvedValue(user);
    repository.findOneBy.mockResolvedValue(null);
    repository.save.mockImplementation(async (value: any) => value);

    const result = await service.update(1, {
      email: '  NEW@MAIL.COM ',
    });

    expect(result.email).toBe('new@mail.com');
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@mail.com',
      }),
    );
  });

  it('запрещает обновление на занятый email', async () => {
    const user = {
      id: 1,
      email: 'first@mail.com',
      orders: [],
    };

    repository.findOne.mockResolvedValue(user);
    repository.findOneBy.mockResolvedValue({
      id: 2,
      email: 'second@mail.com',
    });

    await expect(
      service.update(1, {
        email: 'SECOND@MAIL.COM',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
