import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role } from '../common/role.enum';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

function makeUser(overrides: Partial<User> = {}): User {
  return Object.assign(new User(), {
    id: 'u-1',
    email: 'anna@example.com',
    name: 'Анна',
    role: Role.User,
    passwordHash: 'hash',
    createdAt: new Date(),
    ...overrides,
  });
}

describe('AuthService', () => {
  let users: jest.Mocked<Pick<UsersService, 'findByEmail' | 'findByEmailWithPassword' | 'findById' | 'create'>>;
  let jwt: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let service: AuthService;

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('token') };
    service = new AuthService(users as unknown as UsersService, jwt as unknown as JwtService);
  });

  describe('register', () => {
    it('отклоняет занятый email', async () => {
      users.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.register({ email: 'Anna@Example.com', name: 'Анна', password: 'secret123' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(users.findByEmail).toHaveBeenCalledWith('anna@example.com');
    });

    it('хэширует пароль, создаёт пользователя с ролью user и не отдаёт хэш наружу', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockImplementation(async (data) => makeUser({ ...data, id: 'u-2' }));

      const result = await service.register({
        email: 'new@example.com',
        name: 'Новый',
        password: 'secret123',
      });

      const created = users.create.mock.calls[0][0];
      expect(created.role).toBe(Role.User);
      expect(created.passwordHash).not.toBe('secret123');
      expect(await bcrypt.compare('secret123', created.passwordHash)).toBe(true);

      expect(result.accessToken).toBe('token');
      expect(result.user).toEqual({ id: 'u-2', email: 'new@example.com', name: 'Новый', role: Role.User });
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'u-2', email: 'new@example.com', role: Role.User });
    });
  });

  describe('login', () => {
    it('возвращает токен при верном пароле', async () => {
      const passwordHash = await bcrypt.hash('secret123', 4);
      users.findByEmailWithPassword.mockResolvedValue(makeUser({ passwordHash }));

      const result = await service.login({ email: 'anna@example.com', password: 'secret123' });

      expect(result.accessToken).toBe('token');
    });

    it('бросает 401 при неверном пароле', async () => {
      const passwordHash = await bcrypt.hash('secret123', 4);
      users.findByEmailWithPassword.mockResolvedValue(makeUser({ passwordHash }));

      await expect(
        service.login({ email: 'anna@example.com', password: 'wrong-pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('бросает 401, если пользователя нет', async () => {
      users.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'secret123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
