import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';
import { calculateTripCost } from '../../utils/pricingCalculator.js';
import { createTripSchema, updateTripSchema, queryTripsSchema } from './trips.validator.js';
import { Prisma } from '@prisma/client';

export async function getTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const query = queryTripsSchema.parse(req.query);

    const where: Prisma.TripWhereInput = {
      companyId,
    };

    if (query.search) {
      where.OR = [
        { tripNumber: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { driver: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.driverId) {
      where.driverId = query.driverId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.deliveryStatus) {
      where.delivery = {
        status: query.deliveryStatus,
      };
    }

    if (query.driverSettlementStatus) {
      where.driverSettlementStatus = query.driverSettlementStatus;
    }

    if (query.startDate || query.endDate) {
      where.tripDate = {};
      if (query.startDate) {
        where.tripDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.tripDate.lte = new Date(query.endDate);
      }
    }

    const total = await prisma.trip.count({ where });

    const trips = await prisma.trip.findMany({
      where,
      include: {
        driver: { select: { id: true, name: true, phone: true } },
        delivery: true,
        payments: true,
        settlement: { select: { id: true, settlementNumber: true, settledAt: true } },
      },
      orderBy: { [query.sortField]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const formatted = trips.map(t => {
      const cost = Number(t.cost);
      const totalPaid = t.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const remainingAmount = Math.max(0, cost - totalPaid);

      let paymentStatus = 'UNPAID';
      if (totalPaid >= cost && cost > 0) {
        paymentStatus = 'PAID';
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIAL';
      }

      // تنسيق التاريخ بصيغة YYYY-MM-DD
      const dateStr = t.tripDate.toISOString().slice(0, 10);

      return {
        id: t.id,
        tripNumber: t.tripNumber,
        companyId: t.companyId,
        driverId: t.driverId,
        driverName: t.driver.name,
        driverPhone: t.driver.phone,
        orderNumber: t.orderNumber,
        customerName: t.customerName,
        customerPhone: t.customerPhone,
        deliveryAddress: t.deliveryAddress,
        tripDate: dateStr,
        tripTime: t.tripTime,
        durationMinutes: t.durationMinutes,
        cost,
        status: t.status.toLowerCase(),
        cancelReason: t.cancelReason,
        notes: t.notes,
        adminNotes: t.adminNotes,
        createdAt: t.createdAt,

        // بيانات محاسبة الموصل
        driverSettlementStatus: t.driverSettlementStatus,
        settledAt: t.settledAt ? t.settledAt.toISOString().slice(0, 10) : null,
        settlementAmount: t.settlementAmount ? Number(t.settlementAmount) : null,
        settlementId: t.settlementId,
        settlementNumber: t.settlement?.settlementNumber || null,

        // بيانات التوصيل
        deliveryStatus: t.delivery?.status.toLowerCase() || 'pending',
        actualDeliveryDate: t.delivery?.actualDeliveryDate ? t.delivery.actualDeliveryDate.toISOString().slice(0, 10) : '',
        actualDeliveryTime: t.delivery?.actualDeliveryTime || '',
        recipientName: t.delivery?.recipientName || '',
        pendingReason: t.delivery?.pendingReason || '',
        nextDeliveryDate: t.delivery?.nextDeliveryDate ? t.delivery.nextDeliveryDate.toISOString().slice(0, 10) : '',
        failureReason: t.delivery?.failureReason || '',
        returnDate: t.delivery?.returnDate ? t.delivery.returnDate.toISOString().slice(0, 10) : '',
        returnReason: t.delivery?.returnReason || '',
        deliveryNotes: t.delivery?.deliveryNotes || '',

        // البيانات المالية للطلب
        paidAmount: totalPaid,
        remainingAmount,
        paymentStatus,
        payments: t.payments,
        paymentMethod: t.payments[0]?.paymentMethod?.toLowerCase() || 'cash',
      };
    });

    paginatedResponse(res, formatted, total, query.page, query.limit);
  } catch (err) {
    next(err);
  }
}

export async function getTripById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const { tripId } = req.params;

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
      include: {
        driver: true,
        delivery: true,
        settlement: true,
        payments: {
          include: { recordedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!trip) {
      errorResponse(res, 'المشوار غير موجود في هذه الشركة', 404);
      return;
    }

    const cost = Number(trip.cost);
    const totalPaid = trip.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingAmount = Math.max(0, cost - totalPaid);

    successResponse(res, {
      ...trip,
      cost,
      totalPaid,
      remainingAmount,
      settlementAmount: trip.settlementAmount ? Number(trip.settlementAmount) : null,
      settledAt: trip.settledAt ? trip.settledAt.toISOString().slice(0, 10) : null,
      tripDate: trip.tripDate.toISOString().slice(0, 10),
    });
  } catch (err) {
    next(err);
  }
}

export async function createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const data = createTripSchema.parse(req.body);

    // 1. التحقق من أن السائق ينتمي إلى نفس الشركة ونشط
    const driver = await prisma.driver.findFirst({
      where: {
        id: data.driverId,
        companyId,
        isDeleted: false,
      },
    });

    if (!driver) {
      errorResponse(res, 'السائق المحدد غير موجود في هذه الشركة', 400);
      return;
    }

    // 2. جلب إعدادات تسعير الشركة الفعالة
    const pricingRule = await prisma.pricingRule.findFirst({
      where: { companyId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // 3. احتساب التكلفة آلياً
    const cost = calculateTripCost(data.durationMinutes, pricingRule || undefined);

    // 4. توليد رقم تسلسلي للرحلة
    const tripCount = await prisma.trip.count({ where: { companyId } });
    const tripNumber = `TRP-${tripCount + 1001}`;

    const isSettled = data.driverSettlementStatus === 'SETTLED';

    const newTrip = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          tripNumber,
          companyId,
          driverId: data.driverId,
          orderNumber: data.orderNumber || null,
          customerName: data.customerName,
          customerPhone: data.customerPhone || null,
          deliveryAddress: data.deliveryAddress || null,
          tripDate: new Date(data.tripDate),
          tripTime: data.tripTime,
          durationMinutes: data.durationMinutes,
          cost: new Prisma.Decimal(cost),
          appliedPricingSnapshot: pricingRule ? JSON.parse(JSON.stringify(pricingRule)) : {},
          status: data.status,
          driverSettlementStatus: isSettled ? 'SETTLED' : 'UNSETTLED',
          settledAt: isSettled ? new Date(data.tripDate) : null,
          settlementAmount: isSettled ? new Prisma.Decimal(cost) : null,
          notes: data.notes || null,
          adminNotes: data.adminNotes || null,
          delivery: {
            create: {
              status: data.deliveryStatus,
              actualDeliveryDate: data.deliveryStatus === 'DELIVERED' ? new Date(data.tripDate) : null,
              actualDeliveryTime: data.deliveryStatus === 'DELIVERED' ? data.tripTime : null,
            },
          },
        },
        include: {
          driver: true,
          delivery: true,
        },
      });

      // إذا كان هناك دفعة مالية مبدئية
      if (data.paidAmount && data.paidAmount > 0) {
        await tx.payment.create({
          data: {
            companyId,
            tripId: trip.id,
            amount: new Prisma.Decimal(data.paidAmount),
            paymentMethod: data.paymentMethod,
            recordedById: req.user?.id || null,
            notes: 'دفعة أولية مسجلة عند إنشاء المشوار',
          },
        });
      }

      return trip;
    });

    await recordAuditLog({
      req,
      companyId,
      action: 'CREATE_TRIP',
      entity: 'Trip',
      entityId: newTrip.id,
      details: { tripNumber, cost, customer: data.customerName, driverSettlementStatus: newTrip.driverSettlementStatus },
    });

    successResponse(res, newTrip, 'تم تسجيل المشوار بنجاح', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const { tripId } = req.params;
    const data = updateTripSchema.parse(req.body);

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
    });

    if (!trip) {
      errorResponse(res, 'المشوار غير موجود في هذه الشركة', 404);
      return;
    }

    // إذا تم تعديل مدة المشوار، نعيد احتساب التكلفة وفق قواعد التسعير الحالية
    let newCost = trip.cost;
    if (data.durationMinutes !== undefined && data.durationMinutes !== trip.durationMinutes) {
      const pricingRule = await prisma.pricingRule.findFirst({
        where: { companyId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      newCost = new Prisma.Decimal(calculateTripCost(data.durationMinutes, pricingRule || undefined));
    }

    let settledAtUpdate = undefined;
    let settlementAmountUpdate = undefined;
    let settlementIdUpdate = undefined;

    if (data.driverSettlementStatus !== undefined) {
      if (data.driverSettlementStatus === 'SETTLED' && trip.driverSettlementStatus !== 'SETTLED') {
        settledAtUpdate = new Date();
        settlementAmountUpdate = newCost;
      } else if (data.driverSettlementStatus === 'UNSETTLED' && trip.driverSettlementStatus !== 'UNSETTLED') {
        settledAtUpdate = null;
        settlementAmountUpdate = null;
        settlementIdUpdate = null;
      }
    }

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...data,
        cost: newCost,
        settledAt: settledAtUpdate,
        settlementAmount: settlementAmountUpdate,
        settlementId: settlementIdUpdate,
        tripDate: data.tripDate ? new Date(data.tripDate) : undefined,
      },
      include: {
        driver: true,
        delivery: true,
        payments: true,
      },
    });

    await recordAuditLog({
      req,
      companyId,
      action: 'UPDATE_TRIP',
      entity: 'Trip',
      entityId: tripId,
      details: data,
    });

    successResponse(res, updated, 'تم تعديل بيانات المشوار بنجاح');
  } catch (err) {
    next(err);
  }
}

export async function deleteTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const { tripId } = req.params;

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
    });

    if (!trip) {
      errorResponse(res, 'المشوار غير موجود في هذه الشركة', 404);
      return;
    }

    await prisma.trip.delete({
      where: { id: tripId },
    });

    await recordAuditLog({
      req,
      companyId,
      action: 'DELETE_TRIP',
      entity: 'Trip',
      entityId: tripId,
      details: { tripNumber: trip.tripNumber },
    });

    successResponse(res, null, 'تم حذف المشوار بنجاح');
  } catch (err) {
    next(err);
  }
}
