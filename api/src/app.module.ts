import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdoptionsModule } from './adoptions/adoptions.module';
import { AnimalsModule } from './animals/animals.module';
import { AuthModule } from './auth/auth.module';
import { buildDataSourceOptions } from './database/typeorm.config';
import { HealthController } from './health/health.controller';
import { SeedModule } from './seed/seed.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        buildDataSourceOptions(
          config.get<string>('DATABASE_URL'),
          config.get<string>('DB_DROP_SCHEMA') === 'true',
        ),
    }),
    UsersModule,
    AuthModule,
    AnimalsModule,
    AdoptionsModule,
    SeedModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
