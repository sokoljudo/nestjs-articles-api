import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsISO8601,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Название статьи',
    example: 'Введение в NestJS',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Содержимое статьи',
    example: 'NestJS — это прогрессивный фреймворк для Node.js...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Дата публикации в ISO 8601 формате',
    example: '2026-01-22T14:30:00.000Z',
  })
  @IsISO8601()
  @IsOptional()
  publishedAt?: string;
}
