import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

describe('اختبارات التكامل لنظام المجد لإدارة التوصيل (Integration Tests)', () => {
  let adminToken: string;
  let staffToken: string;
  let ofokToken: string;
  let company1Id: string;
  let company2Id: string;
  let driver1Id: string;
  let driver2Id: string;

  beforeAll(async () => {
    // 1. تسجيل دخول المدير العام
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@almajd.sa', password: 'Admin@123456' });

    expect(adminLoginRes.status).toBe(200);
    adminToken = adminLoginRes.body.data.token;

    // 2. تسجيل دخول موظف المجد
    const staffLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'staff@almajd.sa', password: 'Staff@123456' });
    expect(staffLoginRes.status).toBe(200);
    staffToken = staffLoginRes.body.data.token;

    // 3. تسجيل دخول مدير شركة أفق
    const ofokLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ofok.admin@decor.sa', password: 'Admin@123456' });
    expect(ofokLoginRes.status).toBe(200);
    ofokToken = ofokLoginRes.body.data.token;

    // جلب معرفات الشركات والسائقين
    const companies = await prisma.company.findMany({ select: { id: true, name: true } });
    const c1 = companies.find(c => c.name.includes('المجد'));
    const c2 = companies.find(c => c.name.includes('أفق'));
    company1Id = c1!.id;
    company2Id = c2!.id;

    let driversC1 = await prisma.driver.findMany({ where: { companyId: company1Id, isDeleted: false } });
    if (driversC1.length === 0) {
      const d1 = await prisma.driver.create({
        data: { companyId: company1Id, name: 'موصل المجد للاختبار', phone: '0910001122', vehicleType: 'VAN' },
      });
      driversC1 = [d1];
    }
    let driversC2 = await prisma.driver.findMany({ where: { companyId: company2Id, isDeleted: false } });
    if (driversC2.length === 0) {
      const d2 = await prisma.driver.create({
        data: { companyId: company2Id, name: 'موصل أفق للاختبار', phone: '0910003344', vehicleType: 'SEDAN' },
      });
      driversC2 = [d2];
    }
    driver1Id = driversC1[0].id;
    driver2Id = driversC2[0].id;
  });

  // ==================== 1. اختبارات المصادقة والحماية ====================
  describe('المصادقة والصلاحيات (Auth & RBAC)', () => {
    it('يجب أن يرفض الوصول إلى المسارات المحمية بدون رمز المصادقة (401)', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('يجب أن يرفض تسجيل الدخول بكلمة مرور خاطئة (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@almajd.sa', password: 'wrongPassword' });
      expect(res.status).toBe(401);
    });

    it('يجب أن يعيد بيانات المستخدم وقائمة شركاته المصرح بها عبر /auth/me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('admin@almajd.sa');
      expect(res.body.data.companies.length).toBeGreaterThan(0);
    });
  });

  // ==================== 2. اختبارات عزل بيانات الشركات Multi-Tenant ====================
  describe('عزل بيانات الشركات (Multi-Tenant Isolation)', () => {
    it('يجب أن يمنع موظف شركة المجد من الوصول إلى بيانات شركة أفق الأثاث (403)', async () => {
      const res = await request(app)
        .get('/api/v1/drivers')
        .set('Authorization', `Bearer ${staffToken}`)
        .set('X-Company-Id', company2Id);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('صلاحية');
    });

    it('يجب أن يمنع مدير شركة أفق من تعديل أو قراءة سائقي شركة المجد (403)', async () => {
      const res = await request(app)
        .get('/api/v1/drivers')
        .set('Authorization', `Bearer ${ofokToken}`)
        .set('X-Company-Id', company1Id);

      expect(res.status).toBe(403);
    });

    it('يجب أن يمنع ربط مشوار لسائق ينتمي لشركة أخرى (400)', async () => {
      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Company-Id', company1Id)
        .send({
          driverId: driver2Id, // سائق من شركة أفق
          customerName: 'عميل اختبار',
          tripDate: '2026-10-29',
          tripTime: '15:00',
          durationMinutes: 30,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('السائق المحدد غير موجود في هذه الشركة');
    });
  });

  // ==================== 3. اختبارات الرحلات والمدفوعات والتوصيل ====================
  describe('الرحلات والتوصيل والمدفوعات (Trips, Deliveries & Payments)', () => {
    let createdTripId: string;

    it('يجب أن ينشئ مشواراً ويحتسب التكلفة تلقائياً وفق قواعد التسعير (75 دقيقة -> 100 ر.س)', async () => {
      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Company-Id', company1Id)
        .send({
          driverId: driver1Id,
          customerName: 'فيصل القحطاني',
          customerPhone: '0511223344',
          deliveryAddress: 'الرياض - حي الملز',
          tripDate: '2026-10-29',
          tripTime: '12:00',
          durationMinutes: 75,
          paidAmount: 50,
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(201);
      expect(Number(res.body.data.cost)).toBe(100);
      createdTripId = res.body.data.id;
    });

    it('يجب أن يسجل تأكيد تسليم الطلب ويوثق التاريخ والوقت الفعليين', async () => {
      const res = await request(app)
        .patch(`/api/v1/deliveries/${createdTripId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Company-Id', company1Id)
        .send({
          status: 'DELIVERED',
          actualDeliveryDate: '2026-10-29',
          actualDeliveryTime: '13:15',
          recipientName: 'فيصل شخصياً',
          deliveryNotes: 'تم التسليم والفحص الكامل',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DELIVERED');
      expect(res.body.data.recipientName).toBe('فيصل شخصياً');
    });

    it('يجب أن يرفض دفعة مالية تتجاوز المبلغ المتبقي المستحق (400)', async () => {
      // تكلفة المشوار 100، دفع منها 50، المتبقي 50. محاولة دفع 70 يجب أن تفشل!
      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Company-Id', company1Id)
        .send({
          tripId: createdTripId,
          amount: 70,
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('يتجاوز المبلغ المتبقي');
    });

    it('يجب أن يسجل الدفعة المتبقية الصحيحة (50 ر.س) بنجاح', async () => {
      const idempotencyKey = `pay-key-test-${Date.now()}-${Math.random()}`;
      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Company-Id', company1Id)
        .send({
          tripId: createdTripId,
          amount: 50,
          paymentMethod: 'BANK_TRANSFER',
          idempotencyKey,
        });

      expect(res.status).toBe(201);

      // إعادة إرسال نفس الطلب بنفس الـ idempotencyKey لا تكرر الخصم
      const replayRes = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Company-Id', company1Id)
        .send({
          tripId: createdTripId,
          amount: 50,
          paymentMethod: 'BANK_TRANSFER',
          idempotencyKey,
        });

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.message).toContain('Idempotent');
    });
  });

  // ==================== 4. اختبارات التقارير ولوحة التحكم ====================
  describe('التقارير ولوحة التحكم (Reports & Dashboard KPIs)', () => {
    it('يجب أن يعيد مؤشرات لوحة التحكم محسوبة من واقع قاعدة البيانات الفعلية', async () => {
      const res = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Company-Id', company1Id);

      expect(res.status).toBe(200);
      expect(res.body.data.overall.totalTrips).toBeGreaterThan(0);
      expect(res.body.data.overall.deliveredCount).toBeGreaterThan(0);
      expect(res.body.data.overall.deliverySuccessRate).not.toBeNull();
      expect(res.body.data.dailyChartData.length).toBeGreaterThan(0);
    });
  });
});
