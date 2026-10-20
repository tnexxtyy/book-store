import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

export class CreateOrderDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  bookIds: number[];
}
