import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto';
import type { UserEntity } from '../users/entities/user.entity';

jest.mock('bcrypt');

type JwtPayload = { sub: string; email: string };

const makeUser = (overrides: Partial<UserEntity> = {}): UserEntity => {
  const base = {
    id: 'u1',
    email: 'a@a.com',
    passwordHash: 'hash',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  return { ...(base as unknown as UserEntity), ...overrides };
};

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn<Promise<UserEntity | null>, [string]>(),
    create: jest.fn<
      Promise<UserEntity>,
      [Pick<UserEntity, 'email' | 'passwordHash'> & { createdAt?: Date }]
    >(),
  };

  const jwtServiceMock = {
    sign: jest.fn<string, [JwtPayload]>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('throws ConflictException if email already in use', async () => {
      usersServiceMock.findByEmail.mockResolvedValueOnce(
        makeUser({ id: 'existing' }),
      );

      const dto = new RegisterDto();
      dto.email = 'a@a.com';
      dto.password = 'pass';

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('hashes password, creates user, generates JWT, returns AuthResponseDto', async () => {
      usersServiceMock.findByEmail.mockResolvedValueOnce(null);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const createdUser = makeUser({
        id: 'u1',
        email: 'a@a.com',
        passwordHash: 'hashed_password',
        createdAt,
      });

      usersServiceMock.create.mockResolvedValueOnce(createdUser);
      jwtServiceMock.sign.mockReturnValueOnce('jwt-token-12345');

      const dto = new RegisterDto();
      dto.email = 'a@a.com';
      dto.password = 'password123';

      const result = await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(usersServiceMock.create).toHaveBeenCalledWith({
        email: 'a@a.com',
        passwordHash: 'hashed_password',
      });
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@a.com',
      });

      expect(result).toEqual({
        accessToken: 'jwt-token-12345',
        user: {
          id: 'u1',
          email: 'a@a.com',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      });
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException if user not found', async () => {
      usersServiceMock.findByEmail.mockResolvedValueOnce(null);

      const dto = new LoginDto();
      dto.email = 'nonexistent@example.com';
      dto.password = 'pass';

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password invalid', async () => {
      usersServiceMock.findByEmail.mockResolvedValueOnce(
        makeUser({ passwordHash: 'hashed_real_password' }),
      );

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const dto = new LoginDto();
      dto.email = 'a@a.com';
      dto.password = 'wrong_password';

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrong_password',
        'hashed_real_password',
      );
    });

    it('returns accessToken and user on successful login', async () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const user = makeUser({
        id: 'u1',
        email: 'a@a.com',
        passwordHash: 'hashed_password',
        createdAt,
      });

      usersServiceMock.findByEmail.mockResolvedValueOnce(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtServiceMock.sign.mockReturnValueOnce('jwt-token-login');

      const dto = new LoginDto();
      dto.email = 'a@a.com';
      dto.password = 'correct_password';

      const result = await service.login(dto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correct_password',
        'hashed_password',
      );
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@a.com',
      });

      expect(result).toEqual({
        accessToken: 'jwt-token-login',
        user: {
          id: 'u1',
          email: 'a@a.com',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      });
    });
  });
});
