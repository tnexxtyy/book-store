import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthorsService } from './authors.service';
import { Author } from './entities/author.entity';

describe('AuthorsService', () => {
  let service: AuthorsService;

  const authorsRepository = {
    find: jest.fn<(...args: any[]) => Promise<any>>(),
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    create: jest.fn<(...args: any[]) => any>(),
    save: jest.fn<(...args: any[]) => Promise<any>>(),
    remove: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        {
          provide: getRepositoryToken(Author),
          useValue: authorsRepository,
        },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
  });

  it('возвращает список авторов', async () => {
    const authors = [{ id: 1, name: 'Author', books: [] }];
    authorsRepository.find.mockResolvedValue(authors);

    await expect(service.findAll()).resolves.toEqual(authors);
  });

  it('выбрасывает 404, если автор не найден', async () => {
    authorsRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('создаёт автора', async () => {
    const dto = {
      name: 'Author',
      country: 'Germany',
      birthYear: 1990,
    };
    const author = { id: 1, ...dto };

    authorsRepository.create.mockReturnValue(author);
    authorsRepository.save.mockResolvedValue(author);

    await expect(service.create(dto)).resolves.toEqual(author);
  });

  it('запрещает создавать автора с годом рождения в будущем', async () => {
    const dto = {
      name: 'Author',
      country: 'Germany',
      birthYear: new Date().getFullYear() + 1,
    };

    await expect(service.create(dto)).rejects.toThrow(BadRequestException);
  });

  it('запрещает удалять автора, у которого есть книги', async () => {
    authorsRepository.findOne.mockResolvedValue({
      id: 1,
      books: [{ id: 10 }],
    });

    await expect(service.remove(1)).rejects.toThrow(ConflictException);

    expect(authorsRepository.remove).not.toHaveBeenCalled();
  });

  it('удаляет автора без книг', async () => {
    const author = { id: 1, books: [] };
    authorsRepository.findOne.mockResolvedValue(author);
    authorsRepository.remove.mockResolvedValue(author);

    await expect(service.remove(1)).resolves.toBeUndefined();

    expect(authorsRepository.remove).toHaveBeenCalledWith(author);
  });
});
