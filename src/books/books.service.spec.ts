
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BooksService } from './books.service';
import { Book } from '../authors/entities/book.entity';
import { Author } from '../authors/entities/author.entity';

describe('BooksService', () => {
  let service: BooksService;
  let repository: any;
  let authorRepository: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      skip: jest.fn(),
      take: jest.fn(),
      getManyAndCount: jest.fn(),
    };

    queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.skip.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    authorRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: repository,
        },
        {
          provide: getRepositoryToken(Author),
          useValue: authorRepository,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('возвращает список книг', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await expect(
      service.findAll({ page: 1, limit: 10 }),
    ).resolves.toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  });

  it('находит книгу по ID', async () => {
    const book = { id: 1, title: 'Test Book' };

    repository.findOne.mockResolvedValue(book);

    await expect(service.findOne(1)).resolves.toEqual(book);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: { author: true },
    });
  });

  it('создаёт книгу', async () => {
    const author = { id: 1, name: 'Test Author' };
    const bookData = {
      title: 'Test Book',
      price: 100,
      publishedYear: 2020,
      authorId: 1,
    };
    const book = {
      id: 1,
      title: 'Test Book',
      price: 100,
      publishedYear: 2020,
      author,
    };

    authorRepository.findOneBy.mockResolvedValue(author);
    repository.create.mockReturnValue(book);
    repository.save.mockResolvedValue(book);

    await expect(
      service.create(bookData as any),
    ).resolves.toEqual(book);

    expect(authorRepository.findOneBy).toHaveBeenCalledWith({
      id: 1,
    });
    expect(repository.save).toHaveBeenCalledWith(book);
  });

  it('обновляет книгу', async () => {
    const book = { id: 1, title: 'Test Book' };
    const updatedBook = { id: 1, title: 'Updated Book' };

    repository.findOne.mockResolvedValue(book);
    repository.save.mockImplementation(async (value: any) => value);

    await expect(
      service.update(1, { title: 'Updated Book' } as any),
    ).resolves.toEqual(updatedBook);

    expect(repository.save).toHaveBeenCalledWith(updatedBook);
  });

  it('удаляет существующую книгу', async () => {
    const book = { id: 1, title: 'Test Book' };

    repository.findOne.mockResolvedValue(book);
    repository.remove.mockResolvedValue(book);

    await expect(service.remove(1)).resolves.toBeUndefined();

    expect(repository.remove).toHaveBeenCalledWith(book);
  });

  it('выбрасывает 404 при удалении отсутствующей книги', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.remove(999)).rejects.toThrow(
      NotFoundException,
    );
  });
});
