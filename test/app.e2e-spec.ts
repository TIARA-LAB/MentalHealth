import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const mockUsers = new Map<string, any>();
const mockRefreshTokens = new Map<string, any>();
let userIdCounter = 1;

const mockPrisma = {
  user: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.email) {
        for (const user of mockUsers.values()) {
          if (user.email === where.email) return Promise.resolve(user);
        }
        return Promise.resolve(null);
      }
      return Promise.resolve(mockUsers.get(where.id) ?? null);
    }),
    create: jest.fn().mockImplementation(({ data }) => {
      const id = `user-${userIdCounter++}`;
      const user = {
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      mockUsers.set(id, user);
      return Promise.resolve(user);
    }),
    update: jest.fn().mockImplementation(({ where, data }) => {
      const user = mockUsers.get(where.id);
      if (!user) return Promise.resolve(null);
      Object.assign(user, data, { updatedAt: new Date() });
      return Promise.resolve(user);
    }),
  },
  refreshToken: {
    create: jest.fn().mockImplementation(({ data }) => {
      const id = `rt-${Date.now()}`;
      const rt = { id, ...data, createdAt: new Date(), revoked: false };
      mockRefreshTokens.set(id, rt);
      return Promise.resolve(rt);
    }),
    findMany: jest.fn().mockImplementation(({ where }) => {
      const result: any[] = [];
      for (const rt of mockRefreshTokens.values()) {
        if (rt.userId === where.userId && rt.revoked === false) {
          result.push(rt);
        }
      }
      return Promise.resolve(result);
    }),
    findFirst: jest.fn().mockImplementation(() => Promise.resolve(null)),
    update: jest.fn().mockImplementation(({ where, data }) => {
      const rt = mockRefreshTokens.get(where.id);
      if (rt) Object.assign(rt, data);
      return Promise.resolve(rt);
    }),
    updateMany: jest.fn().mockImplementation(({ where, data }) => {
      let count = 0;
      for (const rt of mockRefreshTokens.values()) {
        if (rt.userId === where.userId && rt.revoked === where.revoked) {
          Object.assign(rt, data);
          count++;
        }
      }
      return Promise.resolve({ count });
    }),
  },
  $transaction: jest.fn().mockImplementation((ops: any[]) => Promise.all(ops)),
};

describe('Auth & Users (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    mockUsers.clear();
    mockRefreshTokens.clear();
    userIdCounter = 1;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test',
        })
        .expect(201)
        .then((res) => {
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(409);
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('should reject short password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'new@example.com', password: 'short' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(201)
        .then((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      refreshToken = res.body.refreshToken;
    });

    it('should refresh tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .send({ refreshToken })
        .expect(201)
        .then((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });
  });

  describe('PATCH /api/v1/users/me/password', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      accessToken = res.body.accessToken;
    });

    it('should change password with valid current password', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'password123', newPassword: 'newpassword456' })
        .expect(200)
        .then((res) => {
          expect(res.body.message).toBe('Password changed successfully');
        });
    });

    it('should reject wrong current password', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
        })
        .expect(401);
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .send({ currentPassword: 'password123', newPassword: 'newpassword456' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'newpassword456' });
      const token = loginRes.body.accessToken;

      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .then((res) => {
          expect(res.body.message).toBe('Logged out successfully');
        });
    });
  });
});
