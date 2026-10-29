import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { useCompany } from '../../context/CompanyContext';
import { validateDriverForm } from '../../utils/validators';

export default function DriverFormModal({
  isOpen,
  onClose,
  initialData = null,
}) {
  const { addDriver, editDriver } = useApp();
  const { activeCompany } = useCompany();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleType: 'سيارة نقل بضائع',
    isActive: true,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        vehicleType: initialData.vehicleType || 'سيارة نقل بضائع',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        vehicleType: 'سيارة نقل بضائع',
        isActive: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateDriverForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        await editDriver(initialData.id, formData);
      } else {
        await addDriver(formData);
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
      title={isEditing ? 'تعديل بيانات الموصل' : 'إضافة موصل جديد'}
      subtitle={`الشركة: ${activeCompany?.name || ''}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            اسم الموصل <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="مثال: سالم الدوسري"
            className={`w-full text-xs rounded-xl border px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              errors.name ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            رقم الجوال <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="05XXXXXXXX"
            dir="ltr"
            className={`w-full text-xs rounded-xl border px-3 py-2.5 text-right bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              errors.phone ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            نوع وسيلة النقل / المركبة
          </label>
          <input
            type="text"
            value={formData.vehicleType}
            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            placeholder="مثال: دينا مغلقة، وانيت، فان بضائع"
            className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {isEditing && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              id="driver-active-chk"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-brand-600 rounded-sm"
            />
            <label htmlFor="driver-active-chk" className="text-xs font-bold text-slate-700 cursor-pointer">
              حساب الموصل نشط ومتاح لإسناد المشاوير
            </label>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
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
            {isSubmitting ? 'جارٍ الحفظ...' : isEditing ? 'تحديث الموصل' : 'إضافة الموصل'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
