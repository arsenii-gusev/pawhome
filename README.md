# 🐾 PawHome

Fullstack-приложение для усыновления животных из приютов: каталог питомцев, заявки на усыновление и панель администратора приюта.

**Стек:** NestJS · TypeScript · PostgreSQL · TypeORM · JWT · Swagger · Angular 20 (standalone, Signals, zoneless) · Jest · Docker Compose · GitHub Actions

## Возможности

- Каталог питомцев с фильтром по виду, поиском по кличке и породе и пагинацией.
- Регистрация и вход по JWT, роли `user` и `admin`.
- Пользователь подаёт заявку на усыновление, видит её статус и может её отозвать.
- Администратор добавляет питомцев, одобряет и отклоняет заявки.
- Одобрение выполняется в одной транзакции: заявка становится `approved`, питомец `adopted`, остальные ожидающие заявки на него автоматически отклоняются.

## Архитектура

```
pawhome/
├── api/                      NestJS REST API
│   ├── src/
│   │   ├── auth/             регистрация, логин, JwtAuthGuard, RolesGuard, @Roles, @CurrentUser
│   │   ├── users/            сущность и сервис пользователей
│   │   ├── animals/          CRUD питомцев, фильтры и пагинация
│   │   ├── adoptions/        заявки и бизнес-правила усыновления
│   │   ├── database/         конфигурация TypeORM и миграции
│   │   └── seed/             администратор и демо-данные при старте
│   └── test/                 e2e-тесты на реальном PostgreSQL
├── web/                      Angular SPA
│   └── src/app/
│       ├── core/             AuthService на сигналах, HTTP-интерцептор, guards, API-сервис
│       └── pages/            lazy-loaded страницы
├── docker-compose.yml        PostgreSQL + API + Angular за nginx
└── .github/workflows/ci.yml  сборка, unit и e2e тесты, сборка Docker-образов
```

### Backend (NestJS)

- Модульная структура: `AuthModule`, `UsersModule`, `AnimalsModule`, `AdoptionsModule`, `SeedModule`.
- DTO с валидацией через `class-validator` и глобальный `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Аутентификация на `@nestjs/jwt` без Passport: собственный `JwtAuthGuard` и `RolesGuard` с декоратором `@Roles()`.
- PostgreSQL + TypeORM. Схема управляется миграциями (`synchronize: false`), хэш пароля не выбирается из БД по умолчанию (`select: false`).
- Документация OpenAPI: Swagger UI на `/api/docs`.

### Frontend (Angular)

- Standalone-компоненты, `OnPush`, zoneless change detection.
- Состояние на Signals: `AuthService` хранит сессию в сигналах и `localStorage`.
- Списки строятся из сигналов фильтров через `toObservable` → `debounceTime` → `switchMap` → `toSignal`; устаревшие запросы отменяются.
- Функциональный `HttpInterceptor` добавляет Bearer-токен и разлогинивает при 401, функциональные guards закрывают личный кабинет и админку.
- Параметры маршрута приходят в компоненты через `input()` (`withComponentInputBinding`).

## API

| Метод | Путь | Доступ | Описание |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | все | регистрация |
| POST | `/api/auth/login` | все | вход, возвращает `accessToken` |
| GET | `/api/auth/me` | user | текущий пользователь |
| GET | `/api/animals` | все | список: `species`, `status`, `search`, `page`, `limit` |
| GET | `/api/animals/:id` | все | карточка питомца |
| POST, PATCH, DELETE | `/api/animals[/:id]` | admin | управление питомцами |
| POST | `/api/adoptions` | user | подать заявку |
| GET | `/api/adoptions/my` | user | мои заявки |
| DELETE | `/api/adoptions/:id` | user | отозвать свою заявку |
| GET | `/api/adoptions` | admin | все заявки, фильтр `status` |
| PATCH | `/api/adoptions/:id/approve` | admin | одобрить |
| PATCH | `/api/adoptions/:id/reject` | admin | отклонить |

## Запуск

### Docker Compose

```bash
docker compose up --build
```

- Приложение: http://localhost:8080
- Swagger: http://localhost:3000/api/docs
- Администратор: `admin@pawhome.local` / `admin12345`

### Локальная разработка

```bash
docker compose up -d db

cd api
cp .env.example .env
npm install
npm run start:dev        # http://localhost:3000, миграции применяются при старте

cd ../web
npm install
npm start                # http://localhost:4200, /api проксируется на :3000
```

## Тесты

```bash
cd api
npm test                 # unit-тесты сервисов и guards
npm run test:cov         # с покрытием
npm run test:e2e         # e2e через supertest, нужен PostgreSQL из DATABASE_URL
```

- Unit-тесты: `AuthService`, `AnimalsService` (через `Test.createTestingModule`), `AdoptionsService` с моком транзакции, `RolesGuard`.
- E2E-тесты поднимают всё приложение, накатывают миграции на чистую базу и проходят сценарий целиком: регистрация → вход администратора → добавление питомца → заявка → одобрение.

CI в GitHub Actions на каждый push: сборка API, unit и e2e тесты с PostgreSQL как service-контейнером, сборка Angular и Docker-образов.

## Лицензия

MIT
