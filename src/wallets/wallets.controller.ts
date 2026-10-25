import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { TransferDto } from './dto/transfer.dto';
import { DepositDto } from './dto/deposit.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post(':userId')
  createWallet(@Param('userId', ParseIntPipe) userId: number) {
    return this.walletsService.createWallet(userId);
  }

  @Get(':userId/balance')
  getBalance(@Param('userId', ParseIntPipe) userId: number) {
    return this.walletsService.getBalance(userId);
  }

  @Get(':userId/transactions')
  getTransactions(@Param('userId', ParseIntPipe) userId: number) {
    return this.walletsService.getTransactions(userId);
  }

  @Post(':userId/deposit')
  deposit(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: DepositDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return this.walletsService.deposit(userId, dto.amount, idempotencyKey);
  }

  @Post(':userId/transfer')
  transfer(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: TransferDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return this.walletsService.transfer(userId, dto, idempotencyKey);
  }
}
