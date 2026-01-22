import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto, GetArticlesQueryDto, UpdateArticleDto } from './dto';
import {
  ArticleResponseDto,
  PaginatedArticlesResponseDto,
} from './dto/responses';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({
    summary: 'Получить список статей с пагинацией',
    description:
      'Возвращает пагинированный список статей с возможностью фильтрации по автору, датам публикации и сортировки. Результат кэшируется в Redis на 30 секунд.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество записей на странице (макс. 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    type: String,
    description: 'Фильтр по ID автора',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'publishedFrom',
    required: false,
    type: String,
    description: 'Фильтр: статьи, опубликованные после указанной даты',
    example: '2026-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'publishedTo',
    required: false,
    type: String,
    description: 'Фильтр: статьи, опубликованные до указанной даты',
    example: '2026-01-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'title', 'publishedAt'],
    description: 'Поле для сортировки',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Порядок сортировки',
    example: 'DESC',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Список статей успешно получен',
    type: PaginatedArticlesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Невалидные параметры запроса (например, page < 1 или неверный UUID)',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'page must not be less than 1',
          'limit must not be greater than 100',
          'authorId must be a UUID',
        ],
        error: 'Bad Request',
      },
    },
  })
  findAll(@Query() query: GetArticlesQueryDto) {
    return this.articlesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить статью по ID',
    description:
      'Возвращает детальную информацию об одной статье. Результат кэшируется в Redis на 60 секунд.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID статьи',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Статья найдена',
    type: ArticleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Статья с указанным ID не найдена',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Article with ID "123e4567-e89b-12d3-a456-426614174000" not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Невалидный формат UUID',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (uuid is expected)',
        error: 'Bad Request',
      },
    },
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Создать новую статью',
    description:
      'Создает новую статью от имени авторизованного пользователя. Автор автоматически определяется из JWT токена. После создания инвалидируется кэш списка статей.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Статья успешно создана',
    type: ArticleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Токен отсутствует, невалиден или истек',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Невалидные данные (пустое название, слишком длинное название и т.д.)',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'title should not be empty',
          'title must be shorter than or equal to 255 characters',
          'content should not be empty',
        ],
        error: 'Bad Request',
      },
    },
  })
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: AuthUser) {
    return this.articlesService.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Обновить статью',
    description:
      'Частично обновляет статью (PATCH). Пользователь может обновлять только свои статьи. После обновления инвалидируется кэш конкретной статьи и списка статей.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID статьи для обновления',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Статья успешно обновлена',
    type: ArticleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Токен отсутствует, невалиден или истек',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Нет прав на редактирование этой статьи (не автор)',
    schema: {
      example: {
        statusCode: 403,
        message: 'You can only edit your own articles',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Статья с указанным ID не найдена',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Article with ID "123e4567-e89b-12d3-a456-426614174000" not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Невалидные данные или формат UUID',
    schema: {
      example: {
        statusCode: 400,
        message: ['title must be shorter than or equal to 255 characters'],
        error: 'Bad Request',
      },
    },
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.articlesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Удалить статью',
    description:
      'Удаляет статью безвозвратно. Пользователь может удалять только свои статьи. После удаления инвалидируется кэш конкретной статьи и списка статей.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID статьи для удаления',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Статья успешно удалена (тело ответа пустое)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Токен отсутствует, невалиден или истек',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Нет прав на удаление этой статьи (не автор)',
    schema: {
      example: {
        statusCode: 403,
        message: 'You can only delete your own articles',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Статья с указанным ID не найдена',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Article with ID "123e4567-e89b-12d3-a456-426614174000" not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Невалидный формат UUID',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (uuid is expected)',
        error: 'Bad Request',
      },
    },
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.articlesService.remove(id, user.id);
  }
}
