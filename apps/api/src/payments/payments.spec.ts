import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';

describe('Payments Module Tests (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUserId: string;
  let testPatientId: string;
  let testServiceId: string;
  let draftInvoiceId: string;
  let issuedInvoiceId: string; // total 50, used across the payment flow tests
  let fullyPaidInvoiceId: string;
  let adminAccessToken: string;
  let receptionistAccessToken: string;

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
    const testUserIds = testUsers.map(u => u.id);

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
        email: 'testadmin.payments@test.com',
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
        email: 'testreceptionist.payments@test.com',
        passwordHash: receptionistPasswordHash,
        name: 'Test Receptionist',
        role: 'RECEPTIONIST',
        isActive: true,
      },
    });

    const patient = await prisma.patient.create({
      data: {
        civilId: '98765432101',
        fullNameAr: 'منى خالد',
        phone: '99987654',
        createdById: adminUserId,
      },
    });
    testPatientId = patient.id;

    const service = await prisma.service.create({
      data: { name: 'Consultation', currentPrice: 50, isActive: true, createdById: adminUserId },
    });
    testServiceId = service.id;

    // A draft invoice (should reject payments)
    const draftVisit = await prisma.visit.create({
      data: { patientId: testPatientId, type: 'CHECKUP', createdById: adminUserId },
    });
    const draftInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-TEST01',
        visitId: draftVisit.id,
        patientId: testPatientId,
        status: 'DRAFT',
        subtotal: 50,
        total: 50,
        paid: 0,
        remaining: 50,
        paymentStatus: 'UNPAID',
        createdById: adminUserId,
        invoiceItems: {
          create: [{ serviceId: testServiceId, serviceNameSnapshot: 'Consultation', unitPriceSnapshot: 50, quantity: 1, lineTotal: 50 }],
        },
      },
    });
    draftInvoiceId = draftInvoice.id;

    // An issued invoice with a 50 KD balance, used for the main payment flow
    const issuedVisit = await prisma.visit.create({
      data: { patientId: testPatientId, type: 'FOLLOW_UP', createdById: adminUserId },
    });
    const issuedInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-TEST02',
        visitId: issuedVisit.id,
        patientId: testPatientId,
        status: 'ISSUED',
        subtotal: 50,
        total: 50,
        paid: 0,
        remaining: 50,
        paymentStatus: 'UNPAID',
        createdById: adminUserId,
        issuedAt: new Date(),
        issuedById: adminUserId,
        invoiceItems: {
          create: [{ serviceId: testServiceId, serviceNameSnapshot: 'Consultation', unitPriceSnapshot: 50, quantity: 1, lineTotal: 50 }],
        },
      },
    });
    issuedInvoiceId = issuedInvoice.id;

    // An already fully-paid invoice (should reject further payments)
    const paidVisit = await prisma.visit.create({
      data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
    });
    const paidInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-TEST03',
        visitId: paidVisit.id,
        patientId: testPatientId,
        status: 'ISSUED',
        subtotal: 50,
        total: 50,
        paid: 50,
        remaining: 0,
        paymentStatus: 'PAID',
        createdById: adminUserId,
        issuedAt: new Date(),
        issuedById: adminUserId,
        invoiceItems: {
          create: [{ serviceId: testServiceId, serviceNameSnapshot: 'Consultation', unitPriceSnapshot: 50, quantity: 1, lineTotal: 50 }],
        },
      },
    });
    fullyPaidInvoiceId = paidInvoice.id;

    const adminResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'testadmin.payments@test.com', password: 'admin123' });
    adminAccessToken = adminResponse.body.accessToken;

    const receptionistResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'testreceptionist.payments@test.com', password: 'receptionist123' });
    receptionistAccessToken = receptionistResponse.body.accessToken;
  });

  afterAll(async () => {
    const testUsers = await prisma.user.findMany({
      where: { email: { contains: '@test.com' } },
      select: { id: true },
    });
    const testUserIds = testUsers.map(u => u.id);

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

  describe('Payment Creation', () => {
    it('should reject a payment on a draft invoice', async () => {
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ invoiceId: draftInvoiceId, amount: 10, method: 'CASH' })
        .expect(400);
    });

    it('should reject a payment on an already fully-paid invoice', async () => {
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ invoiceId: fullyPaidInvoiceId, amount: 10, method: 'CASH' })
        .expect(400);
    });

    it('should reject a payment for a non-existent invoice', async () => {
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ invoiceId: '00000000-0000-0000-0000-000000000000', amount: 10, method: 'CASH' })
        .expect(404);
    });

    it('should reject a payment exceeding the remaining balance', async () => {
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ invoiceId: issuedInvoiceId, amount: 999, method: 'CASH' })
        .expect(400);
    });

    it('should reject a zero or negative amount', async () => {
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ invoiceId: issuedInvoiceId, amount: 0, method: 'CASH' })
        .expect(400);
    });

    it('should reject an invalid payment method', async () => {
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ invoiceId: issuedInvoiceId, amount: 10, method: 'BITCOIN' })
        .expect(400);
    });

    it('should record a partial payment and move the invoice to PARTIALLY_PAID', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ invoiceId: issuedInvoiceId, amount: 20, method: 'KNET' })
        .expect(201);

      expect(Number(response.body.amount)).toBe(20);
      expect(response.body.method).toBe('KNET');

      const invoice = await prisma.invoice.findUnique({ where: { id: issuedInvoiceId } });
      expect(Number(invoice.paid)).toBe(20);
      expect(Number(invoice.remaining)).toBe(30);
      expect(invoice.paymentStatus).toBe('PARTIALLY_PAID');
    });

    it('should record a payment as receptionist', async () => {
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${receptionistAccessToken}`)
        .send({ invoiceId: issuedInvoiceId, amount: 10, method: 'OTHER', notes: 'Bank transfer' })
        .expect(201);

      const invoice = await prisma.invoice.findUnique({ where: { id: issuedInvoiceId } });
      expect(Number(invoice.paid)).toBe(30);
      expect(invoice.paymentStatus).toBe('PARTIALLY_PAID');
    });

    it('should record the final payment and move the invoice to PAID', async () => {
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ invoiceId: issuedInvoiceId, amount: 20, method: 'VISA' })
        .expect(201);

      const invoice = await prisma.invoice.findUnique({ where: { id: issuedInvoiceId } });
      expect(Number(invoice.paid)).toBe(50);
      expect(Number(invoice.remaining)).toBe(0);
      expect(invoice.paymentStatus).toBe('PAID');
    });

    it('should reject a further payment now that the invoice is fully paid', async () => {
      await request(app.getHttpServer())
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ invoiceId: issuedInvoiceId, amount: 5, method: 'CASH' })
        .expect(400);
    });

    it('should reject unauthenticated payment creation', async () => {
      await request(app.getHttpServer())
        .post('/api/payments')
        .send({ invoiceId: issuedInvoiceId, amount: 5, method: 'CASH' })
        .expect(401);
    });
  });

  describe('Payment Retrieval', () => {
    it('should list all payments for an invoice', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/payments?invoiceId=${issuedInvoiceId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(3);
    });

    it('should require invoiceId query param', async () => {
      await request(app.getHttpServer())
        .get('/api/payments')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(400);
    });

    it('should reject unauthenticated payment list', async () => {
      await request(app.getHttpServer())
        .get(`/api/payments?invoiceId=${issuedInvoiceId}`)
        .expect(401);
    });
  });

  describe('Payment Removal (Admin only)', () => {
    let paymentToRemoveId: string;

    beforeAll(async () => {
      const payment = await prisma.payment.findFirst({ where: { invoiceId: issuedInvoiceId, amount: 10 } });
      paymentToRemoveId = payment.id;
    });

    it('should reject removal by receptionist', async () => {
      await request(app.getHttpServer())
        .delete(`/api/payments/${paymentToRemoveId}`)
        .set('Authorization', `Bearer ${receptionistAccessToken}`)
        .expect(403);
    });

    it('should remove a payment as admin and reverse the invoice totals', async () => {
      await request(app.getHttpServer())
        .delete(`/api/payments/${paymentToRemoveId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const invoice = await prisma.invoice.findUnique({ where: { id: issuedInvoiceId } });
      expect(Number(invoice.paid)).toBe(40);
      expect(Number(invoice.remaining)).toBe(10);
      expect(invoice.paymentStatus).toBe('PARTIALLY_PAID');
    });

    it('should reject unauthenticated removal', async () => {
      await request(app.getHttpServer())
        .delete(`/api/payments/${paymentToRemoveId}`)
        .expect(401);
    });
  });

  describe('Audit Logging', () => {
    it('should log payment creation', async () => {
      const logs = await prisma.auditLog.findMany({ where: { entityType: 'Payment', action: 'CREATE' } });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should log payment removal', async () => {
      const logs = await prisma.auditLog.findMany({ where: { entityType: 'Payment', action: 'DELETE' } });
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
