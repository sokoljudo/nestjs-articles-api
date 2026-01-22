import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ArticleResponseDto {
  @ApiProperty({
    description: 'Уникальный идентификатор статьи в UUID формате',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Название статьи',
    example: 'Моя первая статья',
    maxLength: 255,
  })
  title: string;

  @ApiProperty({
    description: 'Содержимое статьи',
    example:
      'NestJS — это прогрессивный фреймворк для создания серверных приложений...',
  })
  content: string;

  @ApiProperty({
    description: 'ID автора статьи в UUID формате',
    example: '987e6543-e89b-12d3-a456-426614174111',
    format: 'uuid',
  })
  authorId: string;

  @ApiPropertyOptional({
    description: 'Дата публикации статьи',
    example: '2026-01-22T14:30:00.000Z',
    type: String,
    nullable: true,
  })
  publishedAt: string | null;

  @ApiProperty({
    description: 'Дата создания записи в БД',
    example: '2026-01-20T10:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Дата последнего обновления записи',
    example: '2026-01-22T14:30:00.000Z',
  })
  updatedAt: string;
}
