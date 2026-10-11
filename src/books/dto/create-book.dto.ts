import {
  IsNumber,
  IsString,
  Min,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
export class CreateBookDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(255)
  author: string;

  @IsNumber()
  @Min(0)
  price: number;
}
