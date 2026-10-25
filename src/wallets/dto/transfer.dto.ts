import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class TransferDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  toUserId: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  amount: number;
}
