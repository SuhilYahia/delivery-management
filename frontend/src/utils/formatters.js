/**
 * منسقات العرض للنصوص والأرقام والعملات والبادجات
 */

/**
 * تنسيق العملة بالريال السعودي
 */
export function formatCurrency(amount, currency = 'ر.س') {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `0 ${currency}`;
  }
  const num = Number(amount);
  return `${num.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

/**
 * تنسيق المدة الزمنية بالدقائق
 */
export function formatDuration(minutes) {
  const m = parseInt(minutes, 10);
  if (isNaN(m) || m <= 0) return '0 دقيقة';

  if (m < 60) {
    return `${m} دقيقة`;
  }

  const hours = Math.floor(m / 60);
  const remainingMins = m % 60;

  if (remainingMins === 0) {
    return `${hours} ساعة`;
  }
  return `${hours} ساعة و ${remainingMins} دقيقة`;
}

/**
 * تنسيق النسبة المئوية
 */
export function formatPercentage(val) {
  if (val === null || val === undefined || isNaN(val)) {
    return '-';
  }
  return `${Number(val).toFixed(1)}%`;
}

/**
 * تفاصيل حالة المشوار (Trip Status)
 */
export const TRIP_STATUS_CONFIG = {
  new: {
    label: 'جديد',
    bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  in_progress: {
    label: 'قيد التنفيذ',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  completed: {
    label: 'مكتمل',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  cancelled: {
    label: 'ملغي',
    bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
};

/**
 * تفاصيل حالة استلام الطلب (Delivery Confirmation Status)
 */
export const DELIVERY_STATUS_CONFIG = {
  delivered: {
    label: 'تم التسليم',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-500',
    colorName: 'green',
  },
  pending: {
    label: 'لم يتم التسليم',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
    colorName: 'orange',
  },
  failed: {
    label: 'تعذر التسليم',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    dotClass: 'bg-rose-500',
    colorName: 'red',
  },
  returned: {
    label: 'تم إرجاع الطلب',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    dotClass: 'bg-slate-500',
    colorName: 'gray',
  },
};

/**
 * تفاصيل حالة الدفع
 */
export const PAYMENT_STATUS_CONFIG = {
  paid: {
    label: 'مدفوع بالكامل',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  partial: {
    label: 'مدفوع جزئياً',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  unpaid: {
    label: 'غير مدفوع',
    bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

/**
 * طرق الدفع المدعومة
 */
export const PAYMENT_METHODS = [
  { id: 'cash', label: 'نقدًا' },
  { id: 'bank_transfer', label: 'تحويل بنكي' },
  { id: 'card', label: 'بطاقة' },
  { id: 'credit', label: 'آجل' },
  { id: 'other', label: 'أخرى' },
];

/**
 * أسباب عدم التسليم
 */
export const PENDING_REASONS = [
  'العميل غير موجود',
  'العميل لم يرد',
  'العنوان غير صحيح',
  'العميل طلب التأجيل',
  'سبب آخر',
];

/**
 * تفاصيل حالة محاسبة الموصل (Driver Settlement Status)
 */
export const DRIVER_SETTLEMENT_CONFIG = {
  UNSETTLED: {
    id: 'UNSETTLED',
    label: 'غير محاسب',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
    colorName: 'orange',
  },
  SETTLED: {
    id: 'SETTLED',
    label: 'محاسب',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-500',
    colorName: 'green',
  },
  unsettled: {
    id: 'UNSETTLED',
    label: 'غير محاسب',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500',
    colorName: 'orange',
  },
  settled: {
    id: 'SETTLED',
    label: 'محاسب',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotClass: 'bg-emerald-500',
    colorName: 'green',
  },
};
