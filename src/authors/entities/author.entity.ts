import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Book } from './book.entity';

@Entity('authors')
export class Author {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255 })
  country: string;

  @Column({ type: 'integer' })
  birthYear: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Book, (book) => book.author)
  books: Book[];
}