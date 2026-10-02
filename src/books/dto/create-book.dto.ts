import{IsNumber,IsString,Min} from 'class-validator';
export class CreateBookDto{
  @IsString()
  title:string;

  @IsString()
  author:string;

  @IsNumber()
  @Min(0)
  price:number;
}