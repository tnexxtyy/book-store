import{IsNumber,IsString,Min,IsNotEmpty} from 'class-validator';
export class CreateBookDto{
  @IsString()
  @IsNotEmpty()
  title:string;

  @IsString()
  @IsNotEmpty()
  author:string;

  @IsNumber()
  @Min(0)
  price:number;
}