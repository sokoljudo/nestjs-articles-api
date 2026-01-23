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
  @ApiOperation({ summary: 'Получить список статей с пагинацией и фильтрами' })
  @ApiResponse({ status: 200, type: PaginatedArticlesResponseDto })
  findAll(@Query() query: GetArticlesQueryDto) {
    return this.articlesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить статью по ID' })
  @ApiResponse({ status: 200, type: ArticleResponseDto })
  @ApiResponse({ status: 404, description: 'Статья не найдена' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Создать новую статью' })
  @ApiResponse({ status: 201, type: ArticleResponseDto })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: AuthUser) {
    return this.articlesService.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Обновить статью' })
  @ApiResponse({ status: 200, type: ArticleResponseDto })
  @ApiResponse({
    status: 403,
    description: 'Можно редактировать только свои статьи',
  })
  @ApiResponse({ status: 404, description: 'Статья не найдена' })
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
  @ApiOperation({ summary: 'Удалить статью' })
  @ApiResponse({ status: 204, description: 'Статья удалена' })
  @ApiResponse({ status: 403, description: 'Можно удалять только свои статьи' })
  @ApiResponse({ status: 404, description: 'Статья не найдена' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.articlesService.remove(id, user.id);
  }
}
