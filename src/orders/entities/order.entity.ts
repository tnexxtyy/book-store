import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Book } from '../../authors/entities/book.entity';

export enum OrderStatus {
  NEW = 'new',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.NEW,
  })
  status: OrderStatus;
  @Column({ type: 'integer', default: 0 })
  totalPrice: number;
  @CreateDateColumn()
  createdAt: Date;
  @ManyToOne(() => User, (user) => user.orders, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => Book, {
    nullable: false,
  })
  @JoinTable({
    name: 'orders_books',
    joinColumn: {
      name: 'order_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'book_id',
      referencedColumnName: 'id',
    },
  })
  books: Book[];
}
