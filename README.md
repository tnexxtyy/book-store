# Book Store API

REST API для книжного магазина, разработанный на NestJS, TypeORM и PostgreSQL.

## Возможности

- **Books:** CRUD книг, поиск по названию, фильтрация по автору, сортировка и пагинация.
- **Authors:** CRUD авторов и получение связанных книг.
- **Users:** CRUD пользователей, проверка уникальности email.
- **Orders:** создание и просмотр заказов, изменение статуса, отмена заказов.
- **Stock management:** проверка наличия книг, списание остатков при заказе и возврат при отмене.
- **Validation:** проверка входных данных и обработка ошибок.
- **Database:** PostgreSQL с TypeORM migrations.

## Технологии

- Node.js
- TypeScript
- NestJS
- PostgreSQL
- TypeORM
- class-validator
- class-transformer

## Установка

```bash
git clone https://github.com/tnexxtyy/book-store.git
cd book-store
npm install
```

## Настройка окружения

Создай файл `.env` в корне проекта:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=book_store
```

Укажи собственный пароль PostgreSQL. Не загружай `.env` на GitHub.

## База данных

1. Создай базу данных PostgreSQL с именем `book_store`.
2. Проверь настройки подключения в `data-source.ts` (для миграций) и `src/app.module.ts` (для приложения).
3. Выполни миграции:

```bash
npm run migration:run
```

Новую миграцию создавай командой, а не руками, например: `npm run migration:generate -- src/migrations/AddBookDetails`.

## Запуск

Режим разработки:

```bash
npm run start:dev
```

Сборка:

```bash
npm run build
```

Запуск собранного приложения:

```bash
npm run start:prod
```

По умолчанию API доступен по адресу `http://localhost:3000`.

## Основные маршруты

| Метод | Маршрут | Описание |
|---|---|---|
| GET | `/books` | Список книг |
| GET | `/books/:id` | Книга по ID |
| POST | `/books` | Создать книгу |
| PATCH | `/books/:id` | Обновить книгу |
| DELETE | `/books/:id` | Удалить книгу (409, если она есть в заказах) |
| GET | `/authors` | Список авторов (пагинация) |
| POST | `/authors` | Создать автора |
| GET | `/authors/:id` | Автор с книгами |
| PATCH | `/authors/:id` | Обновить автора |
| DELETE | `/authors/:id` | Удалить автора без книг |
| GET | `/users` | Список пользователей (пагинация) |
| POST | `/users` | Создать пользователя |
| GET | `/users/:id` | Пользователь с заказами |
| PATCH | `/users/:id` | Обновить пользователя |
| DELETE | `/users/:id` | Удалить пользователя без заказов |
| GET | `/users/:id/orders` | Заказы пользователя |
| GET | `/orders` | Список заказов (пагинация) |
| GET | `/orders/:id` | Заказ с позициями |
| POST | `/orders` | Создать заказ |
| PATCH | `/orders/:id` | Изменить статус заказа |
| DELETE | `/orders/:id` | Удалить отменённый заказ |

## Примеры запросов

Создание пользователя:

```json
{
  "name": "Ivan",
  "email": "ivan@example.com",
  "age": 20
}
```

Создание книги:

```json
{
  "title": "1984",
  "description": "A dystopian novel",
  "price": 500,
  "publishedYear": 1949,
  "stock": 10,
  "authorId": 1
}
```

Создание заказа (позиции с количеством, до 20 позиций, количество от 1 до 10):

```json
{
  "userId": 1,
  "items": [{ "bookId": 1, "quantity": 2 }]
}
```

Отмена заказа:

```json
{
  "status": "cancelled"
}
```

Все примеры предполагают, что соответствующие записи уже существуют в базе данных.

## Параметры `GET /books`

- `page` — номер страницы, от 1 (по умолчанию 1)
- `limit` — книг на странице, от 1 до 100 (по умолчанию 20)
- `search` — поиск по названию без учёта регистра; символы `%` и `_` ищутся как обычные
- `authorId` — книги конкретного автора
- `sortBy` — одно из: `id`, `title`, `price`, `publishedYear`, `stock`, `createdAt`
- `order` — `ASC` или `DESC`

Неверный параметр даёт 400. Ответ списка имеет вид `{ data, total, page, limit, totalPages }`.

## Тесты

```bash
npm test                     # unit-тесты сервисов
createdb book_store_test
DB_NAME=book_store_test npm run migration:run
DB_NAME=book_store_test npm run test:e2e -- --runInBand
```

Тесты заказов идут на настоящем Postgres: блокировки и транзакции моками не проверить. `--runInBand` нужен, чтобы тесты не чистили одну базу параллельно.

## Проверка

Для ручной проверки API используй `requests.http` или Postman. Перед проверкой заказов убедись, что пользователь и книги существуют, а остаток книг достаточен.

## Статус проекта

Учебный проект для практики разработки REST API на NestJS с PostgreSQL и TypeORM.
