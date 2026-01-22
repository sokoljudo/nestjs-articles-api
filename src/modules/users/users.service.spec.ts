import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository, FindOneOptions } from 'typeorm';

import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';

type UsersRepo = Pick<Repository<UserEntity>, 'findOne' | 'create' | 'save'>;

describe('UsersService', () => {
  let service: UsersService;

  const usersRepoMock: jest.Mocked<UsersRepo> = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        // getRepositoryToken(UserEntity) — правильный токен для моков репозитория в Nest+TypeORM [web:667]
        { provide: getRepositoryToken(UserEntity), useValue: usersRepoMock },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('calls repo.findOne with where.email and returns result', async () => {
      const email = 'a@a.com';
      const user = { id: 'u1', email } as UserEntity;

      usersRepoMock.findOne.mockResolvedValueOnce(user);

      await expect(service.findByEmail(email)).resolves.toBe(user);

      expect(usersRepoMock.findOne).toHaveBeenCalledTimes(1);

      const firstCall = usersRepoMock.findOne.mock.calls.at(0);
      expect(firstCall).toBeDefined();

      const [options] = firstCall!;
      expect(options).toEqual({
        where: { email },
      } satisfies FindOneOptions<UserEntity>);
    });
  });

  describe('findById', () => {
    it('calls repo.findOne with where.id and returns result', async () => {
      const id = '11111111-1111-1111-1111-111111111111';
      const user = { id, email: 'a@a.com' } as UserEntity;

      usersRepoMock.findOne.mockResolvedValueOnce(user);

      await expect(service.findById(id)).resolves.toBe(user);

      expect(usersRepoMock.findOne).toHaveBeenCalledTimes(1);

      const firstCall = usersRepoMock.findOne.mock.calls.at(0);
      expect(firstCall).toBeDefined();

      const [options] = firstCall!;
      expect(options).toEqual({
        where: { id },
      } satisfies FindOneOptions<UserEntity>);
    });
  });

  describe('create', () => {
    it('creates entity via repo.create, saves via repo.save, returns saved user', async () => {
      const data = {
        email: 'a@a.com',
        passwordHash: 'hash',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      const createdEntity = { id: 'tmp', ...data } as UserEntity;
      const savedEntity = { id: 'u1', ...data } as UserEntity;

      usersRepoMock.create.mockReturnValueOnce(createdEntity);
      usersRepoMock.save.mockResolvedValueOnce(savedEntity);

      await expect(service.create(data)).resolves.toBe(savedEntity);

      expect(usersRepoMock.create).toHaveBeenCalledTimes(1);
      expect(usersRepoMock.save).toHaveBeenCalledTimes(1);

      // Проверяем аргументы без expect.any / objectContaining (чтобы не ловить ESLint any)
      const createCall = usersRepoMock.create.mock.calls.at(0);
      expect(createCall).toBeDefined();
      const [createArg] = createCall!;
      expect(createArg).toEqual(data);

      const saveCall = usersRepoMock.save.mock.calls.at(0);
      expect(saveCall).toBeDefined();
      const [saveArg] = saveCall!;
      expect(saveArg).toBe(createdEntity);
    });
  });
});
