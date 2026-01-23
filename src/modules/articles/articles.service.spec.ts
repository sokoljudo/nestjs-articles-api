import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { FindOneOptions } from 'typeorm';

import { ArticlesService } from './articles.service';
import { ArticleEntity } from './entities/article.entity';
import { CreateArticleDto, UpdateArticleDto, GetArticlesQueryDto } from './dto';

type FindAllResult = {
  data: ArticleEntity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type ArticlesQb = {
  andWhere: (sql: string, params?: Record<string, unknown>) => ArticlesQb;
  orderBy: (sort: string, order: 'ASC' | 'DESC') => ArticlesQb;
  skip: (n: number) => ArticlesQb;
  take: (n: number) => ArticlesQb;
  getManyAndCount: () => Promise<[ArticleEntity[], number]>;
};

const makeQbMock = (): {
  qb: ArticlesQb;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
} => {
  const qb = {} as ArticlesQb;

  const andWhere = jest.fn().mockImplementation(() => qb);
  const orderBy = jest.fn().mockImplementation(() => qb);
  const skip = jest.fn().mockImplementation(() => qb);
  const take = jest.fn().mockImplementation(() => qb);
  const getManyAndCount = jest.fn();

  qb.andWhere = andWhere as unknown as ArticlesQb['andWhere'];
  qb.orderBy = orderBy as unknown as ArticlesQb['orderBy'];
  qb.skip = skip as unknown as ArticlesQb['skip'];
  qb.take = take as unknown as ArticlesQb['take'];
  qb.getManyAndCount =
    getManyAndCount as unknown as ArticlesQb['getManyAndCount'];

  return { qb, andWhere, orderBy, skip, take, getManyAndCount };
};

describe('ArticlesService', () => {
  let service: ArticlesService;

  const repo = {
    findOne: jest.fn<
      Promise<ArticleEntity | null>,
      [FindOneOptions<ArticleEntity>]
    >(),
    save: jest.fn<Promise<ArticleEntity>, [ArticleEntity]>(),
    remove: jest.fn<Promise<ArticleEntity>, [ArticleEntity]>(),
    create: jest.fn<ArticleEntity, [Partial<ArticleEntity>]>(),
    createQueryBuilder: jest.fn<ArticlesQb, [string]>(),
  };

  const cache = {
    get: jest.fn<Promise<unknown>, [string]>(),
    set: jest.fn<Promise<unknown>, [string, unknown, number?]>(),
    del: jest.fn<Promise<boolean>, [string]>(),
    clear: jest.fn<Promise<boolean>, []>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getRepositoryToken(ArticleEntity), useValue: repo },
        { provide: CACHE_MANAGER, useValue: cache as unknown as Cache },
      ],
    }).compile();

    service = moduleRef.get(ArticlesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('returns cached article on cache hit', async () => {
      const id = '11111111-1111-1111-1111-111111111111';
      const cachedArticle = { id } as ArticleEntity;

      cache.get.mockResolvedValueOnce(cachedArticle);

      await expect(service.findOne(id)).resolves.toBe(cachedArticle);
      expect(repo.findOne).not.toHaveBeenCalled();
    });

    it('loads from repo and caches on miss', async () => {
      const id = '11111111-1111-1111-1111-111111111111';
      const dbArticle = {
        id,
        title: 't',
        content: 'c',
        authorId: 'a',
        publishedAt: null,
      } as ArticleEntity;

      cache.get.mockResolvedValueOnce(undefined);
      repo.findOne.mockResolvedValueOnce(dbArticle);

      await expect(service.findOne(id)).resolves.toBe(dbArticle);
      expect(cache.set).toHaveBeenCalledWith(
        `article:${id}`,
        dbArticle,
        expect.any(Number),
      );
    });

    it('throws NotFoundException when not found in repo', async () => {
      const id = '11111111-1111-1111-1111-111111111111';

      cache.get.mockResolvedValueOnce(undefined);
      repo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns cached list on cache hit (no DB call)', async () => {
      const cached: FindAllResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };

      cache.get.mockResolvedValueOnce(cached);

      const query = new GetArticlesQueryDto();
      const res = (await service.findAll(query)) as FindAllResult;

      expect(res).toBe(cached);
      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('queries DB on miss and caches result', async () => {
      const { qb, getManyAndCount } = makeQbMock();

      const items = [{ id: 'a' } as ArticleEntity];
      getManyAndCount.mockResolvedValueOnce([items, 1]);

      cache.get.mockResolvedValueOnce(undefined);
      repo.createQueryBuilder.mockReturnValueOnce(qb);

      const query = new GetArticlesQueryDto();
      query.page = 1;
      query.limit = 10;

      const res = (await service.findAll(query)) as FindAllResult;

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('article');
      expect(res.data).toEqual(items);
      expect(res.meta.total).toBe(1);
      expect(cache.set).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('creates article and clears cache', async () => {
      const dto = new CreateArticleDto();
      dto.title = 't';
      dto.content = 'c';
      dto.publishedAt = '2026-01-22T00:00:00.000Z';

      const created = { id: 'x', title: 't', content: 'c' } as ArticleEntity;
      const saved = { ...created, authorId: 'author-1' } as ArticleEntity;

      repo.create.mockReturnValueOnce(created);
      repo.save.mockResolvedValueOnce(saved);

      const res = await service.create(dto, 'author-1');

      expect(repo.create).toHaveBeenCalledTimes(1);
      const firstCall = repo.create.mock.calls.at(0);
      expect(firstCall).toBeDefined();

      const [createArg] = firstCall!;

      expect(createArg.title).toBe('t');
      expect(createArg.content).toBe('c');
      expect(createArg.authorId).toBe('author-1');
      expect(createArg.publishedAt).toBeInstanceOf(Date);

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(cache.clear).toHaveBeenCalledTimes(1);
      expect(res).toBe(saved);
    });
  });

  describe('update', () => {
    it('throws ForbiddenException when user is not author', async () => {
      const id = '11111111-1111-1111-1111-111111111111';
      const article = {
        id,
        authorId: 'author-1',
        title: 'old',
      } as ArticleEntity;

      repo.findOne.mockResolvedValueOnce(article);

      const dto = new UpdateArticleDto();
      dto.title = 'new';

      await expect(service.update(id, dto, 'author-2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('updates article, saves, clears cache, and returns updated entity', async () => {
      const id = '11111111-1111-1111-1111-111111111111';
      const article = {
        id,
        authorId: 'author-1',
        title: 'old',
        content: 'old content',
      } as ArticleEntity;

      // 1) Проверка прав
      repo.findOne.mockResolvedValueOnce(article);

      // 2) Сохранение
      const updatedArticle = { ...article, title: 'new' };
      repo.save.mockResolvedValueOnce(updatedArticle);

      // 3) Возврат свежей статьи через findOne
      cache.get.mockResolvedValueOnce(undefined);
      repo.findOne.mockResolvedValueOnce(updatedArticle);

      const dto = new UpdateArticleDto();
      dto.title = 'new';

      const res = await service.update(id, dto, 'author-1');

      expect(repo.save).toHaveBeenCalledTimes(1);

      const firstSaveCall = repo.save.mock.calls.at(0);
      expect(firstSaveCall).toBeDefined();
      const [savedArg] = firstSaveCall!;
      expect(savedArg.title).toBe('new');

      expect(cache.del).toHaveBeenCalledWith(`article:${id}`);
      expect(cache.clear).toHaveBeenCalledTimes(1);

      expect(res).toEqual(updatedArticle);
    });
  });

  describe('remove', () => {
    it('throws ForbiddenException when user is not author', async () => {
      const id = '11111111-1111-1111-1111-111111111111';
      const article = { id, authorId: 'author-1' } as ArticleEntity;

      repo.findOne.mockResolvedValueOnce(article);

      await expect(service.remove(id, 'author-2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('removes article and clears cache when author deletes', async () => {
      const id = '11111111-1111-1111-1111-111111111111';
      const article = { id, authorId: 'author-1' } as ArticleEntity;

      repo.findOne.mockResolvedValueOnce(article);
      repo.remove.mockResolvedValueOnce(article);

      await service.remove(id, 'author-1');

      expect(repo.remove).toHaveBeenCalledWith(article);
      expect(cache.del).toHaveBeenCalledWith(`article:${id}`);
      expect(cache.clear).toHaveBeenCalledTimes(1);
    });
  });
});
