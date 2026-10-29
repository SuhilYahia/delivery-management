import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import ConfirmDialog from '../common/ConfirmDialog';
import { useCompany } from '../../context/CompanyContext';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import {
  formatCurrency,
  formatDuration,
  formatPercentage,
  TRIP_STATUS_CONFIG,
  DELIVERY_STATUS_CONFIG,
  PAYMENT_METHODS,
} from '../../utils/formatters';
import {
  formatArabicDate,
  formatArabicTime,
  getTodayDateString,
  getDateRangePreset,
} from '../../utils/dateUtils';
import { exportToCSV } from '../../utils/csvExport';
import {
  ReceiptText,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Printer,
  Download,
  Filter,
  CheckSquare,
  Square,
  History,
  FileSpreadsheet,
  RotateCcw,
  User,
  Truck,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function DriverStatementModal({
  isOpen,
  onClose,
  driver,
  onSettled,
}) {
  const { activeCompany } = useCompany();
  const { showToast, refreshData } = useApp();

  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'history'

  // فلاتر كشف الحساب
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNSETTLED' | 'SETTLED'

  // البيانات
  const [statement, setStatement] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // المشاوير المحددة للتسوية الجماعية
  const [selectedTripIds, setSelectedTripIds] = useState([]);
  const [settlementDate, setSettlementDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // السجل المفتوح بالتفاصيل
  const [expandedSettlementId, setExpandedSettlementId] = useState(null);

  // جلب كشف الحساب من الـ Backend
  const loadStatement = async () => {
    if (!driver?.id) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await api.getDriverStatement(driver.id, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter,
      });
      setStatement(data);
      // تصفير التحديدات التي لم تعد مطابقة
      setSelectedTripIds([]);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'تعذر تحميل كشف حساب الموصل');
    } finally {
      setLoading(false);
    }
  };

  // جلب سجل التسويات السابقة
  const loadHistory = async () => {
    if (!driver?.id) return;
    try {
      const data = await api.getSettlementHistory(driver.id);
      setHistory(data || []);
    } catch (err) {
      console.error('فشل جلب سجل التسويات:', err);
    }
  };

  useEffect(() => {
    if (isOpen && driver?.id) {
      loadStatement();
      loadHistory();
      setSelectedTripIds([]);
      setSettlementDate(getTodayDateString());
    }
  }, [isOpen, driver?.id, startDate, endDate, statusFilter]);

  // المشاوير المتاحة للتسوية (غير المحاسبة فقط)
  const unsettledTrips = useMemo(() => {
    if (!statement?.trips) return [];
    return statement.trips.filter((t) => (t.driverSettlementStatus || '').toUpperCase() !== 'SETTLED');
  }, [statement]);

  // احتساب إجمالي المبلغ للمشاوير المحددة حالياً
  const selectedTotalAmount = useMemo(() => {
    if (!statement?.trips) return 0;
    return statement.trips
      .filter((t) => selectedTripIds.includes(t.id))
      .reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
  }, [statement, selectedTripIds]);

  // تبديل اختيار مشوار فردي
  const handleToggleTrip = (tripId) => {
    setSelectedTripIds((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId]
    );
  };

  // تحديد / إلغاء تحديد جميع المشاوير غير المحاسبة
  const handleToggleSelectAll = () => {
    if (selectedTripIds.length === unsettledTrips.length && unsettledTrips.length > 0) {
      setSelectedTripIds([]);
    } else {
      setSelectedTripIds(unsettledTrips.map((t) => t.id));
    }
  };

  // تطبيق فترات سريعة
  const handleApplyPreset = (presetKey) => {
    if (presetKey === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    const p = getDateRangePreset(presetKey);
    setStartDate(p.startDate);
    setEndDate(p.endDate);
  };

  // تنفيذ التسوية الجماعية للمشاوير المحددة
  const handleExecuteSettlement = async () => {
    if (selectedTripIds.length === 0) return;

    try {
      setIsSubmitting(true);
      const res = await api.settleDriverTrips({
        driverId: driver.id,
        tripIds: selectedTripIds,
        settledAt: settlementDate || undefined,
        paymentMethod,
        reference: reference || null,
        notes: notes || null,
      });

      showToast(`تمت محاسبة الموصل وتسجيل التسوية بنجاح بمبلغ ${selectedTotalAmount} ر.س`, 'success');
      setConfirmModalOpen(false);
      setSelectedTripIds([]);
      setNotes('');
      setReference('');

      // إعادة تحميل كشف الحساب والسجل وتحديث البيانات العامة
      await Promise.all([loadStatement(), loadHistory(), refreshData()]);
      if (onSettled) onSettled();
    } catch (err) {
      showToast(err.message || 'فشل تسجيل تسوية الموصل', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // تصدير الكشف إلى Excel / CSV
  const handleExportCSV = () => {
    if (!statement?.trips || statement.trips.length === 0) {
      showToast('لا توجد مشاوير لتصديرها', 'warning');
      return;
    }

    const cols = [
      { key: 'tripNumber', label: 'رقم المشوار' },
      { key: 'orderNumber', label: 'رقم الطلب' },
      { key: 'customerName', label: 'اسم العميل' },
      { key: 'customerPhone', label: 'جوال العميل' },
      { key: 'deliveryAddress', label: 'عنوان التوصيل' },
      { key: 'tripDate', label: 'تاريخ المشوار' },
      { key: 'tripTime', label: 'الوقت' },
      { key: 'durationMinutes', label: 'المدة بالدقائق' },
      { key: 'cost', label: 'أجر/تكلفة المشوار (ر.س)' },
      {
        key: 'driverSettlementStatus',
        label: 'حالة محاسبة الموصل',
        formatter: (val) => (val === 'SETTLED' ? 'محاسب' : 'غير محاسب'),
      },
      { key: 'settledAt', label: 'تاريخ التسوية', formatter: (val) => val || '-' },
      { key: 'settlementNumber', label: 'رقم سند التسوية' },
      {
        key: 'deliveryStatus',
        label: 'حالة تسليم الطلب',
        formatter: (val) => DELIVERY_STATUS_CONFIG[val]?.label || val,
      },
    ];

    exportToCSV(
      statement.trips,
      cols,
      `كشف-حساب-الموصل-${driver.name}-${startDate || 'البداية'}-إلى-${endDate || 'اليوم'}`
    );
  };

  // طباعة كشف الحساب
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !driver) return null;

  const summary = statement?.summary || {
    totalTrips: 0,
    totalTripsCost: 0,
    totalSettledAmount: 0,
    totalUnsettledDues: 0,
    settledTripsCount: 0,
    unsettledTripsCount: 0,
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`كشف حساب الموصل: ${driver.name}`}
        subtitle={`الشركة: ${activeCompany?.name || ''} | جوال: ${driver.phone || '-'}`}
        maxWidth="max-w-5xl"
      >
        <div className="space-y-5">
          {/* ================= شريط الإجراءات والتبويبات ================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 no-print">
            {/* التبويبات */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('statement')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'statement'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ReceiptText className="w-3.5 h-3.5" />
                <span>كشف الحساب والمشاوير</span>
                {unsettledTrips.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-100 text-amber-800 font-extrabold">
                    {unsettledTrips.length} مستحق
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'history'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>سجل التسويات السابقة ({history.length})</span>
              </button>
            </div>

            {/* أزرار الطباعة والتصدير */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs"
                title="طباعة كشف الحساب"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>طباعة</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
                title="تصدير إلى Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>تصدير Excel</span>
              </button>
            </div>
          </div>

          {/* ================= بطاقات المؤشرات المالية الأربعة ================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* إجمالي تكاليف المشاوير */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1 font-bold">
                <span>إجمالي تكاليف المشاوير</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {formatCurrency(summary.totalTripsCost)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {summary.totalTrips} مشوار في الفترة
              </div>
            </div>

            {/* المبالغ المحاسب عليها (المسددة) */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-700 text-[11px] mb-1 font-bold">
                <span>المبالغ المسددة (المحاسب عليها)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-black text-emerald-800">
                {formatCurrency(summary.totalSettledAmount)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-1 font-medium">
                {summary.settledTripsCount} مشوار تمت تسويته
              </div>
            </div>

            {/* المستحقات غير المسددة */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 shadow-2xs">
              <div className="flex items-center justify-between text-amber-800 text-[11px] mb-1 font-bold">
                <span>المستحقات غير المسددة</span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg font-black text-amber-900">
                {formatCurrency(summary.totalUnsettledDues)}
              </div>
              <div className="text-[10px] text-amber-800 mt-1 font-bold">
                {summary.unsettledTripsCount} مشوار بانتظار التسوية
              </div>
            </div>

            {/* نسبة التصفية والتسوية */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-300 text-[11px] mb-1 font-bold">
                <span>نسبة المحاسبة</span>
                <ReceiptText className="w-4 h-4 text-brand-400" />
              </div>
              <div className="text-lg font-black text-brand-300">
                {summary.totalTripsCost > 0
                  ? formatPercentage((summary.totalSettledAmount / summary.totalTripsCost) * 100)
                  : '100%'}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      summary.totalTripsCost > 0
                        ? Math.min(100, (summary.totalSettledAmount / summary.totalTripsCost) * 100)
                        : 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {activeTab === 'statement' ? (
            <>
              {/* ================= شريط الفلترة الزمنية وحالة المحاسبة ================= */}
              <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 space-y-2.5 no-print">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* الفترات السريعة */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-bold ml-1">الفترة:</span>
                    <button
                      onClick={() => handleApplyPreset('today')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700"
                    >
                      اليوم
                    </button>
                    <button
                      onClick={() => handleApplyPreset('thisWeek')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700"
                    >
                      هذا الأسبوع
                    </button>
                    <button
                      onClick={() => handleApplyPreset('thisMonth')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700"
                    >
                      هذا الشهر
                    </button>
                    <button
                      onClick={() => handleApplyPreset('all')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700"
                    >
                      الكل
                    </button>
                  </div>

                  {/* تواريخ مخصصة */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">من:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1 bg-white text-[11px]"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">إلى:</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1 bg-white text-[11px]"
                      />
                    </div>
                  </div>

                  {/* فلتر حالة المحاسبة */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setStatusFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        statusFilter === 'ALL'
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      جميع المشاوير
                    </button>
                    <button
                      onClick={() => setStatusFilter('UNSETTLED')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        statusFilter === 'UNSETTLED'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      غير المحاسبة فقط
                    </button>
                    <button
                      onClick={() => setStatusFilter('SETTLED')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        statusFilter === 'SETTLED'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      المحاسبة فقط
                    </button>
                  </div>
                </div>
              </div>

              {/* ================= شريط تسوية المشاوير المحددة (دفعة واحدة) ================= */}
              {selectedTripIds.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 shadow-md animate-fade-in no-print">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-black text-emerald-950">
                          تسجيل محاسبة وتصفية المشاوير المحددة
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-200 text-emerald-900">
                          {selectedTripIds.length} مشوار محدد
                        </span>
                      </div>
                      <div className="text-xs text-emerald-800">
                        إجمالي المبلغ المستحق تسويته دفعة واحدة للموصل:{' '}
                        <span className="font-black text-emerald-950 text-sm">
                          {formatCurrency(selectedTotalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* تاريخ التسوية */}
                      <input
                        type="date"
                        value={settlementDate}
                        onChange={(e) => setSettlementDate(e.target.value)}
                        className="rounded-xl border border-emerald-300 px-3 py-1.5 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                        title="تاريخ التسوية"
                      />

                      {/* طريقة السداد */}
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="rounded-xl border border-emerald-300 px-3 py-1.5 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value="CASH">نقدًا (كاش)</option>
                        <option value="BANK_TRANSFER">تحويل بنكي</option>
                        <option value="CARD">بطاقة بنكية</option>
                        <option value="OTHER">أخرى</option>
                      </select>

                      {/* زر تأكيد التسوية */}
                      <button
                        onClick={() => setConfirmModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition hover:scale-102"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>محاسبة الموصل وتسجيل التسوية ({formatCurrency(selectedTotalAmount)})</span>
                      </button>

                      <button
                        onClick={() => setSelectedTripIds([])}
                        className="px-2.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= جدول تفاصيل مشاوير كشف الحساب ================= */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-3 text-center w-10 no-print">
                          <button
                            onClick={handleToggleSelectAll}
                            disabled={unsettledTrips.length === 0}
                            className="p-1 text-slate-600 hover:text-emerald-600 disabled:opacity-30"
                            title={
                              selectedTripIds.length === unsettledTrips.length && unsettledTrips.length > 0
                                ? 'إلغاء تحديد الكل'
                                : 'تحديد جميع المشاوير غير المحاسبة'
                            }
                          >
                            {selectedTripIds.length === unsettledTrips.length && unsettledTrips.length > 0 ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </th>
                        <th className="py-3 px-4">رقم المشوار</th>
                        <th className="py-3 px-4">العميل والطلب</th>
                        <th className="py-3 px-4">تاريخ ووقت المشوار</th>
                        <th className="py-3 px-4">المدة والتكلفة</th>
                        <th className="py-3 px-4">حالة الاستلام</th>
                        <th className="py-3 px-4">حالة المحاسبة</th>
                        <th className="py-3 px-4">تاريخ التسوية</th>
                        <th className="py-3 px-4">سند التسوية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan="9" className="py-12 text-center text-slate-400">
                            جاري تحميل بيانات كشف الحساب...
                          </td>
                        </tr>
                      ) : !statement?.trips || statement.trips.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-12">
                            <EmptyState
                              title="لا توجد مشاوير في هذه الفترة"
                              description="لم يتم تسجيل أي مشاوير لهذا الموصل وفق الفلاتر الزمنية المحددة."
                            />
                          </td>
                        </tr>
                      ) : (
                        statement.trips.map((trip) => {
                          const isSettled = (trip.driverSettlementStatus || '').toUpperCase() === 'SETTLED';
                          const isSelected = selectedTripIds.includes(trip.id);
                          const deliveryStatus =
                            DELIVERY_STATUS_CONFIG[trip.deliveryStatus] || DELIVERY_STATUS_CONFIG.pending;

                          return (
                            <tr
                              key={trip.id}
                              className={`transition-colors ${
                                isSelected
                                  ? 'bg-emerald-50/60'
                                  : isSettled
                                  ? 'bg-white hover:bg-slate-50/60'
                                  : 'bg-amber-50/20 hover:bg-amber-50/40'
                              }`}
                            >
                              <td className="py-3 px-3 text-center no-print">
                                {isSettled ? (
                                  <span title="مشوار تمت محاسبته مسبقاً ولا يمكن تكراره">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleToggleTrip(trip.id)}
                                    className="p-1 hover:scale-110 transition"
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                      <Square className="w-4 h-4 text-amber-500" />
                                    )}
                                  </button>
                                )}
                              </td>

                              <td className="py-3 px-4 font-black text-brand-700">
                                {trip.tripNumber}
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{trip.customerName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {trip.orderNumber || '-'}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-slate-700">
                                <div className="font-medium">{formatArabicDate(trip.tripDate)}</div>
                                <div className="text-[10px] text-slate-400">
                                  {formatArabicTime(trip.tripTime)}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-extrabold text-slate-900 text-sm">
                                  {formatCurrency(trip.cost)}
                                </div>
                                <div className="text-[10px] text-brand-600 font-medium">
                                  {formatDuration(trip.durationMinutes)}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <Badge variant={deliveryStatus.colorName} size="sm" dot>
                                  {deliveryStatus.label}
                                </Badge>
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                    isSettled
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isSettled ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                  />
                                  {isSettled ? 'محاسب' : 'غير محاسب'}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-slate-600 text-[11px]">
                                {trip.settledAt ? formatArabicDate(trip.settledAt) : '-'}
                              </td>

                              <td className="py-3 px-4 font-mono font-bold text-slate-700 text-[11px]">
                                {trip.settlementNumber || '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* ================= تبويب سجل التسويات السابقة ================= */
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="py-12 bg-white rounded-2xl border border-slate-200">
                  <EmptyState
                    title="لا توجد تسويات سابقة مسجلة"
                    description="عند تسوية المشاوير غير المحاسبة للموصل، ستظهر السجلات والتفاصيل هنا."
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((stl) => {
                    const isExpanded = expandedSettlementId === stl.id;
                    const paymentObj = PAYMENT_METHODS.find(
                      (m) => m.id.toLowerCase() === (stl.paymentMethod || '').toLowerCase()
                    );

                    return (
                      <div
                        key={stl.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                              <ReceiptText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-slate-900 text-sm">
                                  {stl.settlementNumber}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {stl.tripCount} مشوار مشمول
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                تاريخ التسوية: <span className="font-bold text-slate-700">{formatArabicDate(stl.settledAt)}</span> | بواسطة: {stl.createdByName}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <div className="text-left sm:text-right">
                              <div className="text-xs text-slate-400 font-bold">إجمالي المبلغ المسدد</div>
                              <div className="text-base font-black text-emerald-700">
                                {formatCurrency(stl.totalAmount)}
                              </div>
                            </div>

                            <button
                              onClick={() => setExpandedSettlementId(isExpanded ? null : stl.id)}
                              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-slate-600"
                              title={isExpanded ? 'إخفاء المشاوير المشمولة' : 'عرض المشاوير المشمولة'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* تفاصيل الملاحظات وطريقة الدفع إن وجدت */}
                        <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-100 text-slate-600">
                          <div>
                            طريقة السداد:{' '}
                            <span className="font-bold text-slate-800">
                              {paymentObj ? paymentObj.label : stl.paymentMethod}
                            </span>
                          </div>
                          {stl.reference && (
                            <div>
                              المرجع/رقم الحوالة:{' '}
                              <span className="font-mono font-bold text-slate-800">{stl.reference}</span>
                            </div>
                          )}
                          {stl.notes && (
                            <div className="text-slate-500 italic">
                              ملاحظات: {stl.notes}
                            </div>
                          )}
                        </div>

                        {/* قائمة المشاوير المشمولة في هذه التسوية عند التوسيع */}
                        {isExpanded && stl.trips && stl.trips.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-200/80 bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-b-2xl">
                            <div className="text-xs font-bold text-slate-800 mb-2">
                              المشاوير المشمولة في سند التسوية هذا:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {stl.trips.map((t) => (
                                <div
                                  key={t.id}
                                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex justify-between items-center"
                                >
                                  <div>
                                    <div className="font-bold text-brand-700">{t.tripNumber}</div>
                                    <div className="text-[10px] text-slate-500">{t.customerName}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-extrabold text-slate-900">{formatCurrency(t.cost)}</div>
                                    <div className="text-[10px] text-slate-400">{formatArabicDate(t.tripDate)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* زر الإغلاق السفلي */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-200 no-print">
            <div className="text-xs text-slate-500">
              الموصل: <span className="font-bold text-slate-800">{driver.name}</span> | نوع المركبة: {driver.vehicleType || 'مركبة نقل'}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      </Modal>

      {/* مودال تأكيد التسوية الجماعية */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleExecuteSettlement}
        title="تأكيد محاسبة الموصل وتسجيل التسوية"
        message={`هل أنت متأكد من تسجيل تسوية لـ (${selectedTripIds.length}) مشوار للموصل "${driver.name}" بإجمالي مبلغ (${formatCurrency(selectedTotalAmount)})؟ سيتم تثبيت المشاوير كـ «محاسب» ولن يمكن محاسبتها مرة أخرى.`}
        confirmLabel="نعم، تسجيل التسوية الآن"
        cancelLabel="إلغاء"
        variant="primary"
        isLoading={isSubmitting}
      />
    </>
  );
}
