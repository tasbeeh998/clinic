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
  let adminAccessToken: string;
  let adminUserId: string;
  let testPatientId: string;
  let testVisitId: string;
  let testInvoiceId: string;
  let testServiceId: string;

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
    await prisma.paymentAllocation.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoiceAdditionalCharge.deleteMany();
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.service.deleteMany();
    await prisma.patient.deleteMany({
      where: { civilId: '10000000' },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.com' } },
    });

    // Create admin user
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

    // Get admin token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'testadmin.reports@test.com', password: 'admin123' });
    adminAccessToken = loginResponse.body.accessToken;

    // Create test patient
    const patient = await prisma.patient.create({
      data: {
        civilId: '10000000',
        fullNameAr: 'تقارير اختبار',
        fullNameEn: 'Test Reports',
        phone: '5551234567',
        createdById: adminUserId,
      },
    });
    testPatientId = patient.id;

    // Create visit
    const visit = await prisma.visit.create({
      data: {
        patientId: testPatientId,
        type: 'OTHER',
        createdById: adminUserId,
      },
    });
    testVisitId = visit.id;

    // Create service
    const service = await prisma.service.create({
      data: {
        name: 'تقرير اختبار',
        code: 'TEST-001',
        currentPrice: 50,
        isActive: true,
        createdById: adminUserId,
      },
    });
    testServiceId = service.id;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'DRAFT-test-reports',
        visitId: testVisitId,
        patientId: testPatientId,
        status: 'DRAFT',
        subtotal: 50,
        total: 50,
        paid: 0,
        remaining: 50,
        paymentStatus: 'UNPAID',
        createdById: adminUserId,
        invoiceItems: {
          create: {
            serviceNameSnapshot: 'تقرير اختبار',
            unitPriceSnapshot: 50,
            quantity: 1,
            lineTotal: 50,
            serviceId: service.id,
          },
        },
      },
    });
    testInvoiceId = invoice.id;
  });

  afterAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.paymentAllocation.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.invoiceAdditionalCharge.deleteMany();
    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.service.deleteMany();
    await prisma.patient.deleteMany({
      where: { civilId: '10000000' },
    });
    
    // Delete audit logs for test users first
    const cleanupTestUsers = await prisma.user.findMany({
      where: { email: { contains: '@test.com' } },
      select: { id: true },
    });
    const cleanupTestUserIds = cleanupTestUsers.map(u => u.id);

    if (cleanupTestUserIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { userId: { in: cleanupTestUserIds } },
      });
    }
    
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.com' } },
    });
    await app.close();
  });

  describe('Payment Reversal Exclusion', () => {
    it('should include RECORDED payment in summary total collected', async () => {
      // Create a RECORDED payment
      const payment = await prisma.payment.create({
        data: {
          invoiceId: testInvoiceId,
          amount: 30,
          method: 'VISA',
          status: 'RECORDED',
          recordedById: adminUserId,
        },
      });

      // Get summary including the new payment
      const response = await request(app.getHttpServer())
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.totalCollected).toBeGreaterThan(0);
      
      // Clean up
      await prisma.payment.delete({ where: { id: payment.id } });
    });

    it('should exclude REVERSED payment from summary total collected', async () => {
      // Create a payment
      const payment = await prisma.payment.create({
        data: {
          invoiceId: testInvoiceId,
          amount: 30,
          method: 'VISA',
          status: 'RECORDED',
          recordedById: adminUserId,
        },
      });

      // Get summary including the new payment
      const summaryBefore = await request(app.getHttpServer())
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
      const collectedBefore = summaryBefore.body.totalCollected;

      // Reverse the payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversedBy: adminUserId,
          reversalNotes: 'Test reversal',
        },
      });

      // Get summary after reversal
      const summaryAfter = await request(app.getHttpServer())
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
      const collectedAfter = summaryAfter.body.totalCollected;

      // Collected amount should decrease by the reversed payment amount
      expect(collectedAfter).toBeLessThan(collectedBefore);
      expect(collectedAfter).toBe(collectedBefore - 30);
    });

    it('should exclude REVERSED payments from payment method breakdown', async () => {
      // Create payments with different methods
      const cashPayment = await prisma.payment.create({
        data: {
          invoiceId: testInvoiceId,
          amount: 100,
          method: 'CASH',
          status: 'RECORDED',
          recordedById: adminUserId,
        },
      });

      const visaPayment = await prisma.payment.create({
        data: {
          invoiceId: testInvoiceId,
          amount: 75,
          method: 'VISA',
          status: 'RECORDED',
          recordedById: adminUserId,
        },
      });

      // Get payment method breakdown before reversal
      const breakdownBefore = await request(app.getHttpServer())
        .get('/api/reports/payment-methods')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
      const cashBefore = breakdownBefore.body.find((m: any) => m.method === 'CASH')?.amount || 0;
      const visaBefore = breakdownBefore.body.find((m: any) => m.method === 'VISA')?.amount || 0;

      // Reverse the VISA payment
      await prisma.payment.update({
        where: { id: visaPayment.id },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversedBy: adminUserId,
          reversalNotes: 'Test reversal',
        },
      });

      // Get payment method breakdown after reversal
      const breakdownAfter = await request(app.getHttpServer())
        .get('/api/reports/payment-methods')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
      const cashAfter = breakdownAfter.body.find((m: any) => m.method === 'CASH')?.amount || 0;
      const visaAfter = breakdownAfter.body.find((m: any) => m.method === 'VISA')?.amount || 0;

      // CASH should remain the same
      expect(cashAfter).toBe(cashBefore);

      // VISA should be excluded
      expect(visaAfter).toBe(0);

      // Clean up
      await prisma.payment.deleteMany({ where: { id: { in: [cashPayment.id, visaPayment.id] } } });
    });

    it('should exclude REVERSED payments from revenue timeseries', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const payment = await prisma.payment.create({
        data: {
          invoiceId: testInvoiceId,
          amount: 40,
          method: 'KNET',
          status: 'RECORDED',
          // Use UTC to ensure it falls within the report range regardless of timezone
          paymentDate: new Date(`${today}T12:00:00.000Z`),
          recordedById: adminUserId,
        },
      });

      // Get revenue timeseries before reversal
      const timeseriesBefore = await request(app.getHttpServer())
        .get(`/api/reports/revenue-timeseries?from=${today}&to=${today}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
      const collectedBefore = timeseriesBefore.body.find((t: any) => t.date === today)?.collected || 0;

      // Reverse the payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversedBy: adminUserId,
          reversalNotes: 'Test reversal',
        },
      });

      // Get revenue timeseries after reversal
      const timeseriesAfter = await request(app.getHttpServer())
        .get(`/api/reports/revenue-timeseries?from=${today}&to=${today}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
      const collectedAfter = timeseriesAfter.body.find((t: any) => t.date === today)?.collected || 0;

      // Collected amount should decrease
      expect(collectedAfter).toBeLessThan(collectedBefore);
      expect(collectedAfter).toBe(collectedBefore - 40);
    });
  });
});
