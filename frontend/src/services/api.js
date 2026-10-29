/**
 * طبقة الاتصال الحقيقية مع خادم Backend (Node.js + Express + PostgreSQL)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

// مفاتيح التخزين للرموز المحلية
const TOKEN_KEY = 'almajd_auth_token_v2';
const ACTIVE_COMPANY_KEY = 'almajd_active_company_id_v2';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  getActiveCompanyId: () => localStorage.getItem(ACTIVE_COMPANY_KEY),
  setActiveCompanyId: (id) => localStorage.setItem(ACTIVE_COMPANY_KEY, id),
};

/**
 * دالة مركزية لتنفيذ طلبات HTTP مع إدارة الترويسات والأخطاء
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = authStorage.getToken();
  const companyId = authStorage.getActiveCompanyId();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(companyId ? { 'X-Company-Id': companyId } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // إذا كان الرمز منتهي الصلاحية أو غير صالح، يتم تجديده تلقائياً
      if (res.status === 401 && !options._isRetry) {
        authStorage.removeToken();
        await ensureAuthenticated(true);
        return request(endpoint, { ...options, _isRetry: true });
      }

      // إذا كانت الشركة النشطة القديمة غير موجودة
      if (res.status === 404 && data.message?.includes('الشركة') && !options._isRetry) {
        authStorage.setActiveCompanyId('');
        return request(endpoint, { ...options, _isRetry: true });
      }

      const errorMsg = data.message || `خطأ في الخادم (${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.errors = data.errors;
      throw error;
    }

    return data.data;
  } catch (err) {
    console.error(`❌ خطأ في استدعاء API [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

/**
 * التأكد من وجود جلسة صالحة تلقائياً للاستخدام المباشر
 */
async function ensureAuthenticated(force = false) {
  let token = authStorage.getToken();
  if (!token || force) {
    try {
      // تسجيل دخول أولي تلقائي بالحساب الإداري المعتمد
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@almajd.sa', password: 'Admin@123456' }),
      });
      const data = await res.json();
      if (data.success && data.data.token) {
        authStorage.setToken(data.data.token);
        if (data.data.companies && data.data.companies.length > 0) {
          authStorage.setActiveCompanyId(data.data.companies[0].id);
        }
      }
    } catch (e) {
      console.warn('تعذر المصادقة الأولية التلقائية:', e);
    }
  }
}

export const api = {
  // ==================== المصادقة والمستخدمين ====================
  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      authStorage.setToken(data.token);
      if (data.companies && data.companies.length > 0) {
        authStorage.setActiveCompanyId(data.companies[0].id);
      }
    }
    return data;
  },

  async register(name, email, password, companyName) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, companyName }),
    });
    if (data.token) {
      authStorage.setToken(data.token);
      if (data.company) {
        authStorage.setActiveCompanyId(data.company.id);
      }
    }
    return data;
  },

  async getMe() {
    await ensureAuthenticated();
    return request('/auth/me');
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      authStorage.removeToken();
    }
  },

  // ==================== الشركات (Companies) ====================
  async getCompanies() {
    await ensureAuthenticated();
    return request('/companies');
  },

  async getCompanyById(companyId) {
    await ensureAuthenticated();
    return request(`/companies/${companyId}`);
  },

  async createCompany(companyData) {
    await ensureAuthenticated();
    const created = await request('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
    if (created && created.id) {
      authStorage.setActiveCompanyId(created.id);
    }
    return created;
  },

  async updateCompany(companyId, updateData) {
    await ensureAuthenticated();
    return request(`/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  async toggleCompanyStatus(companyId) {
    await ensureAuthenticated();
    return request(`/companies/${companyId}/status`, {
      method: 'PATCH',
    });
  },

  async deleteCompany(companyId) {
    await ensureAuthenticated();
    return request(`/companies/${companyId}`, {
      method: 'DELETE',
    });
  },

  async getActiveCompanyId() {
    const stored = authStorage.getActiveCompanyId();
    if (stored) return stored;
    try {
      const companies = await this.getCompanies();
      if (companies && companies.length > 0) {
        authStorage.setActiveCompanyId(companies[0].id);
        return companies[0].id;
      }
    } catch {}
    return '';
  },

  async setActiveCompanyId(companyId) {
    authStorage.setActiveCompanyId(companyId);
    return companyId;
  },

  // ==================== السائقون (Drivers) ====================
  async getDrivers(companyId) {
    await ensureAuthenticated();
    const effectiveCompanyId = companyId || authStorage.getActiveCompanyId();
    if (effectiveCompanyId) authStorage.setActiveCompanyId(effectiveCompanyId);
    const headers = effectiveCompanyId ? { 'X-Company-Id': effectiveCompanyId } : {};
    return request('/drivers', { headers });
  },

  async getDriverById(driverId) {
    await ensureAuthenticated();
    return request(`/drivers/${driverId}`);
  },

  async createDriver(companyIdOrData, maybeData) {
    await ensureAuthenticated();
    const isCompanyIdFirst = typeof companyIdOrData === 'string';
    const companyId = isCompanyIdFirst ? companyIdOrData : authStorage.getActiveCompanyId();
    const data = isCompanyIdFirst ? maybeData : companyIdOrData;

    if (companyId) authStorage.setActiveCompanyId(companyId);
    const headers = companyId ? { 'X-Company-Id': companyId } : {};

    return request('/drivers', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  },

  async updateDriver(driverId, updateData) {
    await ensureAuthenticated();
    return request(`/drivers/${driverId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  async toggleDriverStatus(driverId, companyId) {
    await ensureAuthenticated();
    const effectiveCompanyId = companyId || authStorage.getActiveCompanyId();
    const headers = effectiveCompanyId ? { 'X-Company-Id': effectiveCompanyId } : {};
    return request(`/drivers/${driverId}/status`, {
      method: 'PATCH',
      headers,
    });
  },

  async deleteDriver(driverId, companyId) {
    await ensureAuthenticated();
    const effectiveCompanyId = companyId || authStorage.getActiveCompanyId();
    const headers = effectiveCompanyId ? { 'X-Company-Id': effectiveCompanyId } : {};
    return request(`/drivers/${driverId}`, {
      method: 'DELETE',
      headers,
    });
  },

  // ==================== الرحلات والمشاوير (Trips) ====================
  async getTrips(companyIdOrFilters = {}, maybeFilters = {}) {
    await ensureAuthenticated();
    let companyId = authStorage.getActiveCompanyId();
    let filters = {};

    if (typeof companyIdOrFilters === 'string') {
      companyId = companyIdOrFilters;
      filters = maybeFilters || {};
    } else if (companyIdOrFilters && typeof companyIdOrFilters === 'object') {
      filters = companyIdOrFilters;
    }

    if (companyId) authStorage.setActiveCompanyId(companyId);

    const query = new URLSearchParams();
    if (filters.page) query.set('page', filters.page);
    query.set('limit', filters.limit ? String(filters.limit) : '100');
    if (filters.search) query.set('search', filters.search);
    if (filters.driverId) query.set('driverId', filters.driverId);
    if (filters.status) query.set('status', filters.status.toUpperCase());
    if (filters.deliveryStatus) query.set('deliveryStatus', filters.deliveryStatus.toUpperCase());
    if (filters.startDate) query.set('startDate', filters.startDate);
    if (filters.endDate) query.set('endDate', filters.endDate);
    if (filters.sortField) query.set('sortField', filters.sortField);
    if (filters.sortOrder) query.set('sortOrder', filters.sortOrder);

    const headers = companyId ? { 'X-Company-Id': companyId } : {};
    return request(`/trips?${query.toString()}`, { headers });
  },

  async getTripById(tripId) {
    await ensureAuthenticated();
    return request(`/trips/${tripId}`);
  },

  async createTrip(companyIdOrData, maybeData) {
    await ensureAuthenticated();
    const isCompanyIdFirst = typeof companyIdOrData === 'string';
    const companyId = isCompanyIdFirst ? companyIdOrData : authStorage.getActiveCompanyId();
    const tripData = isCompanyIdFirst ? maybeData : companyIdOrData;

    if (companyId) authStorage.setActiveCompanyId(companyId);
    const headers = companyId ? { 'X-Company-Id': companyId } : {};

    return request('/trips', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        driverId: tripData.driverId,
        orderNumber: tripData.orderNumber || null,
        customerName: tripData.customerName,
        customerPhone: tripData.customerPhone || null,
        deliveryAddress: tripData.deliveryAddress || null,
        tripDate: tripData.tripDate,
        tripTime: tripData.tripTime,
        durationMinutes: parseInt(tripData.durationMinutes, 10),
        status: (tripData.status || 'new').toUpperCase(),
        deliveryStatus: (tripData.deliveryStatus || 'pending').toUpperCase(),
        paymentMethod: (tripData.paymentMethod || 'cash').toUpperCase(),
        paidAmount: Number(tripData.paidAmount) || 0,
        notes: tripData.notes || null,
        adminNotes: tripData.adminNotes || null,
      }),
    });
  },

  async updateTrip(tripId, updateData) {
    await ensureAuthenticated();
    return request(`/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...updateData,
        status: updateData.status ? updateData.status.toUpperCase() : undefined,
        durationMinutes: updateData.durationMinutes ? parseInt(updateData.durationMinutes, 10) : undefined,
      }),
    });
  },

  async deleteTrip(tripId) {
    await ensureAuthenticated();
    return request(`/trips/${tripId}`, {
      method: 'DELETE',
    });
  },

  // ==================== دورة استلام الطلب والتوصيل ====================
  async updateDeliveryStatus(tripId, statusPayload) {
    await ensureAuthenticated();
    return request(`/deliveries/${tripId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: statusPayload.deliveryStatus ? statusPayload.deliveryStatus.toUpperCase() : statusPayload.status?.toUpperCase(),
        actualDeliveryDate: statusPayload.actualDeliveryDate || null,
        actualDeliveryTime: statusPayload.actualDeliveryTime || null,
        recipientName: statusPayload.recipientName || null,
        pendingReason: statusPayload.pendingReason || null,
        nextDeliveryDate: statusPayload.nextDeliveryDate || null,
        failureReason: statusPayload.failureReason || null,
        returnDate: statusPayload.returnDate || null,
        returnReason: statusPayload.returnReason || null,
        deliveryNotes: statusPayload.deliveryNotes || null,
      }),
    });
  },

  // ==================== المدفوعات (Payments) ====================
  async createPayment(paymentData) {
    await ensureAuthenticated();
    return request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  async getTripPayments(tripId) {
    await ensureAuthenticated();
    return request(`/payments/trip/${tripId}`);
  },

  // ==================== قواعد التسعير ====================
  async getCompanyPricing() {
    await ensureAuthenticated();
    return request('/pricing');
  },

  async updateCompanyPricing(companyId, pricingConfig) {
    await ensureAuthenticated();
    return request('/pricing', {
      method: 'PUT',
      body: JSON.stringify({
        tier1MaxMinutes: Number(pricingConfig.tier1MaxMinutes),
        tier1Price: Number(pricingConfig.tier1Price),
        tier2MaxMinutes: Number(pricingConfig.tier2MaxMinutes),
        tier2Price: Number(pricingConfig.tier2Price),
        tier3MaxMinutes: Number(pricingConfig.tier3MaxMinutes),
        tier3Price: Number(pricingConfig.tier3Price),
        extraHourRate: Number(pricingConfig.extraHourRate),
      }),
    });
  },

  // ==================== التقارير ولوحة التحكم ====================
  async getDashboardOverview() {
    await ensureAuthenticated();
    return request('/reports/dashboard');
  },

  async getReportData(filters = {}) {
    await ensureAuthenticated();
    const query = new URLSearchParams();
    if (filters.startDate) query.set('startDate', filters.startDate);
    if (filters.endDate) query.set('endDate', filters.endDate);
    if (filters.driverId) query.set('driverId', filters.driverId);
    if (filters.tripStatus) query.set('tripStatus', filters.tripStatus);
    if (filters.deliveryStatus) query.set('deliveryStatus', filters.deliveryStatus);
    if (filters.includeCancelled) query.set('includeCancelled', 'true');

    return request(`/reports/data?${query.toString()}`);
  },

  // ==================== محاسبة الموصلين (Driver Settlements) ====================
  async settleDriverTrips(data) {
    await ensureAuthenticated();
    return request('/settlements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getDriverStatement(driverId, filters = {}) {
    await ensureAuthenticated();
    const query = new URLSearchParams();
    if (filters.startDate) query.set('startDate', filters.startDate);
    if (filters.endDate) query.set('endDate', filters.endDate);
    if (filters.status) query.set('status', filters.status);
    return request(`/settlements/driver/${driverId}/statement?${query.toString()}`);
  },

  async getSettlementHistory(driverId = '') {
    await ensureAuthenticated();
    const query = driverId ? `?driverId=${driverId}` : '';
    return request(`/settlements/history${query}`);
  },

  async getDriverDuesReport(filters = {}) {
    await ensureAuthenticated();
    const query = new URLSearchParams();
    if (filters.driverId) query.set('driverId', filters.driverId);
    if (filters.startDate) query.set('startDate', filters.startDate);
    if (filters.endDate) query.set('endDate', filters.endDate);
    return request(`/settlements/dues-report?${query.toString()}`);
  },

  // ==================== المساعد الذكي (AI) ====================
  async chatWithAi(prompt, history = []) {
    await ensureAuthenticated();
    return request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, history }),
    });
  },

  async resetToDefaults() {
    return { success: true };
  },
};

export default api;
