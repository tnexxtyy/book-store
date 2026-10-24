import type { Relation } from 'typeorm';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Author } from '../../authors/entities/author.entity';

@Entity('books')
@Check('CHK_books_stock', '"stock" >= 0')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'integer' })
  price: number;

  @Column({ type: 'integer' })
  publishedYear: number;

  @Column({ type: 'integer', default: 0 })
  stock: number;

  @CreateDateColumn()
  createdAt: Date;
  @ManyToOne(() => Author, (author) => author.books, {
    nullable: false,
  })
  @JoinColumn({ name: 'author_id' })
  author: Relation<Author>;
}
