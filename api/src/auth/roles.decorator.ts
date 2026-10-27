import { SetMetadata } from '@nestjs/common';
import { Role } from '../common/role.enum';

export const ROLES_KEY = 'roles';

/** Ограничивает доступ к обработчику указанными ролями. Работает вместе с RolesGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
