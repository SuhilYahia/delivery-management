import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // تحميل قائمة الشركات والشركة النشطة
  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const list = await api.getCompanies();
      setCompanies(list);

      const activeId = await api.getActiveCompanyId();
      if (activeId && list.some(c => c.id === activeId)) {
        setActiveCompanyIdState(activeId);
      } else if (list.length > 0) {
        const first = list.find(c => c.isActive) || list[0];
        setActiveCompanyIdState(first.id);
        await api.setActiveCompanyId(first.id);
      } else {
        setActiveCompanyIdState('');
      }
      setError(null);
    } catch (err) {
      console.error('فشل تحميل الشركات:', err);
      setError('تعذر تحميل بيانات الشركات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // تبديل الشركة النشطة
  const switchCompany = useCallback(async (newCompanyId) => {
    if (newCompanyId === activeCompanyId) return;
    try {
      await api.setActiveCompanyId(newCompanyId);
      setActiveCompanyIdState(newCompanyId);
    } catch (err) {
      console.error('فشل تغيير الشركة النشطة:', err);
    }
  }, [activeCompanyId]);

  // إنشاء شركة جديدة
  const createCompany = useCallback(async (companyData) => {
    try {
      const created = await api.createCompany(companyData);
      setCompanies(prev => [created, ...prev]);
      // التبديل فوراً إلى الشركة الجديدة
      await switchCompany(created.id);
      return created;
    } catch (err) {
      console.error('فشل إنشاء الشركة:', err);
      throw err;
    }
  }, [switchCompany]);

  // تعديل بيانات شركة
  const updateCompany = useCallback(async (companyId, updateData) => {
    try {
      const updated = await api.updateCompany(companyId, updateData);
      setCompanies(prev => prev.map(c => c.id === companyId ? updated : c));
      return updated;
    } catch (err) {
      console.error('فشل تحديث بيانات الشركة:', err);
      throw err;
    }
  }, []);

  // تحديث إعدادات تسعير الشركة
  const updatePricingConfig = useCallback(async (companyId, newPricing) => {
    try {
      const updatedConfig = await api.updateCompanyPricing(companyId, newPricing);
      setCompanies(prev => prev.map(c => {
        if (c.id === companyId) {
          return { ...c, pricingConfig: updatedConfig };
        }
        return c;
      }));
      return updatedConfig;
    } catch (err) {
      console.error('فشل تحديث إعدادات التسعير:', err);
      throw err;
    }
  }, []);

  // تبديل حالة الشركة (تفعيل / تعطيل)
  const toggleCompanyStatus = useCallback(async (companyId) => {
    try {
      const updated = await api.toggleCompanyStatus(companyId);
      setCompanies(prev => prev.map(c => c.id === companyId ? updated : c));
      return updated;
    } catch (err) {
      console.error('فشل تعديل حالة الشركة:', err);
      throw err;
    }
  }, []);

  // حذف شركة
  const deleteCompany = useCallback(async (companyId) => {
    try {
      await api.deleteCompany(companyId);
      const remaining = companies.filter(c => c.id !== companyId);
      setCompanies(remaining);
      if (activeCompanyId === companyId) {
        const nextActive = remaining.find(c => c.isActive) || remaining[0];
        const nextId = nextActive ? nextActive.id : '';
        setActiveCompanyIdState(nextId);
        if (nextId) await api.setActiveCompanyId(nextId);
      }
      return true;
    } catch (err) {
      console.error('فشل حذف الشركة:', err);
      throw err;
    }
  }, [companies, activeCompanyId]);

  // الشركة النشطة الحالية
  const activeCompany = companies.find(c => c.id === activeCompanyId) || null;

  const value = {
    companies,
    activeCompanyId,
    activeCompany,
    loading,
    error,
    refreshCompanies: loadCompanies,
    switchCompany,
    createCompany,
    updateCompany,
    updatePricingConfig,
    toggleCompanyStatus,
    deleteCompany,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany يجب أن يُستخدم داخل CompanyProvider');
  }
  return context;
}
