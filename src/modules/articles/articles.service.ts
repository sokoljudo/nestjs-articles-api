import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ArticleEntity } from './entities/article.entity';
import { CreateArticleDto, GetArticlesQueryDto, UpdateArticleDto } from './dto';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articlesRepo: Repository<ArticleEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async create(dto: CreateArticleDto, authorId: string) {
    const article = this.articlesRepo.create({
      title: dto.title,
      content: dto.content,
      authorId,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
    });

    return await this.articlesRepo.save(article);
  }

  async findAll(query: GetArticlesQueryDto) {
    const cacheKey = this.generateListCacheKey(query);

    this.logger.debug(`Checking cache for key: ${cacheKey}`);

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug('Cache HIT');
      return cached;
    }

    this.logger.debug('Cache MISS, querying DB');

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';
    const { authorId, publishedFrom, publishedTo } = query;

    const qb = this.articlesRepo.createQueryBuilder('article');

    if (authorId) {
      qb.andWhere('article.authorId = :authorId', { authorId });
    }

    if (publishedFrom) {
      qb.andWhere('article.publishedAt >= :publishedFrom', {
        publishedFrom: new Date(publishedFrom),
      });
    }

    if (publishedTo) {
      qb.andWhere('article.publishedAt <= :publishedTo', {
        publishedTo: new Date(publishedTo),
      });
    }

    qb.orderBy(`article.${sortBy}`, sortOrder);
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const result = {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    this.logger.debug(`Saving to cache with key: ${cacheKey}`);
    await this.cacheManager.set(cacheKey, result);

    return result;
  }

  async findOne(id: string) {
    const cacheKey = `article:${id}`;

    const cached = await this.cacheManager.get<ArticleEntity>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for article ${id}`);
      return cached;
    }

    this.logger.debug(`Cache MISS for article ${id}`);

    const article = await this.articlesRepo.findOne({ where: { id } });

    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    await this.cacheManager.set(cacheKey, article);

    return article;
  }

  async update(id: string, dto: UpdateArticleDto, currentUserId: string) {
    const article = await this.findOne(id);

    if (article.authorId !== currentUserId) {
      throw new ForbiddenException('You can only edit your own articles');
    }

    Object.assign(article, dto);
    const updated = await this.articlesRepo.save(article);

    await this.cacheManager.del(`article:${id}`);

    return updated;
  }

  async remove(id: string, currentUserId: string) {
    const article = await this.findOne(id);

    if (article.authorId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own articles');
    }

    await this.articlesRepo.remove(article);

    await this.cacheManager.del(`article:${id}`);
  }

  private generateListCacheKey(query: GetArticlesQueryDto): string {
    const parts = [
      'articles:list',
      `page:${query.page ?? 1}`,
      `limit:${query.limit ?? 10}`,
      `sort:${query.sortBy ?? 'createdAt'}:${query.sortOrder ?? 'DESC'}`,
    ];

    if (query.authorId) parts.push(`author:${query.authorId}`);
    if (query.publishedFrom) parts.push(`from:${query.publishedFrom}`);
    if (query.publishedTo) parts.push(`to:${query.publishedTo}`);

    return parts.join(':');
  }
}
