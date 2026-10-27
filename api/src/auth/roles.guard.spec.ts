import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../common/auth-user';
import { Role } from '../common/role.enum';
import { RolesGuard } from './roles.guard';

function contextWithUser(user?: AuthUser): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);
  const admin: AuthUser = { id: '1', email: 'a@a.ru', role: Role.Admin };
  const user: AuthUser = { id: '2', email: 'u@u.ru', role: Role.User };

  afterEach(() => jest.restoreAllMocks());

  it('пропускает, если роли не заданы', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextWithUser(user))).toBe(true);
  });

  it('пропускает администратора на админский маршрут', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(guard.canActivate(contextWithUser(admin))).toBe(true);
  });

  it('запрещает обычному пользователю админский маршрут', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(() => guard.canActivate(contextWithUser(user))).toThrow(ForbiddenException);
  });

  it('запрещает запрос без пользователя', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow(ForbiddenException);
  });
});
