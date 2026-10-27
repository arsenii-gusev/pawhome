import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm.config';

/** DataSource для TypeORM CLI: `npm run migration:run`. */
export default new DataSource({
  ...buildDataSourceOptions(process.env.DATABASE_URL),
  migrationsRun: false,
});
