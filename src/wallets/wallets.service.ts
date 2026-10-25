import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import {
  WalletTransaction,
  WalletTransactionType,
} from './entities/wallet-transaction.entity';
import { User } from '../users/entities/user.entity';
import { TransferDto } from './dto/transfer.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
    private readonly dataSource: DataSource,
  ) {}

  async createWallet(userId: number): Promise<Wallet> {
    const user = await this.dataSource.getRepository(User).findOneBy({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.walletsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existing) {
      throw new ConflictException('Wallet already exists');
    }

    return this.walletsRepository.save(
      this.walletsRepository.create({ user, balance: 0 }),
    );
  }

  async getBalance(userId: number): Promise<number> {
    const wallet = await this.walletsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet.balance;
  }

  async getTransactions(userId: number): Promise<WalletTransaction[]> {
    const wallet = await this.walletsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.dataSource.getRepository(WalletTransaction).find({
      where: { wallet: { id: wallet.id } },
      order: { id: 'DESC' },
    });
  }

  async deposit(
    userId: number,
    amount: number,
    idempotencyKey: string,
  ): Promise<{ balance: number }> {
    this.validateRequest(amount, idempotencyKey);

    return this.dataSource.transaction(async (manager) => {
      const wallets = manager.getRepository(Wallet);
      const transactions = manager.getRepository(WalletTransaction);

      const wallet = await wallets
        .createQueryBuilder('wallet')
        .innerJoin('wallet.user', 'user')
        .where('user.id = :userId', { userId })
        .setLock('pessimistic_write')
        .getOne();

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const previous = await transactions.findOne({
        where: {
          wallet: { id: wallet.id },
          idempotencyKey,
        },
      });

      if (previous) {
        if (
          previous.type !== WalletTransactionType.DEPOSIT ||
          previous.amount !== amount
        ) {
          throw new ConflictException(
            'Idempotency key was already used for another request',
          );
        }

        return { balance: wallet.balance };
      }

      wallet.balance += amount;
      await wallets.save(wallet);

      await transactions.save(
        transactions.create({
          wallet,
          type: WalletTransactionType.DEPOSIT,
          amount,
          balanceAfter: wallet.balance,
          idempotencyKey,
          relatedWalletId: null,
        }),
      );

      return { balance: wallet.balance };
    });
  }

  async transfer(
    fromUserId: number,
    dto: TransferDto,
    idempotencyKey: string,
  ): Promise<{ fromBalance: number; toBalance: number }> {
    this.validateRequest(dto.amount, idempotencyKey);

    if (!Number.isSafeInteger(dto.toUserId) || dto.toUserId <= 0) {
      throw new BadRequestException(
        'Recipient user ID must be a positive integer',
      );
    }

    if (fromUserId === dto.toUserId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    return this.dataSource.transaction(async (manager) => {
      const wallets = manager.getRepository(Wallet);
      const transactions = manager.getRepository(WalletTransaction);

      // Lock both wallets in ascending user ID order to reduce deadlocks.
      const orderedUserIds = [fromUserId, dto.toUserId].sort((a, b) => a - b);
      const lockedWallets: Wallet[] = [];

      for (const userId of orderedUserIds) {
        const wallet = await wallets
          .createQueryBuilder('wallet')
          .innerJoinAndSelect('wallet.user', 'user')
          .where('user.id = :userId', { userId })
          .setLock('pessimistic_write')
          .getOne();

        if (!wallet) {
          throw new NotFoundException(`Wallet for user ${userId} not found`);
        }

        lockedWallets.push(wallet);
      }

      const sender = lockedWallets.find(
        (wallet) => wallet.user.id === fromUserId,
      )!;

      const recipient = lockedWallets.find(
        (wallet) => wallet.user.id === dto.toUserId,
      )!;

      // Check idempotency only after locking the sender wallet.
      const previous = await transactions.findOne({
        where: {
          wallet: { id: sender.id },
          idempotencyKey,
        },
      });

      if (previous) {
        if (
          previous.type !== WalletTransactionType.TRANSFER_OUT ||
          previous.amount !== dto.amount ||
          previous.relatedWalletId !== recipient.id
        ) {
          throw new ConflictException(
            'Idempotency key was already used for another request',
          );
        }

        const recipientEntry = await transactions.findOne({
          where: {
            wallet: { id: recipient.id },
            idempotencyKey,
            type: WalletTransactionType.TRANSFER_IN,
            relatedWalletId: sender.id,
          },
        });

        if (!recipientEntry || recipientEntry.amount !== dto.amount) {
          throw new ConflictException('Previous transfer is incomplete');
        }

        return {
          fromBalance: sender.balance,
          toBalance: recipient.balance,
        };
      }

      if (sender.balance < dto.amount) {
        throw new ConflictException('Insufficient funds');
      }

      sender.balance -= dto.amount;
      recipient.balance += dto.amount;

      await wallets.save([sender, recipient]);

      await transactions.save([
        transactions.create({
          wallet: sender,
          type: WalletTransactionType.TRANSFER_OUT,
          amount: dto.amount,
          balanceAfter: sender.balance,
          idempotencyKey,
          relatedWalletId: recipient.id,
        }),
        transactions.create({
          wallet: recipient,
          type: WalletTransactionType.TRANSFER_IN,
          amount: dto.amount,
          balanceAfter: recipient.balance,
          idempotencyKey,
          relatedWalletId: sender.id,
        }),
      ]);

      return {
        fromBalance: sender.balance,
        toBalance: recipient.balance,
      };
    });
  }

  private validateRequest(amount: number, idempotencyKey: string): void {
    if (
      typeof idempotencyKey !== 'string' ||
      !idempotencyKey.trim() ||
      idempotencyKey.length > 100
    ) {
      throw new BadRequestException(
        'A valid Idempotency-Key header is required (max 100 characters)',
      );
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be a positive integer');
    }
  }
}
