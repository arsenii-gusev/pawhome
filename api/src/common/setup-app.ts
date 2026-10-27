import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Общая настройка приложения: используется и в main.ts, и в e2e-тестах,
 * чтобы тесты проверяли ровно ту же конфигурацию, что и продакшен.
 */
export function setupApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
