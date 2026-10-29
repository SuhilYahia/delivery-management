/**
 * طبقة Mock API Service المركزية
 * تدير التخزين في LocalStorage مع استجابات Asynchronous تحاكي واجهات Backend الحقيقية
 */

import { INITIAL_COMPANIES, INITIAL_DRIVERS, INITIAL_TRIPS } from '../data/mockData';
import { calculateTripCost, DEFAULT_PRICING_CONFIG } from '../utils/pricing';

const STORAGE_KEYS = {
  COMPANIES: 'almajd_companies_v1',
  ACTIVE_COMPANY_ID: 'almajd_active_company_id_v1',
  DRIVERS: 'almajd_drivers_v1',
  TRIPS: 'almajd_trips_v1',
};

// توليد معرف UUID فريد
export function generateUUID(prefix = '') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return prefix ? `${prefix}-${crypto.randomUUID()}` : crypto.randomUUID();
  }
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${randomStr}` : `${timestamp}-${randomStr}`;
}

// قراءة آمنة من LocalStorage مع الاسترداد التلقائي للبيانات التجريبية
function getStorageItem(key, defaultData) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.warn(`فشل قراءة مفتاح ${key} من التخزين المحلي، سيتم استعادة البيانات الافتراضية`, err);
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
}

// كتابة آمنة إلى LocalStorage
function setStorageItem(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`خطأ أثناء الحفظ في التخزين المحلي للمفتاح ${key}:`, err);
  }
}

// محاكاة تأخير شبكي طفيف (Network Latency Simulation)
const delay = (ms = 40) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // ==================== إدارة الشركات (Companies) ====================
  async getCompanies() {
    await delay();
    return getStorageItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
  },

  async getCompanyById(companyId) {
    await delay();
    const companies = getStorageItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    return companies.find(c => c.id === companyId) || null;
  },

  async getActiveCompanyId() {
    await delay();
    const companies = getStorageItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    const savedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_COMPANY_ID);
    if (savedId && companies.some(c => c.id === savedId)) {
      return savedId;
    }
    const firstActive = companies.find(c => c.isActive) || companies[0];
    const initialId = firstActive ? firstActive.id : '';
    if (initialId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, initialId);
    }
    return initialId;
  },

  async setActiveCompanyId(companyId) {
    await delay();
    localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, companyId);
    return companyId;
  },

  async createCompany(companyData) {
    await delay();
    const companies = getStorageItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    const newCompany = {
      id: generateUUID('comp'),
      name: companyData.name.trim(),
      managerName: companyData.managerName.trim(),
      phone: companyData.phone ? companyData.phone.trim() : '',
      email: companyData.email ? companyData.email.trim() : '',
      crNumber: companyData.crNumber ? companyData.crNumber.trim() : '',
      city: companyData.city ? companyData.city.trim() : 'الرياض',
      logo: companyData.logo || '',
      defaultCurrency: 'SAR',
      isActive: true,
      createdAt: new Date().toISOString().slice(0, 10),
      pricingConfig: companyData.pricingConfig || { ...DEFAULT_PRICING_CONFIG },
    };

    const updated = [newCompany, ...companies];
    setStorageItem(STORAGE_KEYS.COMPANIES, updated);
    return newCompany;
  },

  async updateCompany(companyId, updateData) {
    await delay();
    const companies = getStorageItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    const index = companies.findIndex(c => c.id === companyId);
    if (index === -1) {
      throw new Error('الشركة غير موجودة');
    }

    const updatedCompany = {
      ...companies[index],
      ...updateData,
      id: companyId, // منع تغيير المعرف
    };

    companies[index] = updatedCompany;
    setStorageItem(STORAGE_KEYS.COMPANIES, companies);
    return updatedCompany;
  },

  async toggleCompanyStatus(companyId) {
    await delay();
    const companies = getStorageItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    const company = companies.find(c => c.id === companyId);
    if (!company) throw new Error('الشركة غير موجودة');

    company.isActive = !company.isActive;
    setStorageItem(STORAGE_KEYS.COMPANIES, companies);
    return company;
  },

  async deleteCompany(companyId) {
    await delay();
    let companies = getStorageItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    companies = companies.filter(c => c.id !== companyId);
    setStorageItem(STORAGE_KEYS.COMPANIES, companies);

    // تنظيف البيانات المرتبطة بها
    let drivers = getStorageItem(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    drivers = drivers.filter(d => d.companyId !== companyId);
    setStorageItem(STORAGE_KEYS.DRIVERS, drivers);

    let trips = getStorageItem(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    trips = trips.filter(t => t.companyId !== companyId);
    setStorageItem(STORAGE_KEYS.TRIPS, trips);

    return true;
  },

  async updateCompanyPricing(companyId, newPricingConfig) {
    await delay();
    const companies = getStorageItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    const index = companies.findIndex(c => c.id === companyId);
    if (index === -1) throw new Error('الشركة غير موجودة');

    companies[index].pricingConfig = {
      ...companies[index].pricingConfig,
      ...newPricingConfig,
    };

    setStorageItem(STORAGE_KEYS.COMPANIES, companies);
    return companies[index].pricingConfig;
  },

  // ==================== إدارة الموصلين (Drivers) ====================
  async getDrivers(companyId) {
    await delay();
    const drivers = getStorageItem(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    if (!companyId) return drivers;
    return drivers.filter(d => d.companyId === companyId);
  },

  async createDriver(companyId, driverData) {
    await delay();
    if (!companyId) throw new Error('معرف الشركة مطلوب لإضافة موصل');

    const drivers = getStorageItem(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    const newDriver = {
      id: generateUUID('drv'),
      companyId,
      name: driverData.name.trim(),
      phone: driverData.phone.trim(),
      vehicleType: driverData.vehicleType ? driverData.vehicleType.trim() : 'سيارة توصيل',
      isActive: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const updated = [newDriver, ...drivers];
    setStorageItem(STORAGE_KEYS.DRIVERS, updated);
    return newDriver;
  },

  async updateDriver(driverId, updateData) {
    await delay();
    const drivers = getStorageItem(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    const index = drivers.findIndex(d => d.id === driverId);
    if (index === -1) throw new Error('الموصل غير موجود');

    drivers[index] = {
      ...drivers[index],
      ...updateData,
      id: driverId,
    };

    setStorageItem(STORAGE_KEYS.DRIVERS, drivers);
    return drivers[index];
  },

  async toggleDriverStatus(driverId) {
    await delay();
    const drivers = getStorageItem(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    const index = drivers.findIndex(d => d.id === driverId);
    if (index === -1) throw new Error('الموصل غير موجود');

    drivers[index].isActive = !drivers[index].isActive;
    setStorageItem(STORAGE_KEYS.DRIVERS, drivers);
    return drivers[index];
  },

  async deleteDriver(driverId) {
    await delay();
    const trips = getStorageItem(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    const hasAssociatedTrips = trips.some(t => t.driverId === driverId);
    
    // فحص ما إذا كان للموصل مشاوير سابقة
    if (hasAssociatedTrips) {
      throw new Error('لا يمكن حذف الموصل لوجود مشاوير مرتبطة به. يمكنك تعطيل حسابه بدلاً من ذلك.');
    }

    let drivers = getStorageItem(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    drivers = drivers.filter(d => d.id !== driverId);
    setStorageItem(STORAGE_KEYS.DRIVERS, drivers);
    return true;
  },

  // ==================== إدارة المشاوير (Trips) ====================
  async getTrips(companyId) {
    await delay();
    const trips = getStorageItem(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    if (!companyId) return trips;
    return trips.filter(t => t.companyId === companyId);
  },

  async getTripById(tripId) {
    await delay();
    const trips = getStorageItem(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    return trips.find(t => t.id === tripId) || null;
  },

  async createTrip(companyId, tripData) {
    await delay();
    if (!companyId) throw new Error('معرف الشركة مطلوب لإنشاء مشوار');

    const trips = getStorageItem(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    const companies = getStorageItem(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    const company = companies.find(c => c.id === companyId);

    // احتساب التكلفة وفق إعدادات تسعير الشركة الحالية إذا لم تكن محددة يدوياً
    const cost = tripData.cost !== undefined && tripData.cost !== null && tripData.cost !== ''
      ? Number(tripData.cost)
      : calculateTripCost(tripData.durationMinutes, company?.pricingConfig);

    const tripSeq = trips.filter(t => t.companyId === companyId).length + 1001;
    const tripNumber = tripData.tripNumber || `TRP-${tripSeq}`;

    const newTrip = {
      id: generateUUID('trip'),
      tripNumber,
      companyId,
      driverId: tripData.driverId,
      driverName: tripData.driverName || 'موصل',
      orderNumber: tripData.orderNumber ? tripData.orderNumber.trim() : `ORD-${tripSeq}`,
      customerName: tripData.customerName.trim(),
      customerPhone: tripData.customerPhone ? tripData.customerPhone.trim() : '',
      deliveryAddress: tripData.deliveryAddress ? tripData.deliveryAddress.trim() : '',
      tripDate: tripData.tripDate,
      tripTime: tripData.tripTime,
      durationMinutes: parseInt(tripData.durationMinutes, 10),
      cost, // حفظ السعر التاريخي النهائي
      status: tripData.status || 'new', // new, in_progress, completed, cancelled
      deliveryStatus: tripData.deliveryStatus || 'pending', // pending, delivered, failed, returned
      
      // تفاصيل التسليم
      actualDeliveryDate: tripData.actualDeliveryDate || '',
      actualDeliveryTime: tripData.actualDeliveryTime || '',
      recipientName: tripData.recipientName || '',
      deliveryNotes: tripData.deliveryNotes || '',
      
      // تفاصيل عدم التسليم أو الإرجاع أو التعذر
      pendingReason: tripData.pendingReason || '',
      nextDeliveryDate: tripData.nextDeliveryDate || '',
      failureReason: tripData.failureReason || '',
      returnDate: tripData.returnDate || '',
      returnReason: tripData.returnReason || '',
      cancelReason: tripData.cancelReason || '',

      // المالية
      paymentMethod: tripData.paymentMethod || 'cash',
      paidAmount: Number(tripData.paidAmount) || 0,
      
      // ملاحظات
      notes: tripData.notes || '',
      adminNotes: tripData.adminNotes || '',
      createdAt: new Date().toISOString(),
    };

    const updated = [newTrip, ...trips];
    setStorageItem(STORAGE_KEYS.TRIPS, updated);
    return newTrip;
  },

  async updateTrip(tripId, updateData) {
    await delay();
    const trips = getStorageItem(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    const index = trips.findIndex(t => t.id === tripId);
    if (index === -1) throw new Error('المشوار غير موجود');

    const existingTrip = trips[index];
    const updatedTrip = {
      ...existingTrip,
      ...updateData,
      id: tripId,
      companyId: existingTrip.companyId, // تثبيت تبعية الشركة
      cost: updateData.cost !== undefined ? Number(updateData.cost) : existingTrip.cost,
      paidAmount: updateData.paidAmount !== undefined ? Number(updateData.paidAmount) : existingTrip.paidAmount,
    };

    trips[index] = updatedTrip;
    setStorageItem(STORAGE_KEYS.TRIPS, trips);
    return updatedTrip;
  },

  async updateDeliveryStatus(tripId, statusPayload) {
    await delay();
    const trips = getStorageItem(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    const index = trips.findIndex(t => t.id === tripId);
    if (index === -1) throw new Error('المشوار غير موجود');

    const trip = trips[index];
    const newDeliveryStatus = statusPayload.deliveryStatus;

    // تحديث ذكي: الحفاظ على تاريخ التسليم السابق إذا كان موجوداً
    const updatedTrip = {
      ...trip,
      deliveryStatus: newDeliveryStatus,
      // إذا تم التسليم: تسجيل الوقت والتاريخ
      ...(newDeliveryStatus === 'delivered' ? {
        actualDeliveryDate: statusPayload.actualDeliveryDate || trip.actualDeliveryDate || new Date().toISOString().slice(0, 10),
        actualDeliveryTime: statusPayload.actualDeliveryTime || trip.actualDeliveryTime || new Date().toTimeString().slice(0, 5),
        recipientName: statusPayload.recipientName ?? trip.recipientName,
        deliveryNotes: statusPayload.deliveryNotes ?? trip.deliveryNotes,
        status: trip.status === 'new' ? 'completed' : trip.status,
      } : {}),
      // إذا لم يتم التسليم
      ...(newDeliveryStatus === 'pending' ? {
        pendingReason: statusPayload.pendingReason ?? trip.pendingReason,
        nextDeliveryDate: statusPayload.nextDeliveryDate ?? trip.nextDeliveryDate,
        deliveryNotes: statusPayload.deliveryNotes ?? trip.deliveryNotes,
      } : {}),
      // إذا تعذر التسليم
      ...(newDeliveryStatus === 'failed' ? {
        failureReason: statusPayload.failureReason ?? trip.failureReason,
        deliveryNotes: statusPayload.deliveryNotes ?? trip.deliveryNotes,
      } : {}),
      // إذا تم الإرجاع
      ...(newDeliveryStatus === 'returned' ? {
        returnDate: statusPayload.returnDate || new Date().toISOString().slice(0, 10),
        returnReason: statusPayload.returnReason ?? trip.returnReason,
        deliveryNotes: statusPayload.deliveryNotes ?? trip.deliveryNotes,
      } : {}),
    };

    trips[index] = updatedTrip;
    setStorageItem(STORAGE_KEYS.TRIPS, trips);
    return updatedTrip;
  },

  async deleteTrip(tripId) {
    await delay();
    let trips = getStorageItem(STORAGE_KEYS.TRIPS, INITIAL_TRIPS);
    trips = trips.filter(t => t.id !== tripId);
    setStorageItem(STORAGE_KEYS.TRIPS, trips);
    return true;
  },

  // إعادة تعيين البيانات التجريبية لحالتها الأولى
  async resetToDefaults() {
    await delay();
    localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(INITIAL_COMPANIES));
    localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(INITIAL_DRIVERS));
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(INITIAL_TRIPS));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, INITIAL_COMPANIES[0].id);
    return true;
  }
};
