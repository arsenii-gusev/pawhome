import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { AdoptionRequest } from '../adoptions/adoption-request.entity';
import { Animal } from '../animals/animal.entity';
import { User } from '../users/user.entity';
import { InitSchema1761500000000 } from './migrations/1761500000000-init-schema';

/**
 * Единая конфигурация TypeORM для приложения и CLI миграций.
 * Схема управляется только миграциями (synchronize выключен).
 */
export function buildDataSourceOptions(
  url: string | undefined,
  dropSchema = false,
): PostgresConnectionOptions {
  return {
    type: 'postgres',
    url,
    entities: [User, Animal, AdoptionRequest],
    migrations: [InitSchema1761500000000],
    migrationsRun: true,
    synchronize: false,
    dropSchema,
    uuidExtension: 'pgcrypto',
  };
}
