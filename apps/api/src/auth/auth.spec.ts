import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';

describe('Authentication Security Tests (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let receptionistAccessToken: string;
  let adminUserId: string;
  let receptionistUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data - delete in correct order to respect foreign key constraints
    const testUsers = await prisma.user.findMany({
      where: { email: { contains: '@test.com' } },
      select: { id: true },
    });
    const testUserIds = testUsers.map(u => u.id);

    if (testUserIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { userId: { in: testUserIds } },
      });
    }

    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.com' } },
    });

    // Create admin user
    const adminPasswordHash = await argon2.hash('admin123');
    const admin = await prisma.user.create({
      data: {
        email: 'testadmin.auth@test.com',
        passwordHash: adminPasswordHash,
        name: 'Test Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
    adminUserId = admin.id;

    // Create receptionist user
    const receptionistPasswordHash = await argon2.hash('receptionist123');
    const receptionist = await prisma.user.create({
      data: {
        email: 'testreceptionist.auth@test.com',
        passwordHash: receptionistPasswordHash,
        name: 'Test Receptionist',
        role: 'RECEPTIONIST',
        isActive: true,
      },
    });
    receptionistUserId = receptionist.id;

    // Create inactive user
    const inactivePasswordHash = await argon2.hash('inactive123');
    await prisma.user.create({
      data: {
        email: 'testinactive@test.com',
        passwordHash: inactivePasswordHash,
        name: 'Test Inactive',
        role: 'RECEPTIONIST',
        isActive: false,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data - delete in correct order to respect foreign key constraints
    const testUsers = await prisma.user.findMany({
      where: { email: { contains: '@test.com' } },
      select: { id: true },
    });
    const testUserIds = testUsers.map(u => u.id);

    if (testUserIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { userId: { in: testUserIds } },
      });
    }

    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.com' } },
    });
    await app.close();
  });

  describe('Registration Security', () => {
    it('should reject unauthenticated registration attempts', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'unauth@test.com',
          password: 'password123',
          name: 'Test User',
          role: 'ADMIN',
        })
        .expect(401);
    });

    it('should allow authenticated admin to create users', async () => {
      // Login as admin
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'testadmin.auth@test.com',
          password: 'admin123',
        });

      adminAccessToken = loginResponse.body.accessToken;

      // Register new user as admin
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          email: 'newuser@test.com',
          password: 'password123',
          name: 'New User',
          role: 'RECEPTIONIST',
        })
        .expect(201);

      expect(registerResponse.body.email).toBe('newuser@test.com');
    });
  });

  describe('Login Security', () => {
    it('should reject invalid credentials with generic message', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject inactive user login with generic message', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'testinactive@test.com',
          password: 'inactive123',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should successfully login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'testadmin.auth@test.com',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('testadmin.auth@test.com');
      adminAccessToken = response.body.accessToken;
    });

    it('should successfully login receptionist', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'testreceptionist.auth@test.com',
          password: 'receptionist123',
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      receptionistAccessToken = response.body.accessToken;
    });
  });

  describe('Access Token Protection', () => {
    it('should reject requests without access token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject requests with invalid access token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should accept requests with valid access token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.email).toBeDefined();
    });
  });

  describe('RBAC - Admin vs Receptionist', () => {
    it('should allow admin to access user management', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should forbid receptionist from accessing admin routes', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${receptionistAccessToken}`)
        .expect(403);
    });
  });

  describe('Refresh Token Security', () => {
    it('should successfully refresh with valid token', async () => {
      const agent = request.agent(app.getHttpServer());

      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'testadmin.auth@test.com',
          password: 'admin123',
        })
        .expect(200);

      const refreshResponse = await agent
        .post('/api/auth/refresh')
        .expect(200);

      expect(refreshResponse.body.accessToken).toBeDefined();
      // Verify the new token works by setting it in Authorization header
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`)
        .expect(200);
    });

    it('should reject reuse of old refresh token after rotation', async () => {
      const agent = request.agent(app.getHttpServer());

      const loginResponse = await agent
        .post('/api/auth/login')
        .send({
          email: 'testadmin.auth@test.com',
          password: 'admin123',
        })
        .expect(200);

      const oldRefreshToken = loginResponse.body.refreshToken;

      // First refresh
      await agent
        .post('/api/auth/refresh')
        .expect(200);

      // Try to reuse old token with a new agent (no cookies)
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${oldRefreshToken}`)
        .expect(401);
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);
    });

    it('should reject expired refresh token', async () => {
      // Create an expired token in database
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      const tokenHash = await argon2.hash('expired-token');
      await prisma.refreshToken.create({
        data: {
          token: tokenHash,
          userId: adminUserId,
          expiresAt: expiredDate,
        },
      });

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=expired-token')
        .expect(401);
    });
  });

  describe('Logout Security', () => {
    it('should revoke refresh token on logout', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'testadmin.auth@test.com',
          password: 'admin123',
        });

      const logoutToken = loginResponse.body.accessToken;
      const logoutRefresh = loginResponse.body.refreshToken;

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${logoutToken}`)
        .set('Cookie', `refreshToken=${logoutRefresh}`)
        .expect(200);

      // Try to refresh after logout
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${logoutRefresh}`)
        .expect(401);
    });
  });

  describe('Password Security', () => {
    it('should hash passwords with Argon2', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'testadmin.auth@test.com' },
      });

      expect(user.passwordHash).not.toBe('admin123');
      expect(user.passwordHash.length).toBeGreaterThan(50);
    });

    it('should allow password change with correct current password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          currentPassword: 'admin123',
          newPassword: 'newadmin123',
        })
        .expect(200);

      expect(response.body.message).toBe('Password changed successfully');

      // Verify new password works
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'testadmin.auth@test.com',
          password: 'newadmin123',
        })
        .expect(200);

      // Change back for other tests
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          currentPassword: 'newadmin123',
          newPassword: 'admin123',
        })
        .expect(200);
    });

    it('should reject password change with incorrect current password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'anotherpassword',
        })
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login', async () => {
      const responses = [];
      for (let i = 0; i < 15; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'ratelimit@test.com',
            password: 'wrongpassword',
          });
        responses.push(res);
      }

      const rateLimitedResponse = responses[responses.length - 1];

      expect(rateLimitedResponse.status).toBe(429);
    }, 30000);
  });
});
