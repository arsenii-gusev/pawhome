import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/common/setup-app';

// Тесты идут против настоящего PostgreSQL: схема пересоздаётся миграциями при старте.
process.env.DATABASE_URL ??= 'postgres://pets:pets@localhost:5432/pawhome_test';
process.env.DB_DROP_SCHEMA = 'true';
process.env.JWT_SECRET ??= 'e2e-secret';
process.env.ADMIN_EMAIL = 'admin@pawhome.test';
process.env.ADMIN_PASSWORD = 'admin12345';
process.env.SEED_DEMO = 'false';

describe('PawHome API (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let userToken: string;
  let adminToken: string;
  let animalId: string;
  let requestId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health', async () => {
    await request(http).get('/api/health').expect(200, { status: 'ok' });
  });

  describe('auth', () => {
    it('валидирует тело запроса', async () => {
      const res = await request(http)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', name: 'A', password: '123' })
        .expect(400);
      expect(res.body.message).toEqual(expect.any(Array));
    });

    it('регистрирует пользователя', async () => {
      const res = await request(http)
        .post('/api/auth/register')
        .send({ email: 'Anna@Example.com', name: 'Анна', password: 'secret123' })
        .expect(201);

      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({ email: 'anna@example.com', role: 'user' });
      expect(res.body.user.passwordHash).toBeUndefined();
      userToken = res.body.accessToken;
    });

    it('не даёт зарегистрироваться дважды', async () => {
      await request(http)
        .post('/api/auth/register')
        .send({ email: 'anna@example.com', name: 'Анна', password: 'secret123' })
        .expect(409);
    });

    it('не пускает с неверным паролем', async () => {
      await request(http)
        .post('/api/auth/login')
        .send({ email: 'anna@example.com', password: 'wrong-pass' })
        .expect(401);
    });

    it('логинит администратора, созданного при старте', async () => {
      const res = await request(http)
        .post('/api/auth/login')
        .send({ email: 'admin@pawhome.test', password: 'admin12345' })
        .expect(200);
      expect(res.body.user.role).toBe('admin');
      adminToken = res.body.accessToken;
    });

    it('GET /api/auth/me требует токен', async () => {
      await request(http).get('/api/auth/me').expect(401);
      const res = await request(http)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(res.body.email).toBe('anna@example.com');
    });
  });

  describe('animals', () => {
    const animal = { name: 'Рыжик', species: 'dog', breed: 'Метис', ageMonths: 30 };

    it('обычный пользователь не может добавить животное', async () => {
      await request(http)
        .post('/api/animals')
        .set('Authorization', `Bearer ${userToken}`)
        .send(animal)
        .expect(403);
    });

    it('администратор добавляет животное', async () => {
      const res = await request(http)
        .post('/api/animals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(animal)
        .expect(201);
      expect(res.body).toMatchObject({ ...animal, status: 'available', description: '' });
      animalId = res.body.id;
    });

    it('список фильтруется и ищет по породе', async () => {
      const res = await request(http).get(`/api/animals?species=dog&search=${encodeURIComponent('Мет')}`).expect(200);
      expect(res.body.total).toBe(1);
      expect(res.body.items[0].id).toBe(animalId);

      const cats = await request(http).get('/api/animals?species=cat').expect(200);
      expect(cats.body.total).toBe(0);
    });

    it('отклоняет некорректные query-параметры', async () => {
      await request(http).get('/api/animals?limit=1000').expect(400);
    });
  });

  describe('adoptions', () => {
    it('пользователь подаёт заявку', async () => {
      const res = await request(http)
        .post('/api/adoptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ animalId, message: 'Есть свой дом и большой двор' })
        .expect(201);
      expect(res.body.status).toBe('pending');
      requestId = res.body.id;
    });

    it('повторная заявка на то же животное запрещена', async () => {
      await request(http)
        .post('/api/adoptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ animalId, message: 'Ещё одна заявка, пожалуйста' })
        .expect(409);
    });

    it('обычный пользователь не видит все заявки', async () => {
      await request(http)
        .get('/api/adoptions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('администратор одобряет заявку, животное становится усыновлённым', async () => {
      const res = await request(http)
        .patch(`/api/adoptions/${requestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.status).toBe('approved');

      const animal = await request(http).get(`/api/animals/${animalId}`).expect(200);
      expect(animal.body.status).toBe('adopted');
    });

    it('пользователь видит свою заявку со статусом approved', async () => {
      const res = await request(http)
        .get('/api/adoptions/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ status: 'approved', animal: { id: animalId } });
    });
  });
});
