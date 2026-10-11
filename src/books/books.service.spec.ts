import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BooksService } from './books.service';
import { Book } from './book.entity';

describe('BooksService', () => {
  let service: BooksService;

  const book: Book = {
    id: 1,
    title: 'Clean Code',
    author: 'Robert Martin',
    price: 1000,
  };

  const repository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    merge: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    repository.find.mockResolvedValue([book]);
    repository.findOne.mockResolvedValue(book);
    repository.findOneBy.mockResolvedValue(book);
    repository.create.mockImplementation((dto) => dto);
    repository.save.mockImplementation(async (value) => ({
      ...book,
      ...value,
    }));
    repository.merge.mockImplementation((entity, dto) =>
      Object.assign(entity, dto),
    );
    repository.delete.mockResolvedValue({ affected: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  it('возвращает список книг', async () => {
    await expect(service.findAll()).resolves.toEqual([book]);
  });

  it('находит книгу по ID', async () => {
    await expect(service.findOne(1)).resolves.toEqual(book);
  });

  it('создаёт книгу', async () => {
    const dto = {
      title: 'Clean Code',
      author: 'Robert Martin',
      price: 1000,
    };

    await expect(service.create(dto)).resolves.toMatchObject(dto);
  });

  it('обновляет книгу', async () => {
    const dto = { price: 1500 };

    await expect(service.update(1, dto)).resolves.toMatchObject(dto);
    expect(repository.merge).toHaveBeenCalled();
  });

  it('удаляет существующую книгу', async () => {
    await expect(service.remove(1)).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(1);
  });

  it('выбрасывает 404 при удалении отсутствующей книги', async () => {
    repository.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });
});
