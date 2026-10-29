import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { useApp } from '../context/AppContext';
import ReportFilterBar from '../components/reports/ReportFilterBar';
import PrintHeader from '../components/reports/PrintHeader';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import TripDetailsModal from '../components/trips/TripDetailsModal';
import DriverStatementModal from '../components/drivers/DriverStatementModal';
import {
  calculateTripSummaryStats,
  aggregateTripsByDay,
  getDeliveryStatusDistribution,
  aggregateDriverComparison,
} from '../utils/reportUtils';
import {
  formatCurrency,
  formatDuration,
  formatPercentage,
  TRIP_STATUS_CONFIG,
  DELIVERY_STATUS_CONFIG,
  PAYMENT_METHODS,
} from '../utils/formatters';
import {
  formatArabicDate,
  formatArabicTime,
  isDateInRange,
  getDateRangePreset,
} from '../utils/dateUtils';
import { exportToCSV } from '../utils/csvExport';
import {
  BarChart3,
  Users,
  Calendar,
  CheckCircle2,
  DollarSign,
  ArrowUpDown,
  Eye,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Clock,
  Printer,
  Download,
  Wallet,
  ReceiptText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeCompany } = useCompany();
  const { trips, drivers } = useApp();

  // نوع التقرير المختار عبر Tabs
  const currentTab = searchParams.get('tab') || 'all_drivers';
  const paramDriverId = searchParams.get('driverId') || '';

  // حالة الفلاتر
  const initialPreset = getDateRangePreset('last30days');
  const [filters, setFilters] = useState({
    datePreset: 'last30days',
    startDate: initialPreset.startDate,
    endDate: initialPreset.endDate,
    driverId: paramDriverId || '',
    tripStatus: '',
    deliveryStatus: '',
  });

  const [sortField, setSortField] = useState('totalTrips');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewingTrip, setViewingTrip] = useState(null);
  const [statementDriver, setStatementDriver] = useState(null);
  const [includeCancelledInFinance, setIncludeCancelledInFinance] = useState(false);

  // تحديث الـ Tab
  const setTab = (tabId, extraParams = {}) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabId);
    if (extraParams.driverId !== undefined) {
      if (extraParams.driverId) {
        params.set('driverId', extraParams.driverId);
        setFilters(f => ({ ...f, driverId: extraParams.driverId }));
      } else {
        params.delete('driverId');
        setFilters(f => ({ ...f, driverId: '' }));
      }
    }
    setSearchParams(params);
  };

  // تصفية المشاوير بناءً على الفلاتر النشطة (الفترة الزمنية، الموصل، الحالة)
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      // 1. فلتر التاريخ
      if (filters.startDate || filters.endDate) {
        if (!isDateInRange(trip.tripDate, filters.startDate, filters.endDate)) {
          return false;
        }
      }

      // 2. فلتر الموصل (إذا كان التقرير لموصل محدد أو تم تحديده بالفلاتر)
      if (filters.driverId && trip.driverId !== filters.driverId) {
        return false;
      }

      // 3. فلتر حالة المشوار
      if (filters.tripStatus && trip.status !== filters.tripStatus) {
        return false;
      }

      // 4. فلتر حالة الاستلام
      if (filters.deliveryStatus && trip.deliveryStatus !== filters.deliveryStatus) {
        return false;
      }

      return true;
    });
  }, [trips, filters]);

  // الإحصائيات الشاملة للمشاوير المفلترة
  const stats = useMemo(() => {
    return calculateTripSummaryStats(filteredTrips, includeCancelledInFinance);
  }, [filteredTrips, includeCancelledInFinance]);

  // إحصائيات مقارنة الموصلين
  const driverComparison = useMemo(() => {
    return aggregateDriverComparison(filteredTrips, drivers).sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredTrips, drivers, sortField, sortOrder]);

  // حساب تقرير مستحقات الموصلين
  const driverDuesData = useMemo(() => {
    const targetDrivers = filters.driverId ? drivers.filter(d => d.id === filters.driverId) : drivers;
    const list = targetDrivers.map(d => {
      const driverTrips = filteredTrips.filter(t => t.driverId === d.id);
      const totalTrips = driverTrips.length;
      const totalCost = driverTrips.reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
      const settledTrips = driverTrips.filter(t => (t.driverSettlementStatus || '').toUpperCase() === 'SETTLED');
      const settledAmount = settledTrips.reduce((sum, t) => sum + (t.settlementAmount ? Number(t.settlementAmount) : (Number(t.cost) || 0)), 0);
      const unsettledTrips = driverTrips.filter(t => (t.driverSettlementStatus || '').toUpperCase() !== 'SETTLED');
      const unsettledAmount = unsettledTrips.reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
      const settlementPercentage = totalCost > 0 ? Math.round((settledAmount / totalCost) * 100) : 100;

      return {
        rawDriver: d,
        driverId: d.id,
        driverName: d.name,
        driverPhone: d.phone,
        vehicleType: d.vehicleType,
        totalTrips,
        totalCost,
        settledAmount,
        unsettledAmount,
        settledCount: settledTrips.length,
        unsettledCount: unsettledTrips.length,
        settlementPercentage,
      };
    });

    const summary = list.reduce(
      (acc, item) => ({
        totalTrips: acc.totalTrips + item.totalTrips,
        totalCost: acc.totalCost + item.totalCost,
        totalSettled: acc.totalSettled + item.settledAmount,
        totalRemaining: acc.totalRemaining + item.unsettledAmount,
      }),
      { totalTrips: 0, totalCost: 0, totalSettled: 0, totalRemaining: 0 }
    );

    return { list, summary };
  }, [drivers, filteredTrips, filters.driverId]);

  // بيانات الرسوم البيانية للتقرير
  const dailyChartData = useMemo(() => aggregateTripsByDay(filteredTrips), [filteredTrips]);
  const statusPieData = useMemo(() => getDeliveryStatusDistribution(filteredTrips), [filteredTrips]);

  // موصل محدد للتقرير التفصيلي
  const selectedDriver = drivers.find(d => d.id === filters.driverId) || drivers[0];

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    const range = getDateRangePreset('last30days');
    setFilters({
      datePreset: 'last30days',
      startDate: range.startDate,
      endDate: range.endDate,
      driverId: '',
      tripStatus: '',
      deliveryStatus: '',
    });
    setTab('driver_dues', { driverId: '' });
  };

  // تصدير CSV حسب التقرير الحالي
  const handleExportCSV = () => {
    if (currentTab === 'driver_dues') {
      const cols = [
        { key: 'driverName', label: 'اسم الموصل' },
        { key: 'driverPhone', label: 'رقم الجوال' },
        { key: 'vehicleType', label: 'نوع المركبة' },
        { key: 'totalTrips', label: 'إجمالي المشاوير' },
        { key: 'totalCost', label: 'إجمالي التكاليف (ر.س)' },
        { key: 'settledAmount', label: 'المبالغ المسددة (ر.س)' },
        { key: 'unsettledAmount', label: 'المستحقات المتبقية (ر.س)' },
        { key: 'settledCount', label: 'المشاوير المحاسبة' },
        { key: 'unsettledCount', label: 'المشاوير غير المحاسبة' },
        { key: 'settlementPercentage', label: 'نسبة التسوية', formatter: (v) => `${v}%` },
      ];
      exportToCSV(driverDuesData.list, cols, `تقرير-مستحقات-الموصلين-${activeCompany?.name}`);
      return;
    }

    if (currentTab === 'all_drivers') {
      const cols = [
        { key: 'driverName', label: 'اسم الموصل' },
        { key: 'driverPhone', label: 'رقم الجوال' },
        { key: 'totalTrips', label: 'إجمالي المشاوير' },
        { key: 'deliveredCount', label: 'تم تسليمها' },
        { key: 'pendingCount', label: 'لم تُسلّم' },
        { key: 'failedCount', label: 'تعذر التسليم' },
        { key: 'returnedCount', label: 'تم الإرجاع' },
        { key: 'totalCost', label: 'إجمالي التكاليف (ر.س)' },
        { key: 'avgCost', label: 'متوسط تكلفة المشوار (ر.س)', formatter: (v) => v ? v.toFixed(2) : '0' },
        { key: 'successRate', label: 'نسبة نجاح التسليم', formatter: (v) => formatPercentage(v) },
      ];
      exportToCSV(driverComparison, cols, `تقرير-أداء-الموصلين-${activeCompany?.name}`);
    } else {
      const cols = [
        { key: 'tripNumber', label: 'رقم المشوار' },
        { key: 'tripDate', label: 'تاريخ المشوار' },
        { key: 'driverName', label: 'اسم الموصل' },
        { key: 'customerName', label: 'اسم العميل' },
        { key: 'durationMinutes', label: 'المدة بالدقائق' },
        { key: 'cost', label: 'التكلفة' },
        { key: 'paidAmount', label: 'المبلغ المدفوع' },
        { key: 'status', label: 'حالة المشوار', formatter: (v) => TRIP_STATUS_CONFIG[v]?.label || v },
        { key: 'deliveryStatus', label: 'حالة الاستلام', formatter: (v) => DELIVERY_STATUS_CONFIG[v]?.label || v },
        { key: 'pendingReason', label: 'سبب عدم التسليم' },
      ];
      exportToCSV(filteredTrips, cols, `تقرير-المشاوير-${activeCompany?.name}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ترويسة خاصة بالطباعة الورقية فقط */}
      <PrintHeader
        reportTitle={
          currentTab === 'driver_dues' ? 'تقرير مستحقات الموصلين والتسويات' :
          currentTab === 'all_drivers' ? 'تقرير أداء جميع الموصلين' :
          currentTab === 'driver' ? `تقرير أداء الموصل: ${selectedDriver?.name || ''}` :
          currentTab === 'delivery_status' ? 'تقرير حالة استلام الطلبات والتسليم' :
          currentTab === 'financial' ? 'التقرير المالي وتكاليف التوصيل' :
          'تقرير المشاوير والتشغيل'
        }
        startDate={filters.startDate}
        endDate={filters.endDate}
      />

      {/* الرأس التفاعلي للشاشة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">مركز التقارير والتحليلات</h1>
          <p className="text-xs text-slate-500 mt-1">
            استخراج تقارير الأداء التشغيلي والمالي ومقارنة الموصلين ومتابعة المستحقات لشركة{' '}
            <span className="font-bold text-brand-700">{activeCompany?.name}</span>
          </p>
        </div>
      </div>

      {/* ================= ألسنة تبويب أنواع التقارير (Tabs) ================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-print">
        {[
          { id: 'driver_dues', label: 'مستحقات الموصلين والتسوية', icon: Wallet },
          { id: 'all_drivers', label: 'مقارنة جميع الموصلين', icon: Users },
          { id: 'driver', label: 'تقرير موصل محدد', icon: BarChart3 },
          { id: 'date_summary', label: 'التقرير الدوري بالتواريخ', icon: Calendar },
          { id: 'delivery_status', label: 'تقرير حالة التسليم', icon: CheckCircle2 },
          { id: 'financial', label: 'التقرير المالي والتكاليف', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= شريط الفلاتر الموحد ================= */}
      <ReportFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
        onPrint={handlePrint}
        onExportCSV={handleExportCSV}
        drivers={drivers}
        showDriverFilter={currentTab !== 'all_drivers'}
      />

      {/* ================= بطاقات الملخص الإحصائي ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">إجمالي المشاوير</span>
          <span className="text-xl font-black text-slate-900">{stats.totalTrips}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
          <span className="text-[11px] font-bold text-emerald-600 block mb-1">تم التسليم</span>
          <span className="text-xl font-black text-emerald-700">{stats.deliveredCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
          <span className="text-[11px] font-bold text-amber-600 block mb-1">لم تُسلّم</span>
          <span className="text-xl font-black text-amber-700">{stats.pendingCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
          <span className="text-[11px] font-bold text-rose-600 block mb-1">تعذر أو مرتجع</span>
          <span className="text-xl font-black text-rose-700">{stats.failedCount + stats.returnedCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
          <span className="text-[11px] font-bold text-brand-600 block mb-1">إجمالي التكاليف</span>
          <span className="text-sm font-black text-slate-900">{formatCurrency(stats.totalCost)}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">نسبة التسليم</span>
          <span className={`text-xl font-black ${
            stats.deliverySuccessRate === null ? 'text-slate-400' :
            stats.deliverySuccessRate >= 80 ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {formatPercentage(stats.deliverySuccessRate)}
          </span>
        </div>
      </div>

      {/* ================= محتوى التبويب المختار ================= */}

      {/* 0. تقرير مستحقات الموصلين والتسويات المالية */}
      {currentTab === 'driver_dues' && (
        <div className="space-y-6">
          {/* كروت الملخص المالي لمستحقات الموصلين */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-bold">
                <span>إجمالي المشاوير</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {driverDuesData.summary.totalTrips}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">مشوار مسجل في هذه الفترة</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-bold">
                <span>إجمالي تكاليف المشاوير</span>
                <DollarSign className="w-4 h-4 text-brand-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(driverDuesData.summary.totalCost)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">القيمة الإجمالية لأجور الموصلين</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-700 text-xs mb-1 font-bold">
                <span>إجمالي المبالغ المسددة</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-800">
                {formatCurrency(driverDuesData.summary.totalSettled)}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1 font-medium">مشاوير تمت محاسبتها</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 shadow-2xs">
              <div className="flex items-center justify-between text-amber-800 text-xs mb-1 font-bold">
                <span>المستحقات المتبقية (غير المسددة)</span>
                <Wallet className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-900">
                {formatCurrency(driverDuesData.summary.totalRemaining)}
              </div>
              <div className="text-[11px] text-amber-800 mt-1 font-bold">مستحقات بانتظار التسوية</div>
            </div>
          </div>

          {/* جدول مستحقات الموصلين التفصيلي */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">كشف مستحقات وتسويات أسطول التوصيل</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  مقارنة المبالغ المحاسب عليها والمستحقات المتبقية لكل موصل مع إمكانية فتح كشف الحساب الفردي والتسوية
                </p>
              </div>
              <div className="text-xs text-slate-500 font-bold">
                عدد الموصلين: <span className="text-slate-800">{driverDuesData.list.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-4">اسم الموصل</th>
                    <th className="py-3.5 px-4">رقم الجوال</th>
                    <th className="py-3.5 px-4 text-center">إجمالي المشاوير</th>
                    <th className="py-3.5 px-4">إجمالي التكاليف</th>
                    <th className="py-3.5 px-4 text-emerald-700">المبالغ المسددة</th>
                    <th className="py-3.5 px-4 text-amber-800">المستحقات المتبقية</th>
                    <th className="py-3.5 px-4 text-center">نسبة التسوية</th>
                    <th className="py-3.5 px-4 text-center no-print">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {driverDuesData.list.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12">
                        <EmptyState
                          title="لا توجد بيانات موصلين"
                          description="لم يتم العثور على أي موصلين مطابقين للفلاتر المحددة."
                        />
                      </td>
                    </tr>
                  ) : (
                    driverDuesData.list.map((row) => (
                      <tr key={row.driverId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 text-sm">{row.driverName}</div>
                          <div className="text-[10px] text-slate-400">{row.vehicleType || 'مركبة نقل'}</div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-mono" dir="ltr">
                          {row.driverPhone || '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          <div>{row.totalTrips}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({row.settledCount} محاسب / {row.unsettledCount} متبقي)
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {formatCurrency(row.totalCost)}
                        </td>

                        <td className="py-3.5 px-4 font-black text-emerald-700">
                          {formatCurrency(row.settledAmount)}
                        </td>

                        <td className="py-3.5 px-4 font-black text-amber-800">
                          {formatCurrency(row.unsettledAmount)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(100, row.settlementPercentage)}%` }}
                              />
                            </div>
                            <span className="font-bold text-[11px] text-slate-700">
                              {row.settlementPercentage}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center no-print">
                          <button
                            onClick={() => setStatementDriver(row.rawDriver)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
                            title="فتح كشف حساب الموصل وتسجيل التسوية"
                          >
                            <ReceiptText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>كشف الحساب والتسوية</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 1. تقرير أداء جميع الموصلين ومقارنتهم */}
      {currentTab === 'all_drivers' && (
        <div className="space-y-6">
          {/* الرسوم البيانية لمقارنة الموصلين */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break-inside-avoid">
            {/* مقارنة عدد المشاوير */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800">مقارنة عدد المشاوير بين الموصلين</h3>
              <div className="h-56 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={driverComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="driverName" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val) => [`${val} مشوار`, 'المشاوير']} />
                    <Bar dataKey="totalTrips" fill="#0e8ce9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* مقارنة نسب التسليم والتكاليف */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800">مقارنة إجمالي تكاليف التوصيل (ر.س)</h3>
              <div className="h-56 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={driverComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="driverName" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val) => [`${val} ر.س`, 'التكلفة']} />
                    <Bar dataKey="totalCost" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* جدول مقارنة الموصلين وترتيبهم */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">جدول تقييم وترتيب أداء الموصلين</h3>
              <span className="text-xs text-slate-400">انقر على اسم الموصل لفتح تقريره المستقل</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center">الترتيب</th>
                    <th className="py-3 px-3">اسم الموصل</th>
                    <th
                      onClick={() => { setSortField('totalTrips'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                      className="py-3 px-3 cursor-pointer text-center hover:text-slate-900"
                    >
                      المشاوير ⇅
                    </th>
                    <th className="py-3 px-3 text-center text-emerald-700">تم التسليم</th>
                    <th className="py-3 px-3 text-center text-amber-700">لم يتم</th>
                    <th className="py-3 px-3 text-center text-rose-700">تعذر / مرتجع</th>
                    <th
                      onClick={() => { setSortField('totalCost'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900"
                    >
                      إجمالي التكلفة ⇅
                    </th>
                    <th className="py-3 px-3">متوسط المشوار</th>
                    <th
                      onClick={() => { setSortField('successRate'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                      className="py-3 px-3 cursor-pointer text-center hover:text-slate-900"
                    >
                      نسبة التسليم ⇅
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {driverComparison.map((d, index) => (
                    <tr key={d.driverId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        #{index + 1}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setTab('driver', { driverId: d.driverId })}
                          className="font-extrabold text-brand-700 hover:underline text-right"
                        >
                          {d.driverName}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{d.totalTrips}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700">{d.deliveredCount}</td>
                      <td className="py-3 px-3 text-center font-bold text-amber-700">{d.pendingCount}</td>
                      <td className="py-3 px-3 text-center font-bold text-rose-700">{d.failedCount + d.returnedCount}</td>
                      <td className="py-3 px-3 font-black text-slate-900">{formatCurrency(d.totalCost)}</td>
                      <td className="py-3 px-3 text-slate-600">{formatCurrency(d.avgCost)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          d.successRate === null ? 'bg-slate-100 text-slate-500' :
                          d.successRate >= 80 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {formatPercentage(d.successRate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. تقرير موصل محدد */}
      {currentTab === 'driver' && selectedDriver && (
        <div className="space-y-6">
          {/* كرت الموصل وزر العودة */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-lg">
                {selectedDriver.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">تقرير أداء الموصل: {selectedDriver.name}</h2>
                <p className="text-xs text-slate-500">
                  الجوال: <span className="font-mono text-slate-700" dir="ltr">{selectedDriver.phone}</span> | الشركة: {activeCompany?.name}
                </p>
              </div>
            </div>

            <button
              onClick={() => setTab('all_drivers', { driverId: '' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لتقرير جميع الموصلين</span>
            </button>
          </div>

          {/* رسوم بيانية خاصة بالموصل */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break-inside-avoid">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800">مشاوير وتكاليف الموصل حسب الأيام</h3>
              <div className="h-56 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="totalCost" stroke="#0e8ce9" fill="#0e8ce9" fillOpacity={0.2} name="التكلفة (ر.س)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-800">توزيع نتائج تسليم الطلبات للموصل</h3>
              <div className="h-56 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                      {statusPieData.map((e, i) => (
                        <Cell key={`cell-${i}`} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* جدول مشاوير الموصل */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800">سجل مشاوير الموصل ({filteredTrips.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">رقم المشوار</th>
                    <th className="py-3 px-3">العميل</th>
                    <th className="py-3 px-3">التاريخ والوقت</th>
                    <th className="py-3 px-3">المدة والتكلفة</th>
                    <th className="py-3 px-3">حالة الاستلام</th>
                    <th className="py-3 px-3">التسليم الفعلي</th>
                    <th className="py-3 px-3 text-center">تفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrips.map(trip => (
                    <tr key={trip.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-brand-700">{trip.tripNumber}</td>
                      <td className="py-3 px-3 text-slate-900">{trip.customerName}</td>
                      <td className="py-3 px-3 text-slate-500">{formatArabicDate(trip.tripDate)}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {formatCurrency(trip.cost)} <span className="text-[10px] text-slate-400 font-normal">({formatDuration(trip.durationMinutes)})</span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={DELIVERY_STATUS_CONFIG[trip.deliveryStatus]?.colorName || 'gray'} size="sm" dot>
                          {DELIVERY_STATUS_CONFIG[trip.deliveryStatus]?.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {trip.actualDeliveryDate ? `${formatArabicDate(trip.actualDeliveryDate)} ${formatArabicTime(trip.actualDeliveryTime)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setViewingTrip(trip)}
                          className="p-1 rounded text-slate-400 hover:text-brand-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. التقرير الدوري بالتواريخ (يومي / أسبوعي / شهري) */}
      {currentTab === 'date_summary' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800">تحليل المشاوير والتكاليف اليومية خلال الفترة المختارة</h3>
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalTrips" fill="#0e8ce9" name="عدد المشاوير" />
                  <Area yAxisId="right" type="monotone" dataKey="totalCost" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="التكلفة (ر.س)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* جدول اليوميات */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800">تفاصيل الأيام المشمولة في الفترة</h3>
            </div>
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4 text-center">إجمالي المشاوير</th>
                  <th className="py-3 px-4 text-center">تم التسليم</th>
                  <th className="py-3 px-4">إجمالي تكلفة اليوم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyChartData.map(d => (
                  <tr key={d.date} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800">{formatArabicDate(d.date)}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{d.totalTrips}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{d.delivered}</td>
                    <td className="py-3 px-4 font-black text-brand-700">{formatCurrency(d.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. تقرير حالة التسليم ومتابعة غير المسلم */}
      {currentTab === 'delivery_status' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">سجل المشاوير التي لم تُسلّم أو تعذرت أو أُرجعت</h3>
                <p className="text-[11px] text-slate-400">تحتاج إلى متابعة مع العميل أو إعادة جدولة التسليم</p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                {filteredTrips.filter(t => t.deliveryStatus !== 'delivered').length} طلب يحتاج متابعة
              </span>
            </div>

            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم المشوار</th>
                  <th className="py-3 px-4">العميل والجوال</th>
                  <th className="py-3 px-4">الموصل</th>
                  <th className="py-3 px-4">تاريخ المشوار</th>
                  <th className="py-3 px-4">حالة الاستلام</th>
                  <th className="py-3 px-4">السبب المسجل</th>
                  <th className="py-3 px-4">موعد التسليم القادم</th>
                  <th className="py-3 px-4 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrips.filter(t => t.deliveryStatus !== 'delivered').length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-emerald-700 font-bold">
                      ممتاز! جميع الطلبات المشمولة في هذه الفترة تم تسليمها بنجاح للعملاء.
                    </td>
                  </tr>
                ) : (
                  filteredTrips
                    .filter(t => t.deliveryStatus !== 'delivered')
                    .map(trip => (
                      <tr key={trip.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-brand-700">{trip.tripNumber}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{trip.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{trip.customerPhone || '-'}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{trip.driverName}</td>
                        <td className="py-3 px-4 text-slate-500">{formatArabicDate(trip.tripDate)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={DELIVERY_STATUS_CONFIG[trip.deliveryStatus]?.colorName || 'gray'} size="sm" dot>
                            {DELIVERY_STATUS_CONFIG[trip.deliveryStatus]?.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-amber-900">
                          {trip.pendingReason || trip.failureReason || trip.returnReason || 'غير محدد'}
                        </td>
                        <td className="py-3 px-4 font-bold text-brand-700">
                          {trip.nextDeliveryDate ? formatArabicDate(trip.nextDeliveryDate) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setViewingTrip(trip)}
                            className="p-1 rounded text-slate-400 hover:text-brand-600"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. التقرير المالي */}
      {currentTab === 'financial' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="text-xs text-slate-500">
              نطاق الحساب: <span className="font-bold text-slate-800">التكاليف التشغيلية للمشاوير غير الملغاة</span>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCancelledInFinance}
                onChange={(e) => setIncludeCancelledInFinance(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded-sm"
              />
              <span>تضمين المشاوير الملغاة في الحساب المالي</span>
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم المشوار</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">الموصل</th>
                  <th className="py-3 px-4">العميل</th>
                  <th className="py-3 px-4">تكلفة المشوار</th>
                  <th className="py-3 px-4">المبلغ المدفوع</th>
                  <th className="py-3 px-4">المتبقي</th>
                  <th className="py-3 px-4">طريقة الدفع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrips.map(trip => {
                  const cost = Number(trip.cost) || 0;
                  const paid = Number(trip.paidAmount) || 0;
                  const remaining = Math.max(0, cost - paid);
                  const paymentObj = PAYMENT_METHODS.find(m => m.id === trip.paymentMethod);

                  return (
                    <tr key={trip.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-brand-700">{trip.tripNumber}</td>
                      <td className="py-3 px-4 text-slate-500">{formatArabicDate(trip.tripDate)}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{trip.driverName}</td>
                      <td className="py-3 px-4 text-slate-900">{trip.customerName}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">{formatCurrency(cost)}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{formatCurrency(paid)}</td>
                      <td className="py-3 px-4 font-bold text-amber-700">
                        {remaining > 0 ? formatCurrency(remaining) : <span className="text-slate-400">0</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {paymentObj ? paymentObj.label : trip.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* مودال تفاصيل المشوار */}
      {viewingTrip && (
        <TripDetailsModal
          isOpen={!!viewingTrip}
          onClose={() => setViewingTrip(null)}
          trip={viewingTrip}
        />
      )}

      {/* مودال كشف حساب الموصل ومحاسبة المشاوير */}
      {statementDriver && (
        <DriverStatementModal
          isOpen={!!statementDriver}
          onClose={() => setStatementDriver(null)}
          driver={statementDriver}
        />
      )}
    </div>
  );
}
