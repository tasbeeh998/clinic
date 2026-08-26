import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';

describe('Invoices Module Tests (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminUserId: string;
  let testPatientId: string;
  let testServiceAId: string;
  let testServiceBId: string;
  let inactiveServiceId: string;
  let testVisitId: string;
  let secondVisitId: string;
  let testInvoiceId: string;
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

    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.service.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.com' } },
    });

    // Create admin user
    const adminPasswordHash = await argon2.hash('admin123');
    const admin = await prisma.user.create({
      data: {
        email: 'testadmin.invoices@test.com',
        passwordHash: adminPasswordHash,
        name: 'Test Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });
    adminUserId = admin.id;

    // Create receptionist user
    const receptionistPasswordHash = await argon2.hash('receptionist123');
    await prisma.user.create({
      data: {
        email: 'testreceptionist.invoices@test.com',
        passwordHash: receptionistPasswordHash,
        name: 'Test Receptionist',
        role: 'RECEPTIONIST',
        isActive: true,
      },
    });

    // Create test patient
    const patient = await prisma.patient.create({
      data: {
        civilId: '12345670001',
        fullNameAr: 'سارة أحمد',
        fullNameEn: 'Sara Ahmed',
        phone: '99912345',
        createdById: adminUserId,
      },
    });
    testPatientId = patient.id;

    // Create services (mirrors the clinic's real catalog example)
    const serviceA = await prisma.service.create({
      data: { name: 'Follow-up', currentPrice: 30, isActive: true, createdById: adminUserId },
    });
    testServiceAId = serviceA.id;

    const serviceB = await prisma.service.create({
      data: { name: 'Sonar 4D', currentPrice: 40, isActive: true, createdById: adminUserId },
    });
    testServiceBId = serviceB.id;

    const inactiveService = await prisma.service.create({
      data: { name: 'Discontinued Service', currentPrice: 15, isActive: false, createdById: adminUserId },
    });
    inactiveServiceId = inactiveService.id;

    // Create visits to invoice against
    const visit = await prisma.visit.create({
      data: { patientId: testPatientId, type: 'CHECKUP', createdById: adminUserId },
    });
    testVisitId = visit.id;

    const secondVisit = await prisma.visit.create({
      data: { patientId: testPatientId, type: 'FOLLOW_UP', createdById: adminUserId },
    });
    secondVisitId = secondVisit.id;

    // Get tokens once for all tests
    const adminResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'testadmin.invoices@test.com', password: 'admin123' });
    adminAccessToken = adminResponse.body.accessToken;

    const receptionistResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'testreceptionist.invoices@test.com', password: 'receptionist123' });
    receptionistAccessToken = receptionistResponse.body.accessToken;
  });

  afterAll(async () => {
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

    await prisma.invoiceItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.visit.deleteMany();
    await prisma.service.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.com' } },
    });
    await app.close();
  });

  describe('Invoice Creation', () => {
    it('should create an invoice as admin with multiple items and correct totals', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: testVisitId,
          items: [
            { serviceId: testServiceAId, quantity: 1 },
            { serviceId: testServiceBId, quantity: 1 },
          ],
        })
        .expect(201);

      expect(response.body.status).toBe('DRAFT');
      expect(Number(response.body.subtotal)).toBe(70);
      expect(Number(response.body.total)).toBe(70);
      expect(Number(response.body.remaining)).toBe(70);
      expect(response.body.paymentStatus).toBe('UNPAID');
      expect(response.body.invoiceNumber).toMatch(/^INV-\d{6}$/);
      expect(response.body.invoiceItems).toHaveLength(2);
      testInvoiceId = response.body.id;
    });

    it('should snapshot the service name and price on the invoice item', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/invoices/${testInvoiceId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      const item = response.body.invoiceItems.find((i: { serviceId: string }) => i.serviceId === testServiceAId);
      expect(item.serviceNameSnapshot).toBe('Follow-up');
      expect(Number(item.unitPriceSnapshot)).toBe(30);
    });

    it('should create an invoice as receptionist', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${receptionistAccessToken}`)
        .send({
          visitId: secondVisitId,
          items: [{ serviceId: testServiceAId, quantity: 2 }],
        })
        .expect(201);

      expect(Number(response.body.total)).toBe(60);
    });

    it('should reject a second invoice for the same visit', async () => {
      await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: testVisitId,
          items: [{ serviceId: testServiceAId, quantity: 1 }],
        })
        .expect(409);
    });

    it('should reject an invoice for a non-existent visit', async () => {
      await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: '00000000-0000-0000-0000-000000000000',
          items: [{ serviceId: testServiceAId, quantity: 1 }],
        })
        .expect(404);
    });

    it('should reject an invoice referencing an inactive service', async () => {
      const visit = await prisma.visit.create({
        data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
      });

      await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: visit.id,
          items: [{ serviceId: inactiveServiceId, quantity: 1 }],
        })
        .expect(400);
    });

    it('should reject an invoice with no items', async () => {
      const visit = await prisma.visit.create({
        data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
      });

      await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ visitId: visit.id, items: [] })
        .expect(400);
    });

    it('should reject unauthenticated invoice creation', async () => {
      await request(app.getHttpServer())
        .post('/api/invoices')
        .send({ visitId: testVisitId, items: [{ serviceId: testServiceAId, quantity: 1 }] })
        .expect(401);
    });
  });

  describe('Invoice Retrieval', () => {
    it('should get invoice by ID as admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/invoices/${testInvoiceId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testInvoiceId);
    });

    it('should get invoice by ID as receptionist', async () => {
      await request(app.getHttpServer())
        .get(`/api/invoices/${testInvoiceId}`)
        .set('Authorization', `Bearer ${receptionistAccessToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent invoice', async () => {
      await request(app.getHttpServer())
        .get('/api/invoices/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });

    it('should reject unauthenticated invoice retrieval', async () => {
      await request(app.getHttpServer())
        .get(`/api/invoices/${testInvoiceId}`)
        .expect(401);
    });
  });

  describe('Invoice List and Filters', () => {
    it('should list invoices as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter by patientId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/invoices?patientId=${testPatientId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data.every((inv: { patientId: string }) => inv.patientId === testPatientId)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/invoices?status=DRAFT')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data.every((inv: { status: string }) => inv.status === 'DRAFT')).toBe(true);
    });

    it('should reject unauthenticated invoice list', async () => {
      await request(app.getHttpServer())
        .get('/api/invoices')
        .expect(401);
    });
  });

  describe('Invoice Status Transitions', () => {
    it('should issue a draft invoice', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/invoices/${testInvoiceId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ISSUED' })
        .expect(200);

      expect(response.body.status).toBe('ISSUED');
      expect(response.body.issuedAt).toBeDefined();
    });

    it('should reject transitioning an issued invoice back to draft', async () => {
      await request(app.getHttpServer())
        .patch(`/api/invoices/${testInvoiceId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'DRAFT' })
        .expect(400);
    });

    it('should void an issued invoice', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/invoices/${testInvoiceId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'VOID' })
        .expect(200);

      expect(response.body.status).toBe('VOID');
    });

    it('should reject any transition out of a voided invoice', async () => {
      await request(app.getHttpServer())
        .patch(`/api/invoices/${testInvoiceId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ISSUED' })
        .expect(400);
    });

    it('should reject unauthenticated status change', async () => {
      await request(app.getHttpServer())
        .patch(`/api/invoices/${testInvoiceId}/status`)
        .send({ status: 'VOID' })
        .expect(401);
    });
  });

  describe('Audit Logging', () => {
    it('should log invoice creation', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { entityType: 'Invoice', action: 'CREATE' },
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('should log invoice status changes', async () => {
      const logs = await prisma.auditLog.findMany({
        where: { entityType: 'Invoice', action: 'STATUS_CHANGE' },
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
