import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';
import { Book } from './src/books/book.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'book_store',
  entities: [Book],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});