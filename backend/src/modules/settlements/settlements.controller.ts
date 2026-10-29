import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { recordAuditLog } from '../../utils/audit.js';
import { Prisma } from '@prisma/client';
import {
  createSettlementSchema,
  statementQuerySchema,
  duesReportQuerySchema,
} from './settlements.validator.js';

/**
 * تسوية دفعة من المشاوير لموصل مع منع المحاسبة المزدوجة
 */
export async function settleDriverTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const data = createSettlementSchema.parse(req.body);

    // 1. التحقق من وجود الموصل وانتمائه للشركة
    const driver = await prisma.driver.findFirst({
      where: { id: data.driverId, companyId, isDeleted: false },
    });

    if (!driver) {
      errorResponse(res, 'الموصل المحدد غير موجود في هذه الشركة أو تم حذفه', 404);
      return;
    }

    // 2. جلب المشاوير المحددة والتأكد من انتمائها للموصل والشركة
    const trips = await prisma.trip.findMany({
      where: {
        id: { in: data.tripIds },
        companyId,
        driverId: data.driverId,
      },
    });

    if (trips.length !== data.tripIds.length) {
      errorResponse(res, 'بعض المشاوير المحددة غير موجودة أو لا تخص هذا الموصل', 400);
      return;
    }

    // 3. منع محاسبة المشوار نفسه مرتين (Double Settlement Prevention)
    const alreadySettled = trips.filter((t) => t.driverSettlementStatus === 'SETTLED');
    if (alreadySettled.length > 0) {
      const settledNumbers = alreadySettled.map((t) => t.tripNumber).join('، ');
      errorResponse(
        res,
        `المشاوير التالية تمت محاسبتها مسبقاً ولا يمكن محاسبة المشوار نفسه مرتين: (${settledNumbers})`,
        400
      );
      return;
    }

    // 4. احتساب إجمالي مبلغ التسوية من تكاليف المشاوير
    const totalAmount = trips.reduce(
      (sum, t) => sum.add(t.cost),
      new Prisma.Decimal(0)
    );

    // 5. توليد رقم تسلسلي للتسوية
    const settlementCount = await prisma.driverSettlement.count({ where: { companyId } });
    const settlementNumber = `STL-${settlementCount + 1001}`;
    const settlementDate = data.settledAt ? new Date(data.settledAt) : new Date();

    // 6. تنفيذ التسوية وتحديث المشاوير في معاملة ذرية متكاملة
    const settlement = await prisma.$transaction(async (tx) => {
      const stl = await tx.driverSettlement.create({
        data: {
          settlementNumber,
          companyId,
          driverId: data.driverId,
          totalAmount,
          tripCount: trips.length,
          settledAt: settlementDate,
          paymentMethod: data.paymentMethod,
          reference: data.reference || null,
          notes: data.notes || null,
          createdById: req.user?.id || null,
        },
      });

      for (const t of trips) {
        await tx.trip.update({
          where: { id: t.id },
          data: {
            driverSettlementStatus: 'SETTLED',
            settledAt: settlementDate,
            settlementAmount: t.cost,
            settlementId: stl.id,
          },
        });
      }

      return stl;
    });

    // 7. تسجيل في سجل التدقيق Audit Log
    await recordAuditLog({
      req,
      companyId,
      action: 'SETTLE_DRIVER_TRIPS',
      entity: 'DriverSettlement',
      entityId: settlement.id,
      details: {
        settlementNumber,
        driverId: data.driverId,
        driverName: driver.name,
        tripCount: trips.length,
        totalAmount: Number(totalAmount),
        tripIds: data.tripIds,
      },
    });

    successResponse(
      res,
      {
        ...settlement,
        totalAmount: Number(settlement.totalAmount),
        settledAt: settlement.settledAt.toISOString().slice(0, 10),
        driver: { id: driver.id, name: driver.name, phone: driver.phone },
      },
      `تمت محاسبة الموصل وتسجيل التسوية بنجاح بمبلغ ${Number(totalAmount).toFixed(2)} د.ل`,
      201
    );
  } catch (err) {
    next(err);
  }
}

/**
 * كشف حساب الموصل المالي مع الفلترة الزمنية والإحصائيات
 */
export async function getDriverStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const { driverId } = req.params;
    const query = statementQuerySchema.parse(req.query);

    // 1. التحقق من الموصل
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, companyId, isDeleted: false },
    });

    if (!driver) {
      errorResponse(res, 'الموصل غير موجود في هذه الشركة', 404);
      return;
    }

    // 2. بناء معايير الفلترة الزمنية للمشاوير
    const baseDateWhere: Prisma.TripWhereInput = {
      companyId,
      driverId,
    };

    if (query.startDate || query.endDate) {
      baseDateWhere.tripDate = {};
      if (query.startDate) baseDateWhere.tripDate.gte = new Date(query.startDate);
      if (query.endDate) baseDateWhere.tripDate.lte = new Date(query.endDate);
    }

    // جلب جميع مشاوير الموصل في الفترة لحساب إجماليات الكشف بدقة
    const periodTrips = await prisma.trip.findMany({
      where: baseDateWhere,
      include: {
        delivery: true,
        settlement: { select: { id: true, settlementNumber: true, settledAt: true, paymentMethod: true } },
      },
      orderBy: [{ tripDate: 'desc' }, { tripTime: 'desc' }, { createdAt: 'desc' }],
    });

    // الإحصائيات المالية الشاملة للفترة
    let totalTripsCost = 0;
    let totalSettledAmount = 0;
    let totalUnsettledDues = 0;
    let settledTripsCount = 0;
    let unsettledTripsCount = 0;

    periodTrips.forEach((t) => {
      const cost = Number(t.cost);
      totalTripsCost += cost;

      if (t.driverSettlementStatus === 'SETTLED') {
        settledTripsCount += 1;
        totalSettledAmount += t.settlementAmount ? Number(t.settlementAmount) : cost;
      } else {
        unsettledTripsCount += 1;
        totalUnsettledDues += cost;
      }
    });

    // فلترة القائمة المعروضة حسب حالة المحاسبة إن طلبت
    let displayTrips = periodTrips;
    if (query.status === 'UNSETTLED') {
      displayTrips = periodTrips.filter((t) => t.driverSettlementStatus === 'UNSETTLED');
    } else if (query.status === 'SETTLED') {
      displayTrips = periodTrips.filter((t) => t.driverSettlementStatus === 'SETTLED');
    }

    const formattedTrips = displayTrips.map((t) => ({
      id: t.id,
      tripNumber: t.tripNumber,
      orderNumber: t.orderNumber || '-',
      customerName: t.customerName,
      customerPhone: t.customerPhone || '',
      deliveryAddress: t.deliveryAddress || '',
      tripDate: t.tripDate.toISOString().slice(0, 10),
      tripTime: t.tripTime,
      durationMinutes: t.durationMinutes,
      cost: Number(t.cost),
      status: t.status.toLowerCase(),
      deliveryStatus: t.delivery?.status.toLowerCase() || 'pending',
      driverSettlementStatus: t.driverSettlementStatus,
      settledAt: t.settledAt ? t.settledAt.toISOString().slice(0, 10) : null,
      settlementAmount: t.settlementAmount ? Number(t.settlementAmount) : null,
      settlementNumber: t.settlement?.settlementNumber || null,
      settlementPaymentMethod: t.settlement?.paymentMethod || null,
    }));

    successResponse(res, {
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
      },
      summary: {
        totalTrips: periodTrips.length,
        totalTripsCost,
        totalSettledAmount,
        totalUnsettledDues,
        settledTripsCount,
        unsettledTripsCount,
      },
      filter: {
        startDate: query.startDate || null,
        endDate: query.endDate || null,
        status: query.status,
      },
      trips: formattedTrips,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * سجل التسويات السابقة
 */
export async function getSettlementHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const { driverId } = req.query;

    const where: Prisma.DriverSettlementWhereInput = {
      companyId,
    };

    if (driverId && typeof driverId === 'string') {
      where.driverId = driverId;
    }

    const settlements = await prisma.driverSettlement.findMany({
      where,
      include: {
        driver: { select: { id: true, name: true, phone: true } },
        createdBy: { select: { id: true, name: true } },
        trips: {
          select: {
            id: true,
            tripNumber: true,
            orderNumber: true,
            customerName: true,
            tripDate: true,
            cost: true,
          },
        },
      },
      orderBy: { settledAt: 'desc' },
      take: 100,
    });

    const formatted = settlements.map((s) => ({
      id: s.id,
      settlementNumber: s.settlementNumber,
      driverId: s.driverId,
      driverName: s.driver.name,
      driverPhone: s.driver.phone,
      totalAmount: Number(s.totalAmount),
      tripCount: s.tripCount,
      settledAt: s.settledAt.toISOString().slice(0, 10),
      paymentMethod: s.paymentMethod,
      reference: s.reference,
      notes: s.notes,
      createdByName: s.createdBy?.name || 'النظام',
      trips: s.trips.map((t) => ({
        id: t.id,
        tripNumber: t.tripNumber,
        orderNumber: t.orderNumber || '-',
        customerName: t.customerName,
        tripDate: t.tripDate.toISOString().slice(0, 10),
        cost: Number(t.cost),
      })),
    }));

    successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
}

/**
 * تقرير مستحقات الموصلين الشامل مع الفلترة حسب الموصل والفترة الزمنية
 */
export async function getDriverDuesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const query = duesReportQuerySchema.parse(req.query);

    // 1. جلب الموصلين المحددين أو جميع الموصلين الفعالين في الشركة
    const driverWhere: Prisma.DriverWhereInput = {
      companyId,
      isDeleted: false,
    };
    if (query.driverId) {
      driverWhere.id = query.driverId;
    }

    const drivers = await prisma.driver.findMany({
      where: driverWhere,
      orderBy: { name: 'asc' },
    });

    // 2. بناء فلترة تاريخ المشاوير
    const tripWhere: Prisma.TripWhereInput = {
      companyId,
      driverId: { in: drivers.map((d) => d.id) },
    };

    if (query.startDate || query.endDate) {
      tripWhere.tripDate = {};
      if (query.startDate) tripWhere.tripDate.gte = new Date(query.startDate);
      if (query.endDate) tripWhere.tripDate.lte = new Date(query.endDate);
    }

    const allTrips = await prisma.trip.findMany({
      where: tripWhere,
      select: {
        id: true,
        driverId: true,
        cost: true,
        driverSettlementStatus: true,
        settlementAmount: true,
        status: true,
      },
    });

    // تجميع الحسابات لكل موصل
    const driverStatsMap: Record<
      string,
      {
        totalTrips: number;
        totalCost: number;
        settledAmount: number;
        unsettledAmount: number;
        settledCount: number;
        unsettledCount: number;
      }
    > = {};

    drivers.forEach((d) => {
      driverStatsMap[d.id] = {
        totalTrips: 0,
        totalCost: 0,
        settledAmount: 0,
        unsettledAmount: 0,
        settledCount: 0,
        unsettledCount: 0,
      };
    });

    allTrips.forEach((t) => {
      const stats = driverStatsMap[t.driverId];
      if (!stats) return;

      const cost = Number(t.cost);
      stats.totalTrips += 1;
      stats.totalCost += cost;

      if (t.driverSettlementStatus === 'SETTLED') {
        stats.settledCount += 1;
        stats.settledAmount += t.settlementAmount ? Number(t.settlementAmount) : cost;
      } else {
        stats.unsettledCount += 1;
        stats.unsettledAmount += cost;
      }
    });

    // الإجماليات العامة لكافة الموصلين
    let overallTrips = 0;
    let overallCost = 0;
    let overallSettled = 0;
    let overallRemaining = 0;
    let overallUnsettledCount = 0;

    const driversReport = drivers.map((d) => {
      const stats = driverStatsMap[d.id];
      overallTrips += stats.totalTrips;
      overallCost += stats.totalCost;
      overallSettled += stats.settledAmount;
      overallRemaining += stats.unsettledAmount;
      overallUnsettledCount += stats.unsettledCount;

      return {
        driverId: d.id,
        driverName: d.name,
        phone: d.phone,
        vehicleType: d.vehicleType,
        licenseNumber: d.licenseNumber,
        status: d.status,
        totalTrips: stats.totalTrips,
        totalCost: stats.totalCost,
        settledAmount: stats.settledAmount,
        unsettledAmount: stats.unsettledAmount,
        settledCount: stats.settledCount,
        unsettledCount: stats.unsettledCount,
        settlementPercentage:
          stats.totalCost > 0 ? Math.round((stats.settledAmount / stats.totalCost) * 100) : 100,
      };
    });

    successResponse(res, {
      summary: {
        totalDrivers: drivers.length,
        overallTrips,
        overallCost,
        overallSettled,
        overallRemaining,
        overallUnsettledCount,
      },
      filter: {
        driverId: query.driverId || null,
        startDate: query.startDate || null,
        endDate: query.endDate || null,
      },
      drivers: driversReport,
    });
  } catch (err) {
    next(err);
  }
}
