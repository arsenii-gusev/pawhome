import type { Request } from 'express';
import { Role } from './role.enum';

/** Пользователь, извлечённый из JWT и прикреплённый к запросу. */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/** Полезная нагрузка access-токена. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export type AuthenticatedRequest = Request & { user?: AuthUser };
