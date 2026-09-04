import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';

describe('Reports Module Tests (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUserId: string;
  let testPatientId: string;
  let testServiceId: string;
  let adminAccessToken: string;
  let receptionistAccessToken: string;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

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

    const testUsers = await prisma.user.findMany({
      where: { email: { contains: '@test.com' } },
      select: { id: true },
    });
    const testUserIds = testUsers.map((u) => u.id);

    if (testUserIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { userId: { in: testUserIds } } });
    }

    await prisma.payment.deleteMany();
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.service.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });

    const adminPasswordHash = await argon2.hash('admin123');
    const admin = await prisma.user.create({
      data: {
        email: 'testadmin.reports@test.com',
        passwordHash: adminPasswordHash,
        name: 'Test Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
    adminUserId = admin.id;

    const receptionistPasswordHash = await argon2.hash('receptionist123');
    await prisma.user.create({
      data: {
        email: 'testreceptionist.reports@test.com',
        passwordHash: receptionistPasswordHash,
        name: 'Test Receptionist',
        role: 'RECEPTIONIST',
        isActive: true,
      },
    });

    const patient = await prisma.patient.create({
      data: {
        civilId: '11122233344',
        fullNameAr: 'سارة أحمد',
        phone: '99911122',
        createdById: adminUserId,
      },
    });
    testPatientId = patient.id;

    const service = await prisma.service.create({
      data: { name: 'Consultation', currentPrice: 40, isActive: true, createdById: adminUserId },
    });
    testServiceId = service.id;

    // Invoice #1: issued today, fully paid via one CASH payment
    const visit1 = await prisma.visit.create({
      data: { patientId: testPatientId, type: 'CHECKUP', createdById: adminUserId },
    });
    const invoice1 = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-RPT01',
        visitId: visit1.id,
        patientId: testPatientId,
        status: 'ISSUED',
        subtotal: 40,
        total: 40,
        paid: 40,
        remaining: 0,
        paymentStatus: 'PAID',
        createdById: adminUserId,
        issuedAt: today,
        issuedById: adminUserId,
        invoiceItems: {
          create: [{ serviceId: testServiceId, serviceNameSnapshot: 'Consultation', unitPriceSnapshot: 40, quantity: 1, lineTotal: 40 }],
        },
      },
    });

    await prisma.payment.create({
      data: {
        invoiceId: invoice1.id,
        amount: 40,
        method: 'CASH',
        status: 'RECORDED',
        paymentDate: today,
        recordedById: adminUserId,
      },
    });

    // Invoice #2: issued today, partially paid via VISA — leaves a real
    // outstanding balance for the day.
    const visit2 = await prisma.visit.create({
      data: { patientId: testPatientId, type: 'FOLLOW_UP', createdById: adminUserId },
    });
    const invoice2 = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-RPT02',
        visitId: visit2.id,
        patientId: testPatientId,
        status: 'ISSUED',
        subtotal: 40,
        total: 40,
        paid: 15,
        remaining: 25,
        paymentStatus: 'PARTIALLY_PAID',
        createdById: adminUserId,
        issuedAt: today,
        issuedById: adminUserId,
        invoiceItems: {
          create: [{ serviceId: testServiceId, serviceNameSnapshot: 'Consultation', unitPriceSnapshot: 40, quantity: 1, lineTotal: 40 }],
        },
      },
    });

    await prisma.payment.create({
      data: {
        invoiceId: invoice2.id,
        amount: 15,
        method: 'VISA',
        status: 'RECORDED',
        paymentDate: today,
        recordedById: adminUserId,
      },
    });

    // A REVERSED payment on invoice #2 — must be excluded from today's totals.
    await prisma.payment.create({
      data: {
        invoiceId: invoice2.id,
        amount: 100,
        method: 'CASH',
        status: 'REVERSED',
        paymentDate: today,
        reversedAt: today,
        reversedBy: adminUserId,
        reversalNotes: 'Entered by mistake',
        recordedById: adminUserId,
      },
    });

    const adminResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'testadmin.reports@test.com', password: 'admin123' });
    adminAccessToken = adminResponse.body.accessToken;

    const receptionistResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'testreceptionist.reports@test.com', password: 'receptionist123' });
    receptionistAccessToken = receptionistResponse.body.accessToken;
  });

  afterAll(async () => {
    const testUsers = await prisma.user.findMany({
      where: { email: { contains: '@test.com' } },
      select: { id: true },
    });
    const testUserIds = testUsers.map((u) => u.id);

    if (testUserIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { userId: { in: testUserIds } } });
    }

    await prisma.payment.deleteMany();
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.service.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });
    await app.close();
  });

  describe('Daily Closing Report', () => {
    it('should reject access for receptionist (admin-only)', async () => {
      await request(app.getHttpServer())
        .get(`/api/reports/daily-closing?date=${todayStr}`)
        .set('Authorization', `Bearer ${receptionistAccessToken}`)
        .expect(403);
    });

    it('should reject unauthenticated access', async () => {
      await request(app.getHttpServer())
        .get(`/api/reports/daily-closing?date=${todayStr}`)
        .expect(401);
    });

    it("should correctly total today's invoices, excluding VOID and reversed payments", async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reports/daily-closing?date=${todayStr}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.date).toBe(todayStr);
      expect(response.body.invoiceCount).toBe(2);
      expect(response.body.totalInvoiced).toBe(80); // 40 + 40
      // 40 (full) + 15 (partial) = 55 — the REVERSED 100 CASH payment must NOT count
      expect(response.body.totalCollected).toBe(55);
      expect(response.body.totalRemaining).toBe(25); // only invoice #2's balance

      expect(response.body.paymentStatusCounts).toEqual({
        UNPAID: 0,
        PARTIALLY_PAID: 1,
        PAID: 1,
      });
    });

    it('should break down collected payments by method, excluding the reversed one', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reports/daily-closing?date=${todayStr}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const cash = response.body.paymentMethods.find((m: { method: string }) => m.method === 'CASH');
      const visa = response.body.paymentMethods.find((m: { method: string }) => m.method === 'VISA');

      // Only the 40 RECORDED cash payment should count — not the 100 reversed one.
      expect(cash.amount).toBe(40);
      expect(cash.count).toBe(1);
      expect(visa.amount).toBe(15);
      expect(visa.count).toBe(1);
    });

    it('should list the actual invoices and payments for the day', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/reports/daily-closing?date=${todayStr}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.invoices).toHaveLength(2);
      expect(response.body.invoices[0].patientName).toBe('سارة أحمد');
      // Only RECORDED payments are listed — the reversed one is excluded here too.
      expect(response.body.payments).toHaveLength(2);
    });

    it('should return all zeros for a date with no activity', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/reports/daily-closing?date=2020-01-01')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.invoiceCount).toBe(0);
      expect(response.body.totalInvoiced).toBe(0);
      expect(response.body.totalCollected).toBe(0);
      expect(response.body.invoices).toHaveLength(0);
      expect(response.body.payments).toHaveLength(0);
    });

    it('should default to today when no date is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/reports/daily-closing')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.date).toBe(todayStr);
    });
  });
});
