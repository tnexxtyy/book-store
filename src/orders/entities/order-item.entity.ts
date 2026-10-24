import type { Relation } from 'typeorm';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Book } from '../../books/entities/book.entity';
import { Order } from './order.entity';

@Entity('order_items')
@Unique('UQ_order_items_order_book', ['order', 'book'])
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  // RESTRICT: книгу из заказа удалить нельзя, история не меняется задним числом.
  @ManyToOne(() => Book, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'book_id' })
  book: Relation<Book>;

  @Column({ type: 'integer' })
  quantity: number;

  // Цена за штуку на момент покупки: книга может подорожать, заказ — нет.
  @Column({ type: 'integer' })
  unitPrice: number;
}
