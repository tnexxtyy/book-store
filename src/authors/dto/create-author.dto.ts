import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateAuthorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(new Date().getFullYear())
  birthYear: number;
}
