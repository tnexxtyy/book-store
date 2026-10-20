import 'dotenv/config';
import { DataSource } from 'typeorm';

import { Author } from './src/authors/entities/author.entity';
import { Book } from './src/authors/entities/book.entity';
import { User } from './src/users/entities/user.entity';
import { Order } from './src/orders/entities/order.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'book_store',

  entities: [Author, Book, User, Order],
  migrations: ['src/migrations/*.ts'],

  synchronize: false,
});
