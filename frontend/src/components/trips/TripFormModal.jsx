import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useCompany } from '../../context/CompanyContext';
import { useApp } from '../../context/AppContext';
import { calculateTripCost } from '../../utils/pricing';
import { getTodayDateString, getCurrentTimeString } from '../../utils/dateUtils';
import { validateTripForm } from '../../utils/validators';
import { PAYMENT_METHODS, PENDING_REASONS } from '../../utils/formatters';
import {
  Truck,
  User,
  Clock,
  DollarSign,
  FileText,
  Calendar,
  AlertCircle,
  Plus,
  Minus,
  ReceiptText,
} from 'lucide-react';

export default function TripFormModal({
  isOpen,
  onClose,
  initialData = null, // إذا كان للتعديل
}) {
  const { activeCompany } = useCompany();
  const { drivers, addTrip, editTrip } = useApp();

  const isEditing = !!initialData;

  // الحالات الافتراضية للنموذج
  const [formData, setFormData] = useState({
    driverId: '',
    tripDate: getTodayDateString(),
    tripTime: getCurrentTimeString(),
    durationMinutes: 30,
    cost: 50,
    status: 'new',
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    orderNumber: '',
    deliveryStatus: 'pending',
    actualDeliveryDate: '',
    actualDeliveryTime: '',
    recipientName: '',
    deliveryNotes: '',
    pendingReason: '',
    nextDeliveryDate: '',
    failureReason: '',
    returnDate: '',
    returnReason: '',
    paymentMethod: 'cash',
    paidAmount: 50,
    driverSettlementStatus: 'UNSETTLED',
    notes: '',
    adminNotes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تحديث الحقول عند الفتح أو التعديل
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        durationMinutes: initialData.durationMinutes || 30,
        paidAmount: initialData.paidAmount !== undefined ? initialData.paidAmount : initialData.cost,
        driverSettlementStatus: initialData.driverSettlementStatus ? initialData.driverSettlementStatus.toUpperCase() : 'UNSETTLED',
      });
    } else {
      const activeDrivers = drivers.filter(d => d.isActive);
      const defaultDriverId = activeDrivers.length > 0 ? activeDrivers[0].id : '';
      const initialDuration = 30;
      const initialCost = calculateTripCost(initialDuration, activeCompany?.pricingConfig);

      setFormData({
        driverId: defaultDriverId,
        tripDate: getTodayDateString(),
        tripTime: getCurrentTimeString(),
        durationMinutes: initialDuration,
        cost: initialCost,
        status: 'new',
        customerName: '',
        customerPhone: '',
        deliveryAddress: '',
        orderNumber: '',
        deliveryStatus: 'pending',
        actualDeliveryDate: '',
        actualDeliveryTime: '',
        recipientName: '',
        deliveryNotes: '',
        pendingReason: '',
        nextDeliveryDate: '',
        failureReason: '',
        returnDate: '',
        returnReason: '',
        paymentMethod: 'cash',
        paidAmount: initialCost,
        driverSettlementStatus: 'UNSETTLED',
        notes: '',
        adminNotes: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen, drivers, activeCompany]);

  // احتساب التكلفة تلقائياً عند تغيير المدة
  const handleDurationChange = (newMinutes) => {
    const mins = Math.max(1, parseInt(newMinutes, 10) || 0);
    const calculatedCost = calculateTripCost(mins, activeCompany?.pricingConfig);

    setFormData(prev => ({
      ...prev,
      durationMinutes: mins,
      cost: calculatedCost,
      // إذا كان المدفوع مساوياً للتكلفة السابقة، نحدثه تلقائياً
      paidAmount: prev.paidAmount === prev.cost ? calculatedCost : prev.paidAmount,
    }));
  };

  // التعامل مع تغيير حالة استلام الطلب
  const handleDeliveryStatusChange = (newStatus) => {
    setFormData(prev => {
      const updated = { ...prev, deliveryStatus: newStatus };
      if (newStatus === 'delivered') {
        if (!updated.actualDeliveryDate) updated.actualDeliveryDate = getTodayDateString();
        if (!updated.actualDeliveryTime) updated.actualDeliveryTime = getCurrentTimeString();
        if (updated.status === 'new') updated.status = 'completed';
      } else if (newStatus === 'returned') {
        if (!updated.returnDate) updated.returnDate = getTodayDateString();
      }
      return updated;
    });
  };

  const remainingAmount = Math.max(0, (Number(formData.cost) || 0) - (Number(formData.paidAmount) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateTripForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        await editTrip(initialData.id, formData);
      } else {
        await addTrip(formData);
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
      title={isEditing ? `تعديل المشوار ${formData.tripNumber || ''}` : 'تسجيل مشوار توصيل جديد'}
      subtitle={`الشركة: ${activeCompany?.name || ''}`}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ================= القسم الأول: معلومات المشوار ================= */}
        <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200/60 pb-2">
            <Truck className="w-4 h-4 text-brand-600" />
            <span>معلومات المشوار والتسعير</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* الموصل */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الموصل <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                className={`w-full text-xs rounded-xl border px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  errors.driverId ? 'border-rose-400' : 'border-slate-300'
                }`}
              >
                <option value="">-- اختر الموصل --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.isActive ? '' : '(معطل)'}
                  </option>
                ))}
              </select>
              {errors.driverId && <p className="text-[11px] text-rose-500 mt-1">{errors.driverId}</p>}
            </div>

            {/* تاريخ المشوار */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تاريخ المشوار <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tripDate}
                onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* وقت المشوار */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                وقت المشوار (توقيت الرياض) <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={formData.tripTime}
                onChange={(e) => setFormData({ ...formData, tripTime: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* مدة المشوار بالدقائق */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مدة المشوار بالدقائق <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDurationChange(Math.max(1, Number(formData.durationMinutes) - 5))}
                  className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.durationMinutes}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  className="w-full text-center text-xs font-bold rounded-xl border border-slate-300 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => handleDurationChange(Number(formData.durationMinutes) + 5)}
                  className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {errors.durationMinutes && <p className="text-[11px] text-rose-500 mt-1">{errors.durationMinutes}</p>}
            </div>

            {/* تكلفة المشوار (محسوبة تلقائياً) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تكلفة المشوار (محسوبة تلقائياً)
              </label>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-900 font-bold text-sm">
                <span>{formData.cost} ريال</span>
                <span className="text-[10px] text-brand-600 font-normal">وفق تسعيرة الشركة</span>
              </div>
            </div>

            {/* حالة سير المشوار */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                حالة المشوار التشغيلية
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="new">جديد</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
          </div>
        </div>

        {/* ================= القسم الثاني: معلومات العميل ================= */}
        <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200/60 pb-2">
            <User className="w-4 h-4 text-brand-600" />
            <span>بيانات العميل وموقع التوصيل</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم العميل <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="مثال: محمد بن ناصر"
                className={`w-full text-xs rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  errors.customerName ? 'border-rose-400' : 'border-slate-300'
                }`}
              />
              {errors.customerName && <p className="text-[11px] text-rose-500 mt-1">{errors.customerName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم جوال العميل (اختياري)
              </label>
              <input
                type="text"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white text-right focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الطلب (اختياري)
              </label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                placeholder="ORD-XXXX"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان التوصيل (اختياري)
              </label>
              <input
                type="text"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                placeholder="المدينة، الحي، اسم الشارع"
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* ================= القسم الثالث: حالة استلام الطلب ================= */}
        <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200/60 pb-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>حالة استلام الطلب من العميل (Delivery Confirmation)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                حالة استلام الطلب
              </label>
              <select
                value={formData.deliveryStatus}
                onChange={(e) => handleDeliveryStatusChange(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="pending">لم يتم التسليم (في الانتظار)</option>
                <option value="delivered">تم التسليم للعميل</option>
                <option value="failed">تعذر التسليم</option>
                <option value="returned">تم إرجاع الطلب</option>
              </select>
            </div>

            {/* حقول خاصة بحالة "تم التسليم" */}
            {formData.deliveryStatus === 'delivered' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم مستلم الطلب (اختياري)
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="شخصياً / القريب / الحارس"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ التسليم الفعلي
                  </label>
                  <input
                    type="date"
                    value={formData.actualDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, actualDeliveryDate: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وقت التسليم الفعلي
                  </label>
                  <input
                    type="time"
                    value={formData.actualDeliveryTime}
                    onChange={(e) => setFormData({ ...formData, actualDeliveryTime: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </>
            )}

            {/* حقول خاصة بحالة "لم يتم التسليم" */}
            {formData.deliveryStatus === 'pending' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سبب عدم التسليم
                  </label>
                  <select
                    value={formData.pendingReason}
                    onChange={(e) => setFormData({ ...formData, pendingReason: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">-- حدد السبب (إذا وجد) --</option>
                    {PENDING_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    موعد التسليم القادم المتوقع (اختياري)
                  </label>
                  <input
                    type="date"
                    value={formData.nextDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, nextDeliveryDate: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </>
            )}

            {/* حقول خاصة بحالة "تعذر التسليم" */}
            {formData.deliveryStatus === 'failed' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب تعذر التسليم
                </label>
                <input
                  type="text"
                  value={formData.failureReason}
                  onChange={(e) => setFormData({ ...formData, failureReason: e.target.value })}
                  placeholder="مثال: العنوان غير صالح أو العميل مسافر"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            {/* حقول خاصة بحالة "تم إرجاع الطلب" */}
            {formData.deliveryStatus === 'returned' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ الإرجاع للمستودع
                  </label>
                  <input
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سبب الإرجاع
                  </label>
                  <input
                    type="text"
                    value={formData.returnReason}
                    onChange={(e) => setFormData({ ...formData, returnReason: e.target.value })}
                    placeholder="مثال: البضاعة غير مطابقة أو رغبة العميل"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ================= القسم الرابع: المعلومات المالية ================= */}
        <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200/60 pb-2">
            <DollarSign className="w-4 h-4 text-brand-600" />
            <span>المعلومات المالية والتحصيل</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                طريقة الدفع
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ المدفوع (ريال)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: Math.max(0, Number(e.target.value)) })}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ المتبقي (ريال)
              </label>
              <div className={`px-3 py-2 rounded-xl border font-bold text-xs flex items-center justify-between ${
                remainingAmount > 0
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                <span>{remainingAmount} ريال</span>
                <span className="text-[10px] font-normal">
                  {remainingAmount > 0 ? 'متبقي للتحصيل' : 'تم السداد بالكامل'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= القسم الخامس: محاسبة الموصل ================= */}
        <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <ReceiptText className="w-4 h-4 text-emerald-600" />
              <span>حالة محاسبة الموصل</span>
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              منفصلة عن حالة تحصيل العميل والتسليم
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                formData.driverSettlementStatus === 'UNSETTLED'
                  ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30 text-amber-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="driverSettlementStatus"
                value="UNSETTLED"
                checked={formData.driverSettlementStatus === 'UNSETTLED'}
                onChange={(e) => setFormData({ ...formData, driverSettlementStatus: e.target.value })}
                className="mt-0.5 w-4 h-4 text-amber-600 focus:ring-amber-500"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900">غير محاسب (القيمة الافتراضية)</div>
                <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                  يُحسب المشوار كمستحق مالي للموصل لتتم تسويته لاحقاً عبر كشف الحساب
                </div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                formData.driverSettlementStatus === 'SETTLED'
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/30 text-emerald-950 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="driverSettlementStatus"
                value="SETTLED"
                checked={formData.driverSettlementStatus === 'SETTLED'}
                onChange={(e) => setFormData({ ...formData, driverSettlementStatus: e.target.value })}
                className="mt-0.5 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-emerald-800">محاسب (تمت التسوية)</div>
                <div className="text-[11px] text-slate-500 font-normal leading-relaxed">
                  يتم تسجيل المشوار كمسدد للموصل بتكلفة ({formData.cost || 0} ر.س) وتاريخ اليوم
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* ================= القسم السادس: الملاحظات ================= */}
        <div className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200/60 pb-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>ملاحظات المشوار والإدارة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ملاحظات المشوار (تظهر للموصل)
              </label>
              <textarea
                rows="2"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="تفاصيل الشحنة أو إرشادات الموقع..."
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ملاحظات الإدارة الداخلية
              </label>
              <textarea
                rows="2"
                value={formData.adminNotes}
                onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                placeholder="ملاحظات الحسابات والمتابعة..."
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-md shadow-brand-600/20 disabled:opacity-50"
          >
            {isSubmitting ? 'جارٍ الحفظ...' : isEditing ? 'تحديث المشوار' : 'حفظ المشوار'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
