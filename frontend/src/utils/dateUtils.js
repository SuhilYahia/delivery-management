/**
 * أدوات التعامل مع التواريخ والأوقات بتوقيت السعودية Asia/Riyadh
 */

/**
 * الحصول على تاريخ اليوم بصيغة YYYY-MM-DD
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * الحصول على الوقت الحالي بصيغة HH:mm
 */
export function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * تنسيق التاريخ إلى مظهر عربي واضح
 * مثال: "29 أكتوبر 2026"
 */
export function formatArabicDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, monthIndex, day);
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * تنسيق الوقت إلى مظهر عربي مع ص / م
 * مثال: "04:30 م"
 */
export function formatArabicTime(timeStr) {
  if (!timeStr) return '-';
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const period = h >= 12 ? 'م' : 'ص';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayHour).padStart(2, '0')}:${minutes} ${period}`;
  } catch {
    return timeStr;
  }
}

/**
 * فحص ما إذا كان التاريخ يقع ضمن النطاق المحدد (شاملاً اليوم الأول والأخير بالكامل)
 */
export function isDateInRange(dateStr, startDateStr, endDateStr) {
  if (!dateStr) return false;
  
  // إذا لم يتم تحديد تاريخ بداية ونهاية، يُعتبر التاريخ مطابقاً
  if (!startDateStr && !endDateStr) return true;

  // مقارنة التاريخ بصيغة YYYY-MM-DD
  const tripDate = dateStr.slice(0, 10);
  
  if (startDateStr && tripDate < startDateStr.slice(0, 10)) {
    return false;
  }
  if (endDateStr && tripDate > endDateStr.slice(0, 10)) {
    return false;
  }

  return true;
}

/**
 * الحصول على نطاق التواريخ حسب نوع الفلتر
 */
export function getDateRangePreset(presetType) {
  const today = new Date();
  const todayStr = getTodayDateString();

  switch (presetType) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr };

    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
      return { startDate: yStr, endDate: yStr };
    }

    case 'last7days': {
      const past = new Date(today);
      past.setDate(past.getDate() - 6);
      const pastStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
      return { startDate: pastStr, endDate: todayStr };
    }

    case 'last30days': {
      const past = new Date(today);
      past.setDate(past.getDate() - 29);
      const pastStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
      return { startDate: pastStr, endDate: todayStr };
    }

    case 'thisMonth': {
      const startOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      return { startDate: startOfMonth, endDate: todayStr };
    }

    case 'lastMonth': {
      const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      const sStr = `${firstOfLastMonth.getFullYear()}-${String(firstOfLastMonth.getMonth() + 1).padStart(2, '0')}-01`;
      const eStr = `${lastOfLastMonth.getFullYear()}-${String(lastOfLastMonth.getMonth() + 1).padStart(2, '0')}-${String(lastOfLastMonth.getDate()).padStart(2, '0')}`;
      return { startDate: sStr, endDate: eStr };
    }

    default:
      return { startDate: '', endDate: '' };
  }
}
