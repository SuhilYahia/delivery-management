import React, { useState, useEffect } from 'react';
import { useCompany } from '../context/CompanyContext';
import { useApp } from '../context/AppContext';
import { DEFAULT_PRICING_CONFIG } from '../utils/pricing';
import {
  Settings as SettingsIcon,
  DollarSign,
  Building2,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function Settings() {
  const { activeCompany, updatePricingConfig, updateCompany } = useCompany();
  const { showToast } = useApp();

  // إعدادات التسعير
  const [pricing, setPricing] = useState({
    tier1MaxMinutes: 19,
    tier1Price: 20,
    tier2MaxMinutes: 29,
    tier2Price: 30,
    tier3MaxMinutes: 60,
    tier3Price: 50,
    extraHourRate: 50,
  });

  // بيانات الشركة
  const [companyProfile, setCompanyProfile] = useState({
    name: '',
    managerName: '',
    phone: '',
    email: '',
    crNumber: '',
    city: '',
  });

  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (activeCompany) {
      if (activeCompany.pricingConfig) {
        setPricing({
          tier1MaxMinutes: activeCompany.pricingConfig.tier1MaxMinutes ?? DEFAULT_PRICING_CONFIG.tier1MaxMinutes,
          tier1Price: activeCompany.pricingConfig.tier1Price ?? DEFAULT_PRICING_CONFIG.tier1Price,
          tier2MaxMinutes: activeCompany.pricingConfig.tier2MaxMinutes ?? DEFAULT_PRICING_CONFIG.tier2MaxMinutes,
          tier2Price: activeCompany.pricingConfig.tier2Price ?? DEFAULT_PRICING_CONFIG.tier2Price,
          tier3MaxMinutes: activeCompany.pricingConfig.tier3MaxMinutes ?? DEFAULT_PRICING_CONFIG.tier3MaxMinutes,
          tier3Price: activeCompany.pricingConfig.tier3Price ?? DEFAULT_PRICING_CONFIG.tier3Price,
          extraHourRate: activeCompany.pricingConfig.extraHourRate ?? DEFAULT_PRICING_CONFIG.extraHourRate,
        });
      }
      setCompanyProfile({
        name: activeCompany.name || '',
        managerName: activeCompany.managerName || '',
        phone: activeCompany.phone || '',
        email: activeCompany.email || '',
        crNumber: activeCompany.crNumber || '',
        city: activeCompany.city || '',
      });
    }
  }, [activeCompany]);

  const handleSavePricing = async (e) => {
    e.preventDefault();
    if (!activeCompany) return;

    // التحقق من صحة المدخلات
    if (
      Number(pricing.tier1Price) < 0 ||
      Number(pricing.tier2Price) < 0 ||
      Number(pricing.tier3Price) < 0 ||
      Number(pricing.extraHourRate) < 0
    ) {
      showToast('أسعار الشرائح لا يمكن أن تكون سالبة', 'error');
      return;
    }

    try {
      setIsSavingPricing(true);
      await updatePricingConfig(activeCompany.id, {
        tier1MaxMinutes: Number(pricing.tier1MaxMinutes),
        tier1Price: Number(pricing.tier1Price),
        tier2MaxMinutes: Number(pricing.tier2MaxMinutes),
        tier2Price: Number(pricing.tier2Price),
        tier3MaxMinutes: Number(pricing.tier3MaxMinutes),
        tier3Price: Number(pricing.tier3Price),
        extraHourRate: Number(pricing.extraHourRate),
      });
      showToast('تم حفظ إعدادات التسعير بنجاح للمشاوير القادمة', 'success');
    } catch (err) {
      showToast('تعذر حفظ إعدادات التسعير', 'error');
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleResetDefaultPricing = () => {
    setPricing({ ...DEFAULT_PRICING_CONFIG });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!activeCompany) return;

    try {
      setIsSavingProfile(true);
      await updateCompany(activeCompany.id, companyProfile);
      showToast('تم تحديث بيانات الشركة بنجاح', 'success');
    } catch (err) {
      showToast('فشل تحديث بيانات الشركة', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* الرأس */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          إعدادات الشركة وقواعد التسعير
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          تخصيص قواعد احتساب تكلفة المشاوير وتحديث الملف التعريفي لشركة{' '}
          <span className="font-bold text-brand-700">{activeCompany?.name}</span>
        </p>
      </div>

      {/* ================= كرت إعدادات التسعير ================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">جدول شرائح التسعير الآلي</h2>
              <p className="text-[11px] text-slate-400">تُطبق الأسعار الجديدة فورياً على أي مشوار يتم تسجيله لاحقاً</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDefaultPricing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة القواعد القياسية</span>
          </button>
        </div>

        {/* تنبيه حفظ الأسعار التاريخية */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-xs text-blue-900">
          <Info className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-bold">سياسة حفظ الأسعار التاريخية:</strong> عند تعديل إعدادات التسعير، لن تتغير تكاليف المشاوير السابقة إطلاقاً حفاظاً على دقة السجلات المحاسبية.
          </p>
        </div>

        <form onSubmit={handleSavePricing} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* الشريحة الأولى */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">الشريحة الأولى (المشاوير القصيرة)</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  حتى {pricing.tier1MaxMinutes} دقيقة
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">الحد الأقصى بالدقائق</label>
                  <input
                    type="number"
                    min="1"
                    value={pricing.tier1MaxMinutes}
                    onChange={(e) => setPricing({ ...pricing, tier1MaxMinutes: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-center font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">السعر (ريال)</label>
                  <input
                    type="number"
                    min="0"
                    value={pricing.tier1Price}
                    onChange={(e) => setPricing({ ...pricing, tier1Price: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-center font-bold bg-white text-brand-700"
                  />
                </div>
              </div>
            </div>

            {/* الشريحة الثانية */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">الشريحة الثانية (المشاوير المتوسطة)</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  20 إلى {pricing.tier2MaxMinutes} دقيقة
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">الحد الأقصى بالدقائق</label>
                  <input
                    type="number"
                    min="2"
                    value={pricing.tier2MaxMinutes}
                    onChange={(e) => setPricing({ ...pricing, tier2MaxMinutes: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-center font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">السعر (ريال)</label>
                  <input
                    type="number"
                    min="0"
                    value={pricing.tier2Price}
                    onChange={(e) => setPricing({ ...pricing, tier2Price: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-center font-bold bg-white text-brand-700"
                  />
                </div>
              </div>
            </div>

            {/* الشريحة الثالثة */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">الشريحة الثالثة (حتى ساعة كاملة)</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  30 إلى {pricing.tier3MaxMinutes} دقيقة
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">الحد الأقصى بالدقائق</label>
                  <input
                    type="number"
                    min="30"
                    value={pricing.tier3MaxMinutes}
                    onChange={(e) => setPricing({ ...pricing, tier3MaxMinutes: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-center font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">السعر (ريال)</label>
                  <input
                    type="number"
                    min="0"
                    value={pricing.tier3Price}
                    onChange={(e) => setPricing({ ...pricing, tier3Price: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2 text-center font-bold bg-white text-brand-700"
                  />
                </div>
              </div>
            </div>

            {/* الساعات الإضافية */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">الساعات الإضافية (بعد 60 دقيقة)</span>
                <span className="text-[10px] bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full font-bold">
                  ساعة أو جزء منها
                </span>
              </div>
              <div className="text-xs">
                <label className="block text-slate-500 mb-1">سعر كل ساعة إضافية أو جزء منها (ريال)</label>
                <input
                  type="number"
                  min="0"
                  value={pricing.extraHourRate}
                  onChange={(e) => setPricing({ ...pricing, extraHourRate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-center font-bold bg-white text-brand-700"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingPricing}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/25 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingPricing ? 'جارٍ الحفظ...' : 'حفظ قواعد التسعير'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ================= كرت الملف التعريفي للشركة ================= */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">الملف التعريفي للشركة</h2>
            <p className="text-[11px] text-slate-400">تحديث بيانات الاتصال والسجل التجاري</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة</label>
              <input
                type="text"
                value={companyProfile.name}
                onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                required
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المسؤول</label>
              <input
                type="text"
                value={companyProfile.managerName}
                onChange={(e) => setCompanyProfile({ ...companyProfile, managerName: e.target.value })}
                required
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الجوال</label>
              <input
                type="text"
                value={companyProfile.phone}
                onChange={(e) => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                dir="ltr"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={companyProfile.email}
                onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                dir="ltr"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">السجل التجاري</label>
              <input
                type="text"
                value={companyProfile.crNumber}
                onChange={(e) => setCompanyProfile({ ...companyProfile, crNumber: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المدينة</label>
              <input
                type="text"
                value={companyProfile.city}
                onChange={(e) => setCompanyProfile({ ...companyProfile, city: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingProfile ? 'جارٍ الحفظ...' : 'حفظ بيانات الشركة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
