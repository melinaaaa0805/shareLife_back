import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from '../src/common/http-exception.filter';

// Email unique par run pour éviter les conflits entre exécutions
const TEST_EMAIL = `e2e-${Date.now()}@sharelife-test.dev`;
const TEST_PASSWORD = 'Test1234!';
const TEST_FIRSTNAME = 'E2eUser';

describe('ShareLife API (e2e)', () => {
  let app: INestApplication<App>;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Auth — inscription ─────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('crée un compte et retourne un token JWT (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD, firstName: TEST_FIRSTNAME })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(typeof res.body.access_token).toBe('string');
    });

    it('rejette un email déjà utilisé avec un message générique (401, anti-énumération)', async () => {
      // Message générique et code 401 (pas 409) : ne doit pas révéler que
      // l'email existe déjà, pour empêcher l'énumération de comptes
      // (voir ANOM-2026-004 dans le dossier de maintenance).
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD, firstName: TEST_FIRSTNAME })
        .expect(401);

      expect(res.body.message).toBe('Identifiants incorrects');
    });

    it('rejette un mot de passe trop faible (400)', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: `weak-${Date.now()}@test.dev`, password: 'weak', firstName: 'Test' })
        .expect(400);
    });
  });

  // ── Auth — connexion ───────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('retourne un token JWT avec des identifiants valides (200)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      jwtToken = res.body.access_token;
    });

    it('retourne 401 avec un mauvais mot de passe', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: 'WrongPass9!' })
        .expect(401);
    });
  });

  // ── Auth — endpoint protégé ────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('retourne le profil de l\'utilisateur avec un token valide (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('email', TEST_EMAIL);
      expect(res.body).toHaveProperty('firstName', TEST_FIRSTNAME);
    });

    it('retourne 401 sans token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });
});
