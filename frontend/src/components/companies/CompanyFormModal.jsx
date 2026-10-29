import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useCompany } from '../../context/CompanyContext';
import { validateCompanyForm } from '../../utils/validators';
import { Building2, User, Phone, Mail, FileSpreadsheet, MapPin } from 'lucide-react';

export default function CompanyFormModal({
  isOpen,
  onClose,
  initialData = null,
}) {
  const { companies, createCompany, updateCompany } = useCompany();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: '',
    managerName: '',
    phone: '',
    email: '',
    crNumber: '',
    city: 'الرياض',
    logo: '',
    defaultCurrency: 'SAR',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        managerName: initialData.managerName || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        crNumber: initialData.crNumber || '',
        city: initialData.city || 'الرياض',
        logo: initialData.logo || '',
        defaultCurrency: initialData.defaultCurrency || 'SAR',
      });
    } else {
      // إذا كانت أول شركة تسجل وكان النظام فارغاً نقترح "المجد هوم للمفروشات"
      const defaultSuggestedName = (!companies || companies.length === 0) ? 'المجد هوم للمفروشات' : '';
      setFormData({
        name: defaultSuggestedName,
        managerName: '',
        phone: '',
        email: '',
        crNumber: '',
        city: 'الرياض',
        logo: '',
        defaultCurrency: 'SAR',
      });
    }
    setErrors({});
  }, [initialData, isOpen, companies]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateCompanyForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        await updateCompany(initialData.id, formData);
      } else {
        await createCompany(formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'تعديل بيانات الشركة' : 'تسجيل شركة جديدة'}
      subtitle="نظام تعدد الشركات Multi-Tenant"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* اسم الشركة */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            اسم الشركة <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: المجد هوم للمفروشات"
              className={`w-full text-xs rounded-xl border px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.name ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
          </div>
          {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
        </div>

        {/* اسم المسؤول */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            اسم المسؤول / المدير <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.managerName}
            onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
            placeholder="مثال: فهد بن عبد العزيز"
            className={`w-full text-xs rounded-xl border px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              errors.managerName ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          {errors.managerName && <p className="text-[11px] text-rose-500 mt-1">{errors.managerName}</p>}
        </div>

        {/* الهاتف والبريد */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رقم الجوال (اختياري)
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="05XXXXXXXX"
              dir="ltr"
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-right bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              البريد الإلكتروني (اختياري)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="company@domain.com"
              dir="ltr"
              className={`w-full text-xs rounded-xl border px-3 py-2.5 text-right bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                errors.email ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* السجل التجاري والمدينة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رقم السجل التجاري (اختياري)
            </label>
            <input
              type="text"
              value={formData.crNumber}
              onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
              placeholder="1010XXXXXX"
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المدينة (اختياري)
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="الرياض / جدة / الدمام..."
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'جارٍ الحفظ...' : isEditing ? 'تحديث الشركة' : 'تسجيل الشركة'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
