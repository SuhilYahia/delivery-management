import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

describe('اختبارات ميزة محاسبة الموصلين وكشف الحسابات (Driver Settlements Tests)', () => {
  let adminToken: string;
  let companyId: string;
  let driverId: string;
  let trip1Id: string;
  let trip2Id: string;

  beforeAll(async () => {
    // 1. تسجيل الدخول
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@almajd.sa', password: 'Admin@123456' });

    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.token;

    // 2. جلب الشركة والموصل
    const company = await prisma.company.findFirst();
    expect(company).toBeDefined();
    companyId = company!.id;

    let driver = await prisma.driver.findFirst({
      where: { companyId, isDeleted: false },
    });
    if (!driver) {
      driver = await prisma.driver.create({
        data: {
          companyId,
          name: 'موصل تجريبي للاختبار',
          phone: '0919998877',
          vehicleType: 'SEDAN',
          licenseNumber: '12-34567',
        },
      });
    }
    driverId = driver.id;
  });

  it('1. يجب إضافة مشوار جديد بحالة محاسبة «غير محاسب» كقيمة افتراضية', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Company-Id', companyId)
      .send({
        driverId,
        customerName: 'عميل اختبار المحاسبة 1',
        tripDate: '2026-10-30',
        tripTime: '10:00',
        durationMinutes: 45,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.driverSettlementStatus).toBe('UNSETTLED');
    expect(res.body.data.settledAt).toBeNull();
    trip1Id = res.body.data.id;
  });

  it('2. يجب إضافة مشوار مع تحديد حالة المحاسبة «محاسب» مسبقاً وتسجيل تاريخها والمبلغ', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Company-Id', companyId)
      .send({
        driverId,
        customerName: 'عميل اختبار المحاسبة 2',
        tripDate: '2026-10-30',
        tripTime: '11:00',
        durationMinutes: 60,
        driverSettlementStatus: 'SETTLED',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.driverSettlementStatus).toBe('SETTLED');
    expect(res.body.data.settledAt).not.toBeNull();
    expect(Number(res.body.data.settlementAmount)).toBeGreaterThan(0);
  });

  it('3. إنشاء مشوار إضافي غير محاسب لغرض تجربة التسوية الجماعية', async () => {
    const res = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Company-Id', companyId)
      .send({
        driverId,
        customerName: 'عميل اختبار المحاسبة 3',
        tripDate: '2026-10-30',
        tripTime: '12:00',
        durationMinutes: 30,
        driverSettlementStatus: 'UNSETTLED',
      });

    expect(res.status).toBe(201);
    trip2Id = res.body.data.id;
  });

  it('4. جلب كشف حساب الموصل المالي والتأكد من صحة الإجماليات والمستحقات', async () => {
    const res = await request(app)
      .get(`/api/v1/settlements/driver/${driverId}/statement`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Company-Id', companyId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.driver.id).toBe(driverId);
    expect(res.body.data.summary.totalTrips).toBeGreaterThanOrEqual(3);
    expect(res.body.data.summary.totalUnsettledDues).toBeGreaterThan(0);
    expect(res.body.data.summary.unsettledTripsCount).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.data.trips)).toBe(true);
  });

  it('5. تسجيل تسوية جماعية لمشوارين غير محاسبين دفعة واحدة', async () => {
    const res = await request(app)
      .post('/api/v1/settlements')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Company-Id', companyId)
      .send({
        driverId,
        tripIds: [trip1Id, trip2Id],
        paymentMethod: 'CASH',
        notes: 'تسوية نقدية للمشاوير في نهاية الدوام',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tripCount).toBe(2);
    expect(res.body.data.totalAmount).toBeGreaterThan(0);
    expect(res.body.data.settlementNumber).toMatch(/^STL-/);
  });

  it('6. منع محاسبة المشوار نفسه مرتين (Double Settlement Prevention)', async () => {
    const res = await request(app)
      .post('/api/v1/settlements')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Company-Id', companyId)
      .send({
        driverId,
        tripIds: [trip1Id], // المشوار تمت تسويته في الخطوة السابقة
        paymentMethod: 'CASH',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('تمت محاسبتها مسبقاً');
  });

  it('7. التحقق من كشف حساب الموصل بعد التسوية الجماعية', async () => {
    const res = await request(app)
      .get(`/api/v1/settlements/driver/${driverId}/statement`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Company-Id', companyId);

    expect(res.status).toBe(200);
    // المشاوير trip1Id و trip2Id أصبحا محاسبين
    const trip1 = res.body.data.trips.find((t: any) => t.id === trip1Id);
    expect(trip1.driverSettlementStatus).toBe('SETTLED');
    expect(trip1.settlementNumber).toMatch(/^STL-/);
  });

  it('8. جلب سجل التسويات السابقة والتأكد من إدراج التسوية والمشاوير المشمولة', async () => {
    const res = await request(app)
      .get(`/api/v1/settlements/history?driverId=${driverId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Company-Id', companyId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].trips.length).toBe(2);
  });

  it('9. التحقق من تقرير مستحقات الموصلين الشامل', async () => {
    const res = await request(app)
      .get(`/api/v1/settlements/dues-report`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Company-Id', companyId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.totalDrivers).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.drivers)).toBe(true);

    const driverRow = res.body.data.drivers.find((d: any) => d.driverId === driverId);
    expect(driverRow).toBeDefined();
    expect(driverRow.settledCount).toBeGreaterThanOrEqual(2);
  });
});
