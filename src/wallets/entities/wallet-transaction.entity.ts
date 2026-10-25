import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';

export enum WalletTransactionType {
  DEPOSIT = 'DEPOSIT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

@Entity('wallet_transactions')
@Index(['wallet', 'createdAt'])
@Index(['wallet', 'idempotencyKey'], { unique: true })
export class WalletTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Wallet, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column({
    type: 'enum',
    enum: WalletTransactionType,
  })
  type: WalletTransactionType;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'integer' })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  idempotencyKey: string | null;

  @Column({ type: 'integer', nullable: true })
  relatedWalletId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
