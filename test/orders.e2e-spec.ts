import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

// Работает на настоящем Postgres: тесты заказов проверяют транзакции и блокировки,
// а моками это не проверить. Запуск: DB_NAME=book_store_test npm run test:e2e -- --runInBand
describe('Orders (e2e)', () => {
  let app: INestApplication;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Те же настройки, что в main.ts: без них тест проверял бы другое приложение.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(async () => {
    await app
      .get(DataSource)
      .query(
        'TRUNCATE order_items, orders, books, authors, users RESTART IDENTITY CASCADE',
      );
  });

  async function seed(stock: number, price = 500) {
    const author = await api()
      .post('/authors')
      .send({ name: 'George Orwell', country: 'UK', birthYear: 1903 })
      .expect(201);

    const book = await api()
      .post('/books')
      .send({
        title: '1984',
        description: 'Novel',
        price,
        publishedYear: 1949,
        stock,
        authorId: author.body.id,
      })
      .expect(201);

    const user = await api()
      .post('/users')
      .send({ name: 'Ivan', email: 'ivan@example.com', age: 20 })
      .expect(201);

    return { bookId: book.body.id as number, userId: user.body.id as number };
  }

  it('не продаёт последний экземпляр дважды', async () => {
    const { bookId, userId } = await seed(1);

    const statuses = await Promise.all(
      [1, 2].map(() =>
        api()
          .post('/orders')
          .send({ userId, items: [{ bookId, quantity: 1 }] })
          .then((res) => res.status),
      ),
    );

    expect(statuses.sort((a, b) => a - b)).toEqual([201, 409]);

    const book = await api().get(`/books/${bookId}`).expect(200);
    expect(book.body.stock).toBe(0);
  });

  it('отмена возвращает остаток один раз', async () => {
    const { bookId, userId } = await seed(2);

    const order = await api()
      .post('/orders')
      .send({ userId, items: [{ bookId, quantity: 1 }] })
      .expect(201);

    await api()
      .patch(`/orders/${order.body.id}`)
      .send({ status: 'cancelled' })
      .expect(200);
    await api()
      .patch(`/orders/${order.body.id}`)
      .send({ status: 'cancelled' })
      .expect(200);

    const book = await api().get(`/books/${bookId}`).expect(200);
    expect(book.body.stock).toBe(2);
  });

  it('заказ с количеством списывает нужное число экземпляров и считает сумму', async () => {
    const { bookId, userId } = await seed(10, 300);

    const order = await api()
      .post('/orders')
      .send({ userId, items: [{ bookId, quantity: 3 }] })
      .expect(201);

    expect(order.body.totalPrice).toBe(900);
    expect(order.body.items[0].quantity).toBe(3);
    expect(order.body.items[0].unitPrice).toBe(300);

    const book = await api().get(`/books/${bookId}`).expect(200);
    expect(book.body.stock).toBe(7);
  });

  it('если одной из книг не хватает — 409 и остатки других книг не меняются', async () => {
    const { bookId: enough, userId } = await seed(5);
    const author = await api().get('/authors').expect(200);
    const scarce = await api()
      .post('/books')
      .send({
        title: 'Rare',
        description: 'Single copy',
        price: 100,
        publishedYear: 2000,
        stock: 0,
        authorId: author.body[0].id,
      })
      .expect(201);

    await api()
      .post('/orders')
      .send({
        userId,
        items: [
          { bookId: enough, quantity: 1 },
          { bookId: scarce.body.id, quantity: 1 },
        ],
      })
      .expect(409);

    const book = await api().get(`/books/${enough}`).expect(200);
    expect(book.body.stock).toBe(5);
  });

  it('несуществующая книга — 404 и остатки не меняются', async () => {
    const { bookId, userId } = await seed(3);

    await api()
      .post('/orders')
      .send({
        userId,
        items: [
          { bookId, quantity: 1 },
          { bookId: 999999, quantity: 1 },
        ],
      })
      .expect(404);

    const book = await api().get(`/books/${bookId}`).expect(200);
    expect(book.body.stock).toBe(3);
  });

  it('повтор id книги в заказе — 400', async () => {
    const { bookId, userId } = await seed(3);

    await api()
      .post('/orders')
      .send({
        userId,
        items: [
          { bookId, quantity: 1 },
          { bookId, quantity: 1 },
        ],
      })
      .expect(400);
  });

  it('из cancelled нельзя выйти, paid → new — 400', async () => {
    const { bookId, userId } = await seed(3);

    const order = await api()
      .post('/orders')
      .send({ userId, items: [{ bookId, quantity: 1 }] })
      .expect(201);

    await api()
      .patch(`/orders/${order.body.id}`)
      .send({ status: 'paid' })
      .expect(200);
    await api()
      .patch(`/orders/${order.body.id}`)
      .send({ status: 'new' })
      .expect(400);

    await api()
      .patch(`/orders/${order.body.id}`)
      .send({ status: 'cancelled' })
      .expect(200);
    await api()
      .patch(`/orders/${order.body.id}`)
      .send({ status: 'paid' })
      .expect(400);
  });

  it('удалить можно только отменённый заказ', async () => {
    const { bookId, userId } = await seed(3);

    const order = await api()
      .post('/orders')
      .send({ userId, items: [{ bookId, quantity: 1 }] })
      .expect(201);

    await api().delete(`/orders/${order.body.id}`).expect(400);

    await api()
      .patch(`/orders/${order.body.id}`)
      .send({ status: 'cancelled' })
      .expect(200);
    await api().delete(`/orders/${order.body.id}`).expect(204);
  });

  it('встречные заказы [1,2] и [2,1] не дают 500', async () => {
    const { bookId: first, userId } = await seed(20);
    const author = await api().get('/authors').expect(200);
    const second = await api()
      .post('/books')
      .send({
        title: 'Animal Farm',
        description: 'Fable',
        price: 200,
        publishedYear: 1945,
        stock: 20,
        authorId: author.body[0].id,
      })
      .expect(201);

    const statuses = await Promise.all(
      Array.from({ length: 10 }).flatMap(() => [
        api()
          .post('/orders')
          .send({
            userId,
            items: [
              { bookId: first, quantity: 1 },
              { bookId: second.body.id, quantity: 1 },
            ],
          })
          .then((res) => res.status),
        api()
          .post('/orders')
          .send({
            userId,
            items: [
              { bookId: second.body.id, quantity: 1 },
              { bookId: first, quantity: 1 },
            ],
          })
          .then((res) => res.status),
      ]),
    );

    for (const status of statuses) {
      expect([201, 409]).toContain(status);
    }
  });

  it('книгу из заказа нельзя удалить — 409', async () => {
    const { bookId, userId } = await seed(3);

    await api()
      .post('/orders')
      .send({ userId, items: [{ bookId, quantity: 1 }] })
      .expect(201);

    await api().delete(`/books/${bookId}`).expect(409);
    await api().get(`/books/${bookId}`).expect(200);
  });
});
