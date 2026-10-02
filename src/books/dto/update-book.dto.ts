import{IsNumber,IsString,IsOptional,Min}from 'class-validator';

export class UpdateBookDto{
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price: number;
}