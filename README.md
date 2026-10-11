# Book Store API

REST API для управления книгами. Проект создан на NestJS, TypeScript и PostgreSQL.

## Возможности

- Создание книги
- Получение списка книг
- Получение книги по ID
- Обновление книги
- Удаление книги
- Проверка входных данных
- Хранение книг в PostgreSQL
- Миграции базы данных
- Автоматические тесты

## Технологии

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Jest

## Установка

Установи зависимости:

```bash
npm install
```

Создай файл `.env` в корне проекта и добавь настройки подключения к PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=book_store
```

Вместо `your_password` укажи пароль от PostgreSQL в своём локальном `.env`.

## Запуск

```bash
npm run start:dev
```

API будет доступно по адресу `http://localhost:3000`.

## Эндпоинты

| Метод | Адрес | Назначение |
|---|---|---|
| GET | `/books` | Получить все книги |
| GET | `/books/:id` | Получить книгу по ID |
| POST | `/books` | Создать книгу |
| PATCH | `/books/:id` | Обновить книгу |
| DELETE | `/books/:id` | Удалить книгу |

## Проверки

```bash
npx tsc --noEmit
npm run test
npm run format
```

## Безопасность

Не публикуй файл `.env` и пароли в GitHub.