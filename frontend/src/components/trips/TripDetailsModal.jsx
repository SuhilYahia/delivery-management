import React from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { useCompany } from '../../context/CompanyContext';
import {
  formatArabicDate,
  formatArabicTime,
} from '../../utils/dateUtils';
import {
  formatCurrency,
  formatDuration,
  TRIP_STATUS_CONFIG,
  DELIVERY_STATUS_CONFIG,
  PAYMENT_METHODS,
} from '../../utils/formatters';
import {
  Printer,
  Edit,
  Truck,
  User,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ReceiptText,
} from 'lucide-react';

export default function TripDetailsModal({
  isOpen,
  onClose,
  trip,
  onEdit,
}) {
  const { activeCompany } = useCompany();

  if (!trip) return null;

  const tripStatus = TRIP_STATUS_CONFIG[trip.status] || TRIP_STATUS_CONFIG.new;
  const deliveryStatus = DELIVERY_STATUS_CONFIG[trip.deliveryStatus] || DELIVERY_STATUS_CONFIG.pending;
  const paymentMethodObj = PAYMENT_METHODS.find(m => m.id === trip.paymentMethod);
  const paymentMethodLabel = paymentMethodObj ? paymentMethodObj.label : trip.paymentMethod;

  const cost = Number(trip.cost) || 0;
  const paid = Number(trip.paidAmount) || 0;
  const remaining = Math.max(0, cost - paid);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`تفاصيل المشوار: ${trip.tripNumber}`}
      subtitle={`الشركة: ${activeCompany?.name || ''}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* شريط الإجراءات العلوي للطباعة والتعديل */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">حالة المشوار:</span>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${tripStatus.bgClass}`}>
              {tripStatus.label}
            </span>
            <span className="text-xs text-slate-500 mr-2">حالة الاستلام:</span>
            <Badge variant={deliveryStatus.colorName} dot>
              {deliveryStatus.label}
            </Badge>
            <span className="text-xs text-slate-500 mr-2">محاسبة الموصل:</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border ${
              (trip.driverSettlementStatus || '').toUpperCase() === 'SETTLED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {(trip.driverSettlementStatus || '').toUpperCase() === 'SETTLED' ? 'محاسب' : 'غير محاسب'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              طباعة الإشعار
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(trip);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition shadow-2xs"
              >
                <Edit className="w-3.5 h-3.5" />
                تعديل البيانات
              </button>
            )}
          </div>
        </div>

        {/* شبكة تفاصيل المشوار */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* كرت الموصل والمشوار */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <Truck className="w-4 h-4 text-brand-600" />
              <span>معلومات النقل والموصل</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">الموصل المسؤول:</span>
                <span className="font-bold text-slate-800">{trip.driverName || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">تاريخ المشوار:</span>
                <span className="font-bold text-slate-800">{formatArabicDate(trip.tripDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">وقت الانطلاق:</span>
                <span className="font-bold text-slate-800">{formatArabicTime(trip.tripTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">مدة المشوار:</span>
                <span className="font-bold text-brand-700">{formatDuration(trip.durationMinutes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">تكلفة المشوار:</span>
                <span className="font-extrabold text-slate-900">{formatCurrency(trip.cost)}</span>
              </div>
            </div>
          </div>

          {/* كرت العميل والموقع */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-brand-600" />
              <span>بيانات العميل والشحنة</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">اسم العميل:</span>
                <span className="font-bold text-slate-800">{trip.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الجوال:</span>
                <span className="font-bold text-slate-800" dir="ltr">{trip.customerPhone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الطلب:</span>
                <span className="font-bold text-brand-600">{trip.orderNumber || '-'}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-500">عنوان التوصيل:</span>
                <span className="font-medium text-slate-800 text-left max-w-[60%]">{trip.deliveryAddress || 'العنوان الرئيسي'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* كرت حالة استلام الطلب من العميل */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>سجل نتيجة التسليم (Delivery Confirmation Lifecycle)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">النتيجة الحالية:</span>
              <Badge variant={deliveryStatus.colorName} size="lg" dot>
                {deliveryStatus.label}
              </Badge>
            </div>

            {trip.deliveryStatus === 'delivered' && (
              <>
                <div>
                  <span className="text-slate-500 block mb-1">تاريخ ووقت التسليم الفعلي:</span>
                  <span className="font-bold text-emerald-800">
                    {formatArabicDate(trip.actualDeliveryDate)} الساعة {formatArabicTime(trip.actualDeliveryTime)}
                  </span>
                </div>
                {trip.recipientName && (
                  <div>
                    <span className="text-slate-500 block mb-1">اسم مستلم الطلب:</span>
                    <span className="font-bold text-slate-800">{trip.recipientName}</span>
                  </div>
                )}
              </>
            )}

            {trip.deliveryStatus === 'pending' && trip.pendingReason && (
              <>
                <div>
                  <span className="text-slate-500 block mb-1">سبب عدم التسليم:</span>
                  <span className="font-bold text-amber-800">{trip.pendingReason}</span>
                </div>
                {trip.nextDeliveryDate && (
                  <div>
                    <span className="text-slate-500 block mb-1">موعد التسليم القادم المتوقع:</span>
                    <span className="font-bold text-slate-800">{formatArabicDate(trip.nextDeliveryDate)}</span>
                  </div>
                )}
              </>
            )}

            {trip.deliveryStatus === 'failed' && trip.failureReason && (
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-1">سبب تعذر التسليم:</span>
                <span className="font-bold text-rose-800">{trip.failureReason}</span>
              </div>
            )}

            {trip.deliveryStatus === 'returned' && (
              <>
                {trip.returnDate && (
                  <div>
                    <span className="text-slate-500 block mb-1">تاريخ الإرجاع للمستودع:</span>
                    <span className="font-bold text-slate-800">{formatArabicDate(trip.returnDate)}</span>
                  </div>
                )}
                {trip.returnReason && (
                  <div>
                    <span className="text-slate-500 block mb-1">سبب الإرجاع:</span>
                    <span className="font-bold text-slate-800">{trip.returnReason}</span>
                  </div>
                )}
              </>
            )}

            {trip.deliveryNotes && (
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-1">ملاحظات التسليم:</span>
                <span className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200 block">
                  {trip.deliveryNotes}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* كرت الحسابات المالية */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
            <DollarSign className="w-4 h-4 text-brand-600" />
            <span>الموقف المالي للمشوار</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50">
              <span className="text-[11px] text-slate-500 block mb-1">تكلفة المشوار</span>
              <span className="text-sm font-extrabold text-slate-900">{formatCurrency(cost)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <span className="text-[11px] text-slate-500 block mb-1">طريقة الدفع</span>
              <span className="text-sm font-bold text-brand-700">{paymentMethodLabel}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800">
              <span className="text-[11px] text-emerald-600 block mb-1">المبلغ المدفوع</span>
              <span className="text-sm font-extrabold">{formatCurrency(paid)}</span>
            </div>
            <div className={`p-3 rounded-xl ${remaining > 0 ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-700'}`}>
              <span className="text-[11px] block mb-1">{remaining > 0 ? 'المتبقي للتحصيل' : 'حالة الحساب'}</span>
              <span className="text-sm font-extrabold">{remaining > 0 ? formatCurrency(remaining) : 'مسدد بالكامل'}</span>
            </div>
          </div>
        </div>

        {/* كرت محاسبة الموصل وتسوية المشوار */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <ReceiptText className="w-4 h-4 text-emerald-600" />
              <span>محاسبة الموصل وتصفية الأجر</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              (trip.driverSettlementStatus || '').toUpperCase() === 'SETTLED'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {(trip.driverSettlementStatus || '').toUpperCase() === 'SETTLED' ? 'تمت المحاسبة' : 'غير محاسب (مستحق للموصل)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block mb-0.5 text-[11px]">أجر المشوار للموصل:</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(trip.cost)}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block mb-0.5 text-[11px]">تاريخ المحاسبة / التسوية:</span>
              <span className="font-bold text-slate-800">
                {trip.settledAt ? formatArabicDate(trip.settledAt) : 'لم تتم التسوية بعد'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block mb-0.5 text-[11px]">رقم سند التسوية:</span>
              <span className="font-mono font-bold text-slate-800">
                {trip.settlementNumber || trip.settlement?.settlementNumber || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* الملاحظات الإدارية والعامة */}
        {(trip.notes || trip.adminNotes) && (
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
            {trip.notes && (
              <div>
                <span className="font-bold text-slate-700">ملاحظات المشوار: </span>
                <span className="text-slate-600">{trip.notes}</span>
              </div>
            )}
            {trip.adminNotes && (
              <div>
                <span className="font-bold text-slate-700">ملاحظات الإدارة: </span>
                <span className="text-slate-600">{trip.adminNotes}</span>
              </div>
            )}
          </div>
        )}

        {/* الإغلاق */}
        <div className="flex justify-end pt-3 border-t border-slate-200 no-print">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
}
