import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useCompany } from './CompanyContext';
import api from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { activeCompanyId, activeCompany } = useCompany();

  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // إدارة الإشعارات السريعة (Toast Notifications)
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // جلب الموصلين والمشاوير التابعة للشركة النشطة فقط
  const refreshData = useCallback(async () => {
    if (!activeCompanyId) {
      setDrivers([]);
      setTrips([]);
      return;
    }

    try {
      setLoading(true);
      const [fetchedDrivers, fetchedTrips] = await Promise.all([
        api.getDrivers(activeCompanyId),
        api.getTrips(activeCompanyId),
      ]);
      setDrivers(fetchedDrivers);
      setTrips(fetchedTrips);
    } catch (err) {
      console.error('فشل جلب بيانات الشركة النشطة:', err);
      showToast('تعذر تحميل بيانات المشاوير والموصلين', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeCompanyId, showToast]);

  // تحديث البيانات تلقائياً عند تغيير الشركة النشطة
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ==================== عمليات الموصلين ====================
  const addDriver = useCallback(async (driverData) => {
    try {
      const newDriver = await api.createDriver(activeCompanyId, driverData);
      setDrivers(prev => [newDriver, ...prev]);
      showToast(`تم إضافة الموصل "${newDriver.name}" بنجاح`, 'success');
      return newDriver;
    } catch (err) {
      showToast(err.message || 'فشل إضافة الموصل', 'error');
      throw err;
    }
  }, [activeCompanyId, showToast]);

  const editDriver = useCallback(async (driverId, updateData) => {
    try {
      const updated = await api.updateDriver(driverId, updateData);
      setDrivers(prev => prev.map(d => d.id === driverId ? updated : d));
      
      // تحديث اسم الموصل في المشاوير إذا تم تعديله
      if (updateData.name) {
        setTrips(prev => prev.map(t => t.driverId === driverId ? { ...t, driverName: updateData.name } : t));
      }
      
      showToast('تم تحديث بيانات الموصل بنجاح', 'success');
      return updated;
    } catch (err) {
      showToast(err.message || 'فشل تحديث بيانات الموصل', 'error');
      throw err;
    }
  }, [showToast]);

  const toggleDriver = useCallback(async (driverId) => {
    try {
      const updated = await api.toggleDriverStatus(driverId, activeCompanyId);
      setDrivers(prev => prev.map(d => d.id === driverId ? updated : d));
      showToast(updated.isActive ? 'تم تفعيل الموصل' : 'تم تعطيل الموصل', 'info');
      return updated;
    } catch (err) {
      showToast(err.message || 'فشل تعديل حالة الموصل', 'error');
      throw err;
    }
  }, [activeCompanyId, showToast]);

  const removeDriver = useCallback(async (driverId) => {
    try {
      await api.deleteDriver(driverId, activeCompanyId);
      setDrivers(prev => prev.filter(d => d.id !== driverId));
      showToast('تم حذف الموصل بنجاح', 'success');
      return true;
    } catch (err) {
      showToast(err.message || 'فشل حذف الموصل', 'error');
      throw err;
    }
  }, [activeCompanyId, showToast]);

  // ==================== عمليات المشاوير ====================
  const addTrip = useCallback(async (tripData) => {
    try {
      const driver = drivers.find(d => d.id === tripData.driverId);
      const payload = {
        ...tripData,
        driverName: driver ? driver.name : tripData.driverName,
      };

      const newTrip = await api.createTrip(activeCompanyId, payload);
      setTrips(prev => [newTrip, ...prev]);
      showToast(`تم تسجيل المشوار ${newTrip.tripNumber} بنجاح`, 'success');
      return newTrip;
    } catch (err) {
      showToast(err.message || 'فشل إنشاء المشوار', 'error');
      throw err;
    }
  }, [activeCompanyId, drivers, showToast]);

  const editTrip = useCallback(async (tripId, updateData) => {
    try {
      let driverName = updateData.driverName;
      if (updateData.driverId) {
        const driver = drivers.find(d => d.id === updateData.driverId);
        if (driver) driverName = driver.name;
      }

      const payload = {
        ...updateData,
        ...(driverName ? { driverName } : {}),
      };

      const updated = await api.updateTrip(tripId, payload);
      setTrips(prev => prev.map(t => t.id === tripId ? updated : t));
      showToast('تم تعديل بيانات المشوار بنجاح', 'success');
      return updated;
    } catch (err) {
      showToast(err.message || 'فشل تعديل المشوار', 'error');
      throw err;
    }
  }, [drivers, showToast]);

  const changeDeliveryStatus = useCallback(async (tripId, statusPayload) => {
    try {
      const updated = await api.updateDeliveryStatus(tripId, statusPayload);
      setTrips(prev => prev.map(t => t.id === tripId ? updated : t));
      showToast('تم تحديث حالة استلام الطلب بنجاح', 'success');
      return updated;
    } catch (err) {
      showToast(err.message || 'فشل تحديث حالة الاستلام', 'error');
      throw err;
    }
  }, [showToast]);

  const removeTrip = useCallback(async (tripId) => {
    try {
      await api.deleteTrip(tripId);
      setTrips(prev => prev.filter(t => t.id !== tripId));
      showToast('تم حذف المشوار بنجاح', 'success');
      return true;
    } catch (err) {
      showToast(err.message || 'فشل حذف المشوار', 'error');
      throw err;
    }
  }, [showToast]);

  // إعادة ضبط البيانات الافتراضية
  const resetToFactoryDefaults = useCallback(async () => {
    try {
      await api.resetToDefaults();
      window.location.reload();
    } catch (err) {
      showToast('فشل إعادة ضبط البيانات', 'error');
    }
  }, [showToast]);

  const value = {
    drivers,
    trips,
    loading,
    toasts,
    showToast,
    removeToast,
    refreshData,
    addDriver,
    editDriver,
    toggleDriver,
    removeDriver,
    addTrip,
    editTrip,
    changeDeliveryStatus,
    removeTrip,
    resetToFactoryDefaults,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp يجب أن يُستخدم داخل AppProvider');
  }
  return context;
}
