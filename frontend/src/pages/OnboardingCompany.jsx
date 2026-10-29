import React, { useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { validateCompanyForm } from '../utils/validators';
import { Building2, Package, Sparkles } from 'lucide-react';

export default function OnboardingCompany() {
  const { createCompany } = useCompany();

  const [formData, setFormData] = useState({
    name: 'المجد هوم للمفروشات',
    managerName: '',
    phone: '',
    email: '',
    crNumber: '',
    city: 'الرياض',
    defaultCurrency: 'SAR',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateCompanyForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await createCompany(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">مرحباً بك في نظام المجد لإدارة التوصيل</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            للبدء في استخدام النظام، يرجى تسجيل بيانات الشركة الأولى. تم اقتراح "المجد هوم للمفروشات" ويمكنك تعديل الاسم بحرية.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم الشركة <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full text-xs rounded-xl border px-3.5 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.name ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              اسم المسؤول / المدير <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.managerName}
              onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
              placeholder="مثال: فهد بن عبدالعزيز"
              className={`w-full text-xs rounded-xl border px-3.5 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.managerName ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.managerName && <p className="text-[11px] text-rose-500 mt-1">{errors.managerName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الجوال (اختياري)</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-3 text-right bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني (اختياري)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@domain.com"
                dir="ltr"
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-3 text-right bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم السجل التجاري (اختياري)</label>
              <input
                type="text"
                value={formData.crNumber}
                onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                placeholder="1010XXXXXX"
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-3 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">المدينة (اختياري)</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="الرياض"
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-3 bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-lg shadow-brand-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isSubmitting ? 'جارٍ إنشاء الشركة...' : 'إنشاء الشركة وبدء العمل'}
          </button>
        </form>
      </div>
    </div>
  );
}
