import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/prisma.js';
import { successResponse } from '../../utils/response.js';
import { Prisma } from '@prisma/client';

export async function getDashboardOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayDate = new Date(todayStr);

    // 1. استعلام مشاوير الشركة بالكامل
    const allTrips = await prisma.trip.findMany({
      where: { companyId },
      include: {
        delivery: true,
        payments: true,
      },
    });

    // 2. مشاوير اليوم
    const todayTrips = allTrips.filter(t => t.tripDate.toISOString().slice(0, 10) === todayStr);

    // حسابات اليوم
    const todayActive = todayTrips.filter(t => t.status !== 'CANCELLED');
    const todayDelivered = todayActive.filter(t => t.delivery?.status === 'DELIVERED').length;
    const todayCost = todayActive.reduce((sum, t) => sum + Number(t.cost), 0);
    const todayPaid = todayActive.reduce((sum, t) => {
      const pSum = t.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + pSum;
    }, 0);
    const todayRemaining = Math.max(0, todayCost - todayPaid);

    // حسابات الإجمالي (الشهر والكل)
    const activeTrips = allTrips.filter(t => t.status !== 'CANCELLED');
    const deliveredCount = activeTrips.filter(t => t.delivery?.status === 'DELIVERED').length;
    const pendingCount = activeTrips.filter(t => t.delivery?.status === 'PENDING').length;
    const failedCount = activeTrips.filter(t => t.delivery?.status === 'FAILED').length;
    const returnedCount = activeTrips.filter(t => t.delivery?.status === 'RETURNED').length;

    const cancelledCount = allTrips.filter(t => t.status === 'CANCELLED').length;
    const inProgressCount = allTrips.filter(t => t.status === 'IN_PROGRESS').length;
    const completedCount = allTrips.filter(t => t.status === 'COMPLETED').length;
    const newCount = allTrips.filter(t => t.status === 'NEW').length;

    const totalCost = activeTrips.reduce((sum, t) => sum + Number(t.cost), 0);
    const totalPaid = activeTrips.reduce((sum, t) => {
      return sum + t.payments.reduce((s, p) => s + Number(p.amount), 0);
    }, 0);
    const totalRemaining = Math.max(0, totalCost - totalPaid);

    const deliverySuccessRate = activeTrips.length > 0 ? (deliveredCount / activeTrips.length) * 100 : null;
    const avgCost = activeTrips.length > 0 ? totalCost / activeTrips.length : 0;

    // الموصلون النشطون
    const activeDriversCount = await prisma.driver.count({
      where: { companyId, isActive: true, isDeleted: false },
    });
    const totalDriversCount = await prisma.driver.count({
      where: { companyId, isDeleted: false },
    });

    // التجميع اليومي لآخر 14 يوماً
    const dailyMap: Record<string, { date: string; totalTrips: number; delivered: number; totalCost: number }> = {};
    allTrips.slice(-20).forEach(t => {
      const d = t.tripDate.toISOString().slice(0, 10);
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, totalTrips: 0, delivered: 0, totalCost: 0 };
      }
      dailyMap[d].totalTrips += 1;
      if (t.delivery?.status === 'DELIVERED') dailyMap[d].delivered += 1;
      if (t.status !== 'CANCELLED') dailyMap[d].totalCost += Number(t.cost);
    });
    const dailyChartData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // توزيع حالات الاستلام للرسم البياني
    const statusPieData = [
      { name: 'تم التسليم', value: deliveredCount, color: '#10b981' },
      { name: 'لم يتم التسليم', value: pendingCount, color: '#f59e0b' },
      { name: 'تعذر التسليم', value: failedCount, color: '#ef4444' },
      { name: 'تم إرجاع الطلب', value: returnedCount, color: '#64748b' },
    ].filter(i => i.value > 0);

    // أحدث المشاوير
    const recentTrips = await prisma.trip.findMany({
      where: { companyId },
      include: {
        driver: { select: { id: true, name: true } },
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const formattedRecent = recentTrips.map(t => ({
      id: t.id,
      tripNumber: t.tripNumber,
      driverName: t.driver.name,
      customerName: t.customerName,
      orderNumber: t.orderNumber,
      tripDate: t.tripDate.toISOString().slice(0, 10),
      tripTime: t.tripTime,
      durationMinutes: t.durationMinutes,
      cost: Number(t.cost),
      status: t.status.toLowerCase(),
      deliveryStatus: t.delivery?.status.toLowerCase() || 'pending',
    }));

    successResponse(res, {
      today: {
        totalTrips: todayTrips.length,
        deliveredCount: todayDelivered,
        totalCost: todayCost,
        totalRemaining: todayRemaining,
      },
      overall: {
        totalTrips: allTrips.length,
        deliveredCount,
        pendingCount,
        failedCount,
        returnedCount,
        cancelledCount,
        inProgressCount,
        completedCount,
        newCount,
        totalCost,
        totalPaid,
        totalRemaining,
        avgCost,
        deliverySuccessRate,
      },
      drivers: {
        activeCount: activeDriversCount,
        totalCount: totalDriversCount,
      },
      dailyChartData,
      statusPieData,
      recentTrips: formattedRecent,
    });
  } catch (err) {
    next(err);
  }
}

export async function getReportData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.currentCompanyId!;
    const { startDate, endDate, driverId, tripStatus, deliveryStatus, includeCancelled } = req.query;

    const where: Prisma.TripWhereInput = {
      companyId,
    };

    if (driverId && typeof driverId === 'string') {
      where.driverId = driverId;
    }

    if (tripStatus && typeof tripStatus === 'string') {
      where.status = tripStatus.toUpperCase() as any;
    }

    if (deliveryStatus && typeof deliveryStatus === 'string') {
      where.delivery = {
        status: deliveryStatus.toUpperCase() as any,
      };
    }

    if (startDate || endDate) {
      where.tripDate = {};
      if (startDate && typeof startDate === 'string') {
        where.tripDate.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        where.tripDate.lte = new Date(endDate);
      }
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        driver: true,
        delivery: true,
        payments: true,
      },
      orderBy: { tripDate: 'desc' },
    });

    const drivers = await prisma.driver.findMany({
      where: { companyId, isDeleted: false },
    });

    // 1. حساب الإحصائيات
    const shouldIncludeCancelled = includeCancelled === 'true';
    const activeTrips = shouldIncludeCancelled ? trips : trips.filter(t => t.status !== 'CANCELLED');

    let totalCost = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    activeTrips.forEach(t => {
      const cost = Number(t.cost);
      const paid = t.payments.reduce((s, p) => s + Number(p.amount), 0);
      totalCost += cost;
      totalPaid += paid;
      totalRemaining += Math.max(0, cost - paid);
    });

    const deliveredCount = trips.filter(t => t.delivery?.status === 'DELIVERED' && t.status !== 'CANCELLED').length;
    const pendingCount = trips.filter(t => t.delivery?.status === 'PENDING' && t.status !== 'CANCELLED').length;
    const failedCount = trips.filter(t => t.delivery?.status === 'FAILED' && t.status !== 'CANCELLED').length;
    const returnedCount = trips.filter(t => t.delivery?.status === 'RETURNED' && t.status !== 'CANCELLED').length;
    const cancelledCount = trips.filter(t => t.status === 'CANCELLED').length;

    const eligibleForRate = trips.filter(t => t.status !== 'CANCELLED');
    const deliverySuccessRate = eligibleForRate.length > 0 ? (deliveredCount / eligibleForRate.length) * 100 : null;
    const avgCost = activeTrips.length > 0 ? totalCost / activeTrips.length : 0;

    // 2. مقارنة أداء الموصلين
    const driverMap: Record<string, any> = {};
    drivers.forEach(d => {
      driverMap[d.id] = {
        driverId: d.id,
        driverName: d.name,
        driverPhone: d.phone,
        totalTrips: 0,
        deliveredCount: 0,
        pendingCount: 0,
        failedCount: 0,
        returnedCount: 0,
        cancelledCount: 0,
        totalCost: 0,
        totalPaid: 0,
        totalRemaining: 0,
      };
    });

    trips.forEach(t => {
      let stat = driverMap[t.driverId];
      if (!stat) {
        stat = {
          driverId: t.driverId,
          driverName: t.driver.name,
          driverPhone: t.driver.phone,
          totalTrips: 0,
          deliveredCount: 0,
          pendingCount: 0,
          failedCount: 0,
          returnedCount: 0,
          cancelledCount: 0,
          totalCost: 0,
          totalPaid: 0,
          totalRemaining: 0,
        };
        driverMap[t.driverId] = stat;
      }

      stat.totalTrips += 1;
      if (t.status === 'CANCELLED') {
        stat.cancelledCount += 1;
      } else {
        const cost = Number(t.cost);
        const paid = t.payments.reduce((s, p) => s + Number(p.amount), 0);
        stat.totalCost += cost;
        stat.totalPaid += paid;
        stat.totalRemaining += Math.max(0, cost - paid);

        if (t.delivery?.status === 'DELIVERED') stat.deliveredCount += 1;
        else if (t.delivery?.status === 'PENDING') stat.pendingCount += 1;
        else if (t.delivery?.status === 'FAILED') stat.failedCount += 1;
        else if (t.delivery?.status === 'RETURNED') stat.returnedCount += 1;
      }
    });

    const driverComparison = Object.values(driverMap).map((d: any) => {
      const eligible = d.totalTrips - d.cancelledCount;
      const rate = eligible > 0 ? (d.deliveredCount / eligible) * 100 : null;
      const aCost = eligible > 0 ? d.totalCost / eligible : 0;
      return {
        ...d,
        eligibleTrips: eligible,
        avgCost: aCost,
        successRate: rate,
      };
    });

    // 3. التجميع اليومي
    const dailyMap: Record<string, { date: string; totalTrips: number; delivered: number; totalCost: number }> = {};
    trips.forEach(t => {
      const d = t.tripDate.toISOString().slice(0, 10);
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, totalTrips: 0, delivered: 0, totalCost: 0 };
      }
      dailyMap[d].totalTrips += 1;
      if (t.delivery?.status === 'DELIVERED') dailyMap[d].delivered += 1;
      if (t.status !== 'CANCELLED') dailyMap[d].totalCost += Number(t.cost);
    });
    const dailyChartData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // 4. تنسيق قائمة الرحلات للعرض والتصدير
    const formattedTrips = trips.map(t => {
      const cost = Number(t.cost);
      const paid = t.payments.reduce((s, p) => s + Number(p.amount), 0);
      return {
        id: t.id,
        tripNumber: t.tripNumber,
        driverId: t.driverId,
        driverName: t.driver.name,
        driverPhone: t.driver.phone,
        customerName: t.customerName,
        customerPhone: t.customerPhone,
        orderNumber: t.orderNumber,
        deliveryAddress: t.deliveryAddress,
        tripDate: t.tripDate.toISOString().slice(0, 10),
        tripTime: t.tripTime,
        durationMinutes: t.durationMinutes,
        cost,
        paidAmount: paid,
        remainingAmount: Math.max(0, cost - paid),
        status: t.status.toLowerCase(),
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
        paymentMethod: t.payments[0]?.paymentMethod?.toLowerCase() || 'cash',
      };
    });

    successResponse(res, {
      stats: {
        totalTrips: trips.length,
        deliveredCount,
        pendingCount,
        failedCount,
        returnedCount,
        cancelledCount,
        totalCost,
        totalPaid,
        totalRemaining,
        avgCost,
        deliverySuccessRate,
      },
      driverComparison,
      dailyChartData,
      trips: formattedTrips,
    });
  } catch (err) {
    next(err);
  }
}
