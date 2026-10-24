import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export const BOOK_SORT_FIELDS = [
  'id',
  'title',
  'price',
  'publishedYear',
  'stock',
  'createdAt',
] as const;

export class FindBooksQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  authorId?: number;

  @IsOptional()
  @IsIn(BOOK_SORT_FIELDS)
  sortBy?: (typeof BOOK_SORT_FIELDS)[number];

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC';
}
