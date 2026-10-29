/**
 * دوال معالجة وتحليل إحصائيات التقارير ولوحة التحكم
 */

/**
 * حساب نسبة نجاح التسليم بدقة:
 * نسبة التسليم = (عدد الطلبات التي تم تسليمها ÷ عدد الطلبات المؤهلة للتسليم) × 100
 * يتم استبعاد المشاوير الملغاة من المقام.
 * إذا لم تكن هناك مشاوير مؤهلة، تُرجع الدالة null لعدم إظهار 0% أو 100% بشكل مضلل.
 */
export function calculateDeliverySuccessRate(trips = []) {
  const eligibleTrips = trips.filter(t => t.status !== 'cancelled');
  if (eligibleTrips.length === 0) {
    return null;
  }
  const deliveredCount = eligibleTrips.filter(t => t.deliveryStatus === 'delivered').length;
  return (deliveredCount / eligibleTrips.length) * 100;
}

/**
 * حساب الملخص الإحصائي الشامل لمجموعة مشاوير
 */
export function calculateTripSummaryStats(trips = [], includeCancelledInFinance = false) {
  const totalTrips = trips.length;
  
  // المشاوير المؤهلة للعمليات المالية والتشغيلية (استبعاد الملغاة افتراضياً)
  const activeTrips = includeCancelledInFinance 
    ? trips 
    : trips.filter(t => t.status !== 'cancelled');

  let totalCost = 0;
  let totalPaid = 0;
  let totalRemaining = 0;

  activeTrips.forEach(t => {
    const cost = Number(t.cost) || 0;
    const paid = Number(t.paidAmount) || 0;
    totalCost += cost;
    totalPaid += paid;
    totalRemaining += Math.max(0, cost - paid);
  });

  const deliveredCount = trips.filter(t => t.deliveryStatus === 'delivered' && t.status !== 'cancelled').length;
  const pendingCount = trips.filter(t => t.deliveryStatus === 'pending' && t.status !== 'cancelled').length;
  const failedCount = trips.filter(t => t.deliveryStatus === 'failed' && t.status !== 'cancelled').length;
  const returnedCount = trips.filter(t => t.deliveryStatus === 'returned' && t.status !== 'cancelled').length;

  const cancelledCount = trips.filter(t => t.status === 'cancelled').length;
  const inProgressCount = trips.filter(t => t.status === 'in_progress').length;
  const completedCount = trips.filter(t => t.status === 'completed').length;
  const newCount = trips.filter(t => t.status === 'new').length;

  const eligibleForRate = trips.filter(t => t.status !== 'cancelled');
  const deliverySuccessRate = eligibleForRate.length > 0 
    ? (deliveredCount / eligibleForRate.length) * 100 
    : null;

  const avgCost = activeTrips.length > 0 ? (totalCost / activeTrips.length) : 0;

  return {
    totalTrips,
    activeTripsCount: activeTrips.length,
    totalCost,
    totalPaid,
    totalRemaining,
    avgCost,
    deliveredCount,
    pendingCount,
    failedCount,
    returnedCount,
    cancelledCount,
    inProgressCount,
    completedCount,
    newCount,
    deliverySuccessRate,
  };
}

/**
 * تجميع البيانات اليومية للرسوم البيانية (Daily Aggregation)
 */
export function aggregateTripsByDay(trips = []) {
  const map = {};

  trips.forEach(t => {
    const date = t.tripDate;
    if (!map[date]) {
      map[date] = {
        date,
        totalTrips: 0,
        delivered: 0,
        totalCost: 0,
      };
    }
    map[date].totalTrips += 1;
    if (t.deliveryStatus === 'delivered') {
      map[date].delivered += 1;
    }
    if (t.status !== 'cancelled') {
      map[date].totalCost += Number(t.cost) || 0;
    }
  });

  // فرز بالتواريخ تصاعدياً
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * توزيع حالات الاستلام للرسم البياني الدائري (Pie Chart Data)
 */
export function getDeliveryStatusDistribution(trips = []) {
  const counts = {
    delivered: 0,
    pending: 0,
    failed: 0,
    returned: 0,
  };

  trips.forEach(t => {
    if (t.status !== 'cancelled') {
      if (counts[t.deliveryStatus] !== undefined) {
        counts[t.deliveryStatus] += 1;
      }
    }
  });

  return [
    { name: 'تم التسليم', value: counts.delivered, color: '#10b981' },
    { name: 'لم يتم التسليم', value: counts.pending, color: '#f59e0b' },
    { name: 'تعذر التسليم', value: counts.failed, color: '#ef4444' },
    { name: 'تم إرجاع الطلب', value: counts.returned, color: '#64748b' },
  ].filter(item => item.value > 0);
}

/**
 * مقارنة أداء الموصلين
 */
export function aggregateDriverComparison(trips = [], drivers = []) {
  const driverMap = {};

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
        driverName: t.driverName || 'موصل غير معروف',
        driverPhone: '-',
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

    if (t.status === 'cancelled') {
      stat.cancelledCount += 1;
    } else {
      const cost = Number(t.cost) || 0;
      const paid = Number(t.paidAmount) || 0;
      stat.totalCost += cost;
      stat.totalPaid += paid;
      stat.totalRemaining += Math.max(0, cost - paid);

      if (t.deliveryStatus === 'delivered') stat.deliveredCount += 1;
      else if (t.deliveryStatus === 'pending') stat.pendingCount += 1;
      else if (t.deliveryStatus === 'failed') stat.failedCount += 1;
      else if (t.deliveryStatus === 'returned') stat.returnedCount += 1;
    }
  });

  return Object.values(driverMap).map(d => {
    const eligibleCount = d.totalTrips - d.cancelledCount;
    const successRate = eligibleCount > 0 ? (d.deliveredCount / eligibleCount) * 100 : null;
    const avgCost = eligibleCount > 0 ? (d.totalCost / eligibleCount) : 0;

    return {
      ...d,
      eligibleTrips: eligibleCount,
      avgCost,
      successRate,
    };
  });
}
