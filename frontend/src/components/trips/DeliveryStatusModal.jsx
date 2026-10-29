import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { getTodayDateString, getCurrentTimeString } from '../../utils/dateUtils';
import { PENDING_REASONS } from '../../utils/formatters';
import { CheckCircle2, AlertCircle, RotateCcw, Clock } from 'lucide-react';

export default function DeliveryStatusModal({
  isOpen,
  onClose,
  trip,
}) {
  const { changeDeliveryStatus } = useApp();

  const [deliveryStatus, setDeliveryStatus] = useState('delivered');
  const [actualDeliveryDate, setActualDeliveryDate] = useState('');
  const [actualDeliveryTime, setActualDeliveryTime] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [pendingReason, setPendingReason] = useState('');
  const [nextDeliveryDate, setNextDeliveryDate] = useState('');

  const [failureReason, setFailureReason] = useState('');

  const [returnDate, setReturnDate] = useState('');
  const [returnReason, setReturnReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (trip) {
      setDeliveryStatus(trip.deliveryStatus || 'delivered');
      setActualDeliveryDate(trip.actualDeliveryDate || getTodayDateString());
      setActualDeliveryTime(trip.actualDeliveryTime || getCurrentTimeString());
      setRecipientName(trip.recipientName || '');
      setDeliveryNotes(trip.deliveryNotes || '');
      setPendingReason(trip.pendingReason || '');
      setNextDeliveryDate(trip.nextDeliveryDate || '');
      setFailureReason(trip.failureReason || '');
      setReturnDate(trip.returnDate || getTodayDateString());
      setReturnReason(trip.returnReason || '');
    }
  }, [trip, isOpen]);

  if (!trip) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        deliveryStatus,
        deliveryNotes,
        ...(deliveryStatus === 'delivered' ? {
          actualDeliveryDate,
          actualDeliveryTime,
          recipientName,
        } : {}),
        ...(deliveryStatus === 'pending' ? {
          pendingReason,
          nextDeliveryDate,
        } : {}),
        ...(deliveryStatus === 'failed' ? {
          failureReason,
        } : {}),
        ...(deliveryStatus === 'returned' ? {
          returnDate,
          returnReason,
        } : {}),
      };

      await changeDeliveryStatus(trip.id, payload);
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
      title="تحديث حالة استلام الطلب من العميل"
      subtitle={`المشوار: ${trip.tripNumber} | العميل: ${trip.customerName}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* أزرار اختيار الحالة السريعة */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setDeliveryStatus('delivered')}
            className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
              deliveryStatus === 'delivered'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs">تم التسليم</span>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryStatus('pending')}
            className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
              deliveryStatus === 'pending'
                ? 'bg-amber-50 border-amber-500 text-amber-800 font-bold ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="text-xs">لم يتم التسليم</span>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryStatus('failed')}
            className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
              deliveryStatus === 'failed'
                ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold ring-2 ring-rose-500/20'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span className="text-xs">تعذر التسليم</span>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryStatus('returned')}
            className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
              deliveryStatus === 'returned'
                ? 'bg-slate-100 border-slate-500 text-slate-800 font-bold ring-2 ring-slate-500/20'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <RotateCcw className="w-5 h-5 text-slate-600" />
            <span className="text-xs">تم إرجاع الطلب</span>
          </button>
        </div>

        {/* الحقول الديناميكية حسب الحالة */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
          {deliveryStatus === 'delivered' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ التسليم الفعلي
                  </label>
                  <input
                    type="date"
                    value={actualDeliveryDate}
                    onChange={(e) => setActualDeliveryDate(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وقت التسليم الفعلي
                  </label>
                  <input
                    type="time"
                    value={actualDeliveryTime}
                    onChange={(e) => setActualDeliveryTime(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم مستلم الطلب (اختياري)
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="مثال: العميل شخصياً / الأخ"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
                />
              </div>
            </div>
          )}

          {deliveryStatus === 'pending' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب عدم التسليم
                </label>
                <select
                  value={pendingReason}
                  onChange={(e) => setPendingReason(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="">-- اختر السبب --</option>
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
                  value={nextDeliveryDate}
                  onChange={(e) => setNextDeliveryDate(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
                />
              </div>
            </div>
          )}

          {deliveryStatus === 'failed' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سبب تعذر التسليم
              </label>
              <textarea
                rows="2"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                placeholder="وضح سبب تعذر التسليم (العنوان غير صالح، تعذر الوصول، إلخ)..."
                required
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white"
              />
            </div>
          )}

          {deliveryStatus === 'returned' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ الإرجاع
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب الإرجاع للمستودع
                </label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="مثال: رفض العميل بسبب مقاسات غير ملائمة"
                  required
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
                />
              </div>
            </div>
          )}

          {/* ملاحظات عامة حول الاستلام */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات إضافية حول الاستلام (اختياري)
            </label>
            <input
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="أي تفاصيل خاصة بالتسليم أو الاتصال..."
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
            />
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
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
            className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'جارٍ الحفظ...' : 'تأكيد وحفظ الحالة'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
