/**
 * دوال التحقق من صحة المدخلات
 */

export function validateTripForm(formData) {
  const errors = {};

  if (!formData.driverId) {
    errors.driverId = 'يرجى اختيار الموصل';
  }

  if (!formData.tripDate) {
    errors.tripDate = 'يرجى تحديد تاريخ المشوار';
  }

  if (!formData.tripTime) {
    errors.tripTime = 'يرجى تحديد وقت المشوار';
  }

  const duration = parseInt(formData.durationMinutes, 10);
  if (isNaN(duration) || duration <= 0) {
    errors.durationMinutes = 'مدة المشوار يجب أن تكون رقماً صحيحاً أكبر من صفر';
  }

  if (!formData.customerName || formData.customerName.trim() === '') {
    errors.customerName = 'اسم العميل مطلوب';
  }

  if (formData.paidAmount < 0) {
    errors.paidAmount = 'المبلغ المدفوع لا يمكن أن يكون سالباً';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateCompanyForm(formData) {
  const errors = {};

  if (!formData.name || formData.name.trim() === '') {
    errors.name = 'اسم الشركة مطلوب';
  }

  if (!formData.managerName || formData.managerName.trim() === '') {
    errors.managerName = 'اسم المسؤول مطلوب';
  }

  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'صيغة البريد الإلكتروني غير صحيحة';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateDriverForm(formData) {
  const errors = {};

  if (!formData.name || formData.name.trim() === '') {
    errors.name = 'اسم الموصل مطلوب';
  }

  if (!formData.phone || formData.phone.trim() === '') {
    errors.phone = 'رقم جوال الموصل مطلوب';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
