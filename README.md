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
git clone <YOUR_REPOSITORY_URL>
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
2. Проверь настройки подключения в `src/data-source.ts` и `src/app.module.ts`.
3. Выполни доступные миграции проекта согласно настройкам TypeORM.

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
| DELETE | `/books/:id` | Удалить книгу |
| GET | `/books/author/:authorId` | Книги автора |
| GET | `/authors` | Список авторов |
| POST | `/authors` | Создать автора |
| GET | `/users` | Список пользователей |
| POST | `/users` | Создать пользователя |
| GET | `/users/:id/orders` | Заказы пользователя |
| GET | `/orders` | Список заказов |
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

Создание заказа:

```json
{
  "userId": 1,
  "bookIds": [1]
}
```

Отмена заказа:

```json
{
  "status": "cancelled"
}
```

Все примеры предполагают, что соответствующие записи уже существуют в базе данных.

## Проверка

Для тестирования API используй Postman. Перед проверкой заказов убедись, что пользователь и книги существуют, а остаток книг достаточен.

## Статус проекта

Учебный проект для практики разработки REST API на NestJS с PostgreSQL и TypeORM.
