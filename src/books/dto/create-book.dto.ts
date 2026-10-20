import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  publishedYear: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  authorId: number;
}
