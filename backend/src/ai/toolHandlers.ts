import prisma from '../config/prisma.js';
import {
  tripSummaryToolSchema,
  driverPerformanceToolSchema,
  deliveryStatusToolSchema,
  financialSummaryToolSchema,
  undeliveredTripsToolSchema,
} from './tools.js';
import { Prisma } from '@prisma/client';

export async function executeAiTool(
  toolName: string,
  rawArgs: string,
  companyId: string
): Promise<any> {
  const parsedArgs = rawArgs ? JSON.parse(rawArgs) : {};

  switch (toolName) {
    case 'get_trip_summary': {
      const args = tripSummaryToolSchema.parse(parsedArgs);
      const where: Prisma.TripWhereInput = { companyId };
      if (args.startDate || args.endDate) {
        where.tripDate = {};
        if (args.startDate) where.tripDate.gte = new Date(args.startDate);
        if (args.endDate) where.tripDate.lte = new Date(args.endDate);
      }

      const trips = await prisma.trip.findMany({
        where,
        include: { delivery: true },
      });

      const total = trips.length;
      const completed = trips.filter(t => t.status === 'COMPLETED').length;
      const inProgress = trips.filter(t => t.status === 'IN_PROGRESS').length;
      const cancelled = trips.filter(t => t.status === 'CANCELLED').length;
      const active = trips.filter(t => t.status !== 'CANCELLED');
      const delivered = active.filter(t => t.delivery?.status === 'DELIVERED').length;
      const rate = active.length > 0 ? (delivered / active.length) * 100 : null;

      return {
        totalTrips: total,
        completedTrips: completed,
        inProgressTrips: inProgress,
        cancelledTrips: cancelled,
        deliveredOrders: delivered,
        deliverySuccessRate: rate !== null ? `${rate.toFixed(1)}%` : 'لا توجد بيانات كافية',
      };
    }

    case 'get_driver_performance': {
      const args = driverPerformanceToolSchema.parse(parsedArgs);
      const where: Prisma.TripWhereInput = { companyId };
      if (args.driverId) where.driverId = args.driverId;
      if (args.startDate || args.endDate) {
        where.tripDate = {};
        if (args.startDate) where.tripDate.gte = new Date(args.startDate);
        if (args.endDate) where.tripDate.lte = new Date(args.endDate);
      }

      const trips = await prisma.trip.findMany({
        where,
        include: { driver: true, delivery: true },
      });

      const driverMap: Record<string, any> = {};
      trips.forEach(t => {
        if (!driverMap[t.driverId]) {
          driverMap[t.driverId] = {
            name: t.driver.name,
            totalTrips: 0,
            delivered: 0,
            cost: 0,
            cancelled: 0,
          };
        }
        driverMap[t.driverId].totalTrips += 1;
        if (t.status === 'CANCELLED') {
          driverMap[t.driverId].cancelled += 1;
        } else {
          driverMap[t.driverId].cost += Number(t.cost);
          if (t.delivery?.status === 'DELIVERED') driverMap[t.driverId].delivered += 1;
        }
      });

      return Object.values(driverMap).map((d: any) => {
        const eligible = d.totalTrips - d.cancelled;
        const rate = eligible > 0 ? (d.delivered / eligible) * 100 : null;
        return {
          driverName: d.name,
          totalTrips: d.totalTrips,
          deliveredOrders: d.delivered,
          totalCost: `${d.cost} ر.س`,
          successRate: rate !== null ? `${rate.toFixed(1)}%` : 'غير متاح',
        };
      });
    }

    case 'get_delivery_status_report': {
      const args = deliveryStatusToolSchema.parse(parsedArgs);
      const where: Prisma.TripWhereInput = {
        companyId,
        status: { not: 'CANCELLED' },
      };
      if (args.status) {
        where.delivery = { status: args.status };
      }
      if (args.startDate || args.endDate) {
        where.tripDate = {};
        if (args.startDate) where.tripDate.gte = new Date(args.startDate);
        if (args.endDate) where.tripDate.lte = new Date(args.endDate);
      }

      const trips = await prisma.trip.findMany({
        where,
        include: { delivery: true },
      });

      const counts = {
        delivered: trips.filter(t => t.delivery?.status === 'DELIVERED').length,
        pending: trips.filter(t => t.delivery?.status === 'PENDING').length,
        failed: trips.filter(t => t.delivery?.status === 'FAILED').length,
        returned: trips.filter(t => t.delivery?.status === 'RETURNED').length,
      };

      return {
        totalEvaluated: trips.length,
        counts,
        percentageDelivered: trips.length > 0 ? `${((counts.delivered / trips.length) * 100).toFixed(1)}%` : 'غير متاح',
      };
    }

    case 'get_financial_summary': {
      const args = financialSummaryToolSchema.parse(parsedArgs);
      const where: Prisma.TripWhereInput = { companyId };
      if (!args.includeCancelled) {
        where.status = { not: 'CANCELLED' };
      }
      if (args.startDate || args.endDate) {
        where.tripDate = {};
        if (args.startDate) where.tripDate.gte = new Date(args.startDate);
        if (args.endDate) where.tripDate.lte = new Date(args.endDate);
      }

      const trips = await prisma.trip.findMany({
        where,
        include: { payments: true },
      });

      let totalCost = 0;
      let totalPaid = 0;
      trips.forEach(t => {
        const c = Number(t.cost);
        const p = t.payments.reduce((s, pay) => s + Number(pay.amount), 0);
        totalCost += c;
        totalPaid += p;
      });

      return {
        tripsCount: trips.length,
        totalCost: `${totalCost} ر.س`,
        totalPaid: `${totalPaid} ر.س`,
        totalRemaining: `${Math.max(0, totalCost - totalPaid)} ر.س`,
        scope: args.includeCancelled ? 'شاملاً المشاوير الملغاة' : 'مستبعداً المشاوير الملغاة',
      };
    }

    case 'list_undelivered_trips': {
      const args = undeliveredTripsToolSchema.parse(parsedArgs);

      const trips = await prisma.trip.findMany({
        where: {
          companyId,
          status: { not: 'CANCELLED' },
          delivery: {
            status: { in: ['PENDING', 'FAILED', 'RETURNED'] },
          },
        },
        include: {
          driver: { select: { name: true } },
          delivery: true,
        },
        orderBy: { tripDate: 'desc' },
        take: args.limit,
      });

      return trips.map(t => ({
        tripNumber: t.tripNumber,
        customerName: t.customerName,
        driverName: t.driver.name,
        tripDate: t.tripDate.toISOString().slice(0, 10),
        status: t.delivery?.status,
        reason: t.delivery?.pendingReason || t.delivery?.failureReason || t.delivery?.returnReason || 'غير محدد',
        nextDeliveryDate: t.delivery?.nextDeliveryDate ? t.delivery.nextDeliveryDate.toISOString().slice(0, 10) : 'غير مجدول',
      }));
    }

    default:
      throw new Error(`أداة غير معروفة: ${toolName}`);
  }
}
