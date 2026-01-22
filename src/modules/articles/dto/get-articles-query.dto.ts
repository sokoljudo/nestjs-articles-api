import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsIn,
  IsISO8601,
} from 'class-validator';

export class GetArticlesQueryDto {
  @ApiPropertyOptional({
    description: 'Номер страницы для пагинации',
    example: 1,
    minimum: 1,
    default: 1,
    type: Number,
  })
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Количество статей на странице',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    type: Number,
  })
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Фильтр по ID автора статьи',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({
    description:
      'Фильтр: статьи, опубликованные после указанной даты (включительно)',
    example: '2026-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  @IsISO8601()
  @IsOptional()
  publishedFrom?: string;

  @ApiPropertyOptional({
    description:
      'Фильтр: статьи, опубликованные до указанной даты (включительно)',
    example: '2026-01-31T23:59:59.999Z',
    format: 'date-time',
  })
  @IsISO8601()
  @IsOptional()
  publishedTo?: string;

  @ApiPropertyOptional({
    description: 'Поле для сортировки результатов',
    enum: ['createdAt', 'updatedAt', 'title', 'publishedAt'],
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsIn(['createdAt', 'updatedAt', 'title', 'publishedAt'])
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Порядок сортировки',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    example: 'DESC',
  })
  @IsIn(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
