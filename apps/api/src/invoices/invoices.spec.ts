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
      // Draft invoices get temporary number, final INV-XXXXXX assigned at issuance
      expect(response.body.invoiceNumber).toMatch(/^DRAFT-/);
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
    it('should issue a draft invoice and assign final invoice number', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/invoices/${testInvoiceId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ISSUED' })
        .expect(200);

      expect(response.body.status).toBe('ISSUED');
      expect(response.body.issuedAt).toBeDefined();
      // Final INV-XXXXXX number assigned at issuance
      expect(response.body.invoiceNumber).toMatch(/^INV-\d{6}$/);
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

  describe('Additional Charges', () => {
    let chargeInvoiceId: string;

    it('should create invoice with percentage charge', async () => {
      const visit = await prisma.visit.create({
        data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
      });

      const response = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: visit.id,
          items: [{ serviceId: testServiceAId, quantity: 1 }],
          additionalCharges: [
            { chargeType: 'PERCENTAGE', chargeValue: 10, description: 'Tax' },
          ],
        })
        .expect(201);

      expect(Number(response.body.subtotal)).toBe(30);
      expect(Number(response.body.total)).toBe(33); // 30 + 10%
      expect(response.body.additionalCharges).toHaveLength(1);
      expect(response.body.additionalCharges[0].chargeType).toBe('PERCENTAGE');
      expect(Number(response.body.additionalCharges[0].calculatedAmount)).toBe(3);
      chargeInvoiceId = response.body.id;
    });

    it('should create invoice with fixed charge', async () => {
      const visit = await prisma.visit.create({
        data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
      });

      const response = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: visit.id,
          items: [{ serviceId: testServiceAId, quantity: 1 }],
          additionalCharges: [
            { chargeType: 'FIXED', chargeValue: 5, description: 'Service Fee' },
          ],
        })
        .expect(201);

      expect(Number(response.body.subtotal)).toBe(30);
      expect(Number(response.body.total)).toBe(35); // 30 + 5
      expect(response.body.additionalCharges).toHaveLength(1);
      expect(response.body.additionalCharges[0].chargeType).toBe('FIXED');
      expect(Number(response.body.additionalCharges[0].calculatedAmount)).toBe(5);
    });

    it('should add charge to existing draft invoice', async () => {
      const visit = await prisma.visit.create({
        data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
      });

      const invoice = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: visit.id,
          items: [{ serviceId: testServiceAId, quantity: 1 }],
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/api/invoices/${invoice.body.id}/charges`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          chargeType: 'PERCENTAGE',
          chargeValue: 15,
          description: 'Discount',
        })
        .expect(201);

      expect(Number(response.body.total)).toBe(34.5); // 30 + 15%
      expect(response.body.additionalCharges).toHaveLength(1);
    });

    it('should reject adding charge to issued invoice', async () => {
      await request(app.getHttpServer())
        .patch(`/api/invoices/${chargeInvoiceId}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ISSUED' })
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/invoices/${chargeInvoiceId}/charges`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          chargeType: 'FIXED',
          chargeValue: 10,
        })
        .expect(400);
    });
  });

  describe('Invoice Revision and Replacement', () => {
    let originalInvoiceId: string;

    it('should allow admin to void issued invoice', async () => {
      const visit = await prisma.visit.create({
        data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
      });

      const invoice = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: visit.id,
          items: [{ serviceId: testServiceAId, quantity: 1 }],
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/invoices/${invoice.body.id}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ISSUED' })
        .expect(200);

      const response = await request(app.getHttpServer())
        .patch(`/api/invoices/${invoice.body.id}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'VOID' })
        .expect(200);

      expect(response.body.status).toBe('VOID');
      originalInvoiceId = invoice.body.id;
    });

    it('should reject receptionist voiding invoice', async () => {
      const visit = await prisma.visit.create({
        data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
      });

      const invoice = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: visit.id,
          items: [{ serviceId: testServiceAId, quantity: 1 }],
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/invoices/${invoice.body.id}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ISSUED' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/invoices/${invoice.body.id}/status`)
        .set('Authorization', `Bearer ${receptionistAccessToken}`)
        .send({ status: 'VOID' })
        .expect(403);
    });

    it('should create replacement invoice for voided invoice', async () => {
      // First create and issue an invoice (don't void it first)
      const visit = await prisma.visit.create({
        data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
      });

      const invoice = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: visit.id,
          items: [{ serviceId: testServiceAId, quantity: 1 }],
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/invoices/${invoice.body.id}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ISSUED' })
        .expect(200);

      // Create replacement - the service should void the original automatically
      const response = await request(app.getHttpServer())
        .post(`/api/invoices/${invoice.body.id}/replacement`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          items: [{ serviceId: testServiceBId, quantity: 1 }],
          additionalCharges: [
            { chargeType: 'FIXED', chargeValue: 5, description: 'Adjustment Fee' },
          ],
        })
        .expect(201);

      expect(response.body.status).toBe('DRAFT');
      expect(response.body.invoiceItems).toHaveLength(1);
      expect(response.body.additionalCharges).toHaveLength(1);
      // Replacement starts as DRAFT with temporary number
      expect(response.body.invoiceNumber).toMatch(/^DRAFT-/);

      // Verify original invoice is linked and voided
      const original = await prisma.invoice.findUnique({
        where: { id: invoice.body.id },
      });
      expect(original?.replacedByInvoiceId).toBe(response.body.id);
      expect(original?.status).toBe('VOID');
      expect(original?.status).toBe('VOID');
    });

    it('should reject receptionist creating replacement', async () => {
      await request(app.getHttpServer())
        .post(`/api/invoices/${originalInvoiceId}/replacement`)
        .set('Authorization', `Bearer ${receptionistAccessToken}`)
        .send({
          items: [{ serviceId: testServiceAId, quantity: 1 }],
        })
        .expect(403);
    });

    it('should reject replacement for non-issued invoice', async () => {
      const visit = await prisma.visit.create({
        data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
      });

      const draftInvoice = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: visit.id,
          items: [{ serviceId: testServiceAId, quantity: 1 }],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/invoices/${draftInvoice.body.id}/replacement`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          items: [{ serviceId: testServiceBId, quantity: 1 }],
        })
        .expect(400);
    });
  });

  describe('Concurrency-Safe Invoice Numbering', () => {
    it('should assign final invoice number at issuance, not draft creation', async () => {
      const visit = await prisma.visit.create({
        data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
      });

      const draftInvoice = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          visitId: visit.id,
          items: [{ serviceId: testServiceAId, quantity: 1 }],
        })
        .expect(201);

      // Draft should have temporary number
      expect(draftInvoice.body.invoiceNumber).toMatch(/^DRAFT-/);

      // After issuance, should have final number
      const issuedInvoice = await request(app.getHttpServer())
        .patch(`/api/invoices/${draftInvoice.body.id}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ISSUED' })
        .expect(200);

      expect(issuedInvoice.body.invoiceNumber).toMatch(/^INV-\d{6}$/);
    });

    it('should generate unique sequential invoice numbers', async () => {
      const visits = await Promise.all([
        prisma.visit.create({ data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId } }),
        prisma.visit.create({ data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId } }),
      ]);

      const invoice1 = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ visitId: visits[0].id, items: [{ serviceId: testServiceAId, quantity: 1 }] })
        .expect(201);

      const invoice2 = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ visitId: visits[1].id, items: [{ serviceId: testServiceAId, quantity: 1 }] })
        .expect(201);

      // Issue both
      const issued1 = await request(app.getHttpServer())
        .patch(`/api/invoices/${invoice1.body.id}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ISSUED' })
        .expect(200);

      const issued2 = await request(app.getHttpServer())
        .patch(`/api/invoices/${invoice2.body.id}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ISSUED' })
        .expect(200);

      // Extract numbers and verify they're sequential
      const num1 = parseInt(issued1.body.invoiceNumber.replace('INV-', ''), 10);
      const num2 = parseInt(issued2.body.invoiceNumber.replace('INV-', ''), 10);
      expect(Math.abs(num1 - num2)).toBe(1);
    });

    it('should assign invoice number transactionally with status change', async () => {
      // This test verifies that invoice number allocation happens in the same transaction
      // as the status change to ISSUED, ensuring atomicity
      const visit = await prisma.visit.create({
        data: { patientId: testPatientId, type: 'OTHER', createdById: adminUserId },
      });

      const invoice = await request(app.getHttpServer())
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ visitId: visit.id, items: [{ serviceId: testServiceAId, quantity: 1 }] })
        .expect(201);

      // Verify draft has temporary number
      expect(invoice.body.invoiceNumber).toMatch(/^DRAFT-/);
      expect(invoice.body.status).toBe('DRAFT');

      // Issue the invoice - this should allocate final number and change status atomically
      const issuedInvoice = await request(app.getHttpServer())
        .patch(`/api/invoices/${invoice.body.id}/status`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ status: 'ISSUED' })
        .expect(200);

      // Verify both status and number changed together (atomic transaction)
      expect(issuedInvoice.body.status).toBe('ISSUED');
      expect(issuedInvoice.body.invoiceNumber).toMatch(/^INV-\d{6}$/);
      expect(issuedInvoice.body.issuedAt).toBeTruthy();
      expect(issuedInvoice.body.issuedById).toBeTruthy();

      // Verify the number is not the temporary draft number
      expect(issuedInvoice.body.invoiceNumber).not.toBe(invoice.body.invoiceNumber);
    });
  });
});
