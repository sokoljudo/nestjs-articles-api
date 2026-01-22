import { ApiProperty } from '@nestjs/swagger';
import { ArticleResponseDto } from './article-response.dto';

class PaginationMetaDto {
  @ApiProperty({
    description: 'Общее количество статей',
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: 'Текущая страница',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Количество записей на странице',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Общее количество страниц',
    example: 5,
  })
  totalPages: number;
}

export class PaginatedArticlesResponseDto {
  @ApiProperty({
    description: 'Массив статей',
    type: [ArticleResponseDto],
    isArray: true,
  })
  data: ArticleResponseDto[];

  @ApiProperty({
    description: 'Метаданные пагинации',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
