import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { useApp } from '../context/AppContext';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import TripDetailsModal from '../components/trips/TripDetailsModal';
import DeliveryStatusModal from '../components/trips/DeliveryStatusModal';
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
} from '../utils/formatters';
import { formatArabicDate, formatArabicTime, getTodayDateString } from '../utils/dateUtils';
import {
  Truck,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Plus,
  Eye,
  RotateCcw,
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

export default function Dashboard() {
  const { activeCompany } = useCompany();
  const { trips, drivers, loading } = useApp();

  const [selectedTripForDetails, setSelectedTripForDetails] = useState(null);
  const [selectedTripForStatus, setSelectedTripForStatus] = useState(null);

  const todayStr = getTodayDateString();

  // مشاوير اليوم
  const todayTrips = trips.filter(t => t.tripDate === todayStr);
  const todayStats = calculateTripSummaryStats(todayTrips);

  // إحصائيات الشهر الإجمالية للشركة
  const overallStats = calculateTripSummaryStats(trips);

  // الموصلين النشطين
  const activeDriversCount = drivers.filter(d => d.isActive).length;

  // بيانات الرسوم البيانية
  const dailyChartData = aggregateTripsByDay(trips.slice(-14)); // آخر أسبوعين
  const statusPieData = getDeliveryStatusDistribution(trips);
  const driverPerformanceData = aggregateDriverComparison(trips, drivers);

  // أحدث 6 مشاوير
  const recentTrips = [...trips].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 6);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* رأس لوحة التحكم */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            لوحة التحكم والعمليات
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة المشاوير الحية والتكاليف وأداء الموصلين لشركة{' '}
            <span className="font-bold text-brand-700">{activeCompany?.name}</span>
          </p>
        </div>
      </div>

      {/* ================= شبكة البطاقات الإحصائية ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* مشاوير اليوم */}
        <StatCard
          title="مشاوير اليوم"
          value={todayTrips.length}
          subValue={`منها ${todayStats.deliveredCount} مسلّمة`}
          icon={Truck}
          colorScheme="blue"
          trend="مؤشر نشاط التوصيل اليومي"
        />

        {/* تكلفة مشاوير اليوم */}
        <StatCard
          title="تكلفة مشاوير اليوم"
          value={formatCurrency(todayStats.totalCost)}
          subValue={`متبقي ${formatCurrency(todayStats.totalRemaining)}`}
          icon={DollarSign}
          colorScheme="emerald"
          trend="التكاليف التشغيلية لليوم"
        />

        {/* نسبة نجاح التسليم الإجمالية */}
        <StatCard
          title="نسبة نجاح التسليم"
          value={formatPercentage(overallStats.deliverySuccessRate)}
          subValue={`${overallStats.deliveredCount} طلب ناجح`}
          icon={CheckCircle2}
          colorScheme="amber"
          trend="مستبعداً المشاوير الملغاة"
        />

        {/* الموصلون النشطون */}
        <StatCard
          title="الموصلون النشطون"
          value={activeDriversCount}
          subValue={`إجمالي ${drivers.length} موصل`}
          icon={Users}
          colorScheme="indigo"
          trend="جاهزون لاستلام المشاوير"
        />
      </div>

      {/* صف بطاقات إحصائية تشغيلية إضافية */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">المشاوير المكتملة</span>
          <span className="text-lg font-black text-emerald-700">{overallStats.completedCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">قيد التنفيذ</span>
          <span className="text-lg font-black text-amber-700">{overallStats.inProgressCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">المشاوير الملغاة</span>
          <span className="text-lg font-black text-rose-700">{overallStats.cancelledCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">طلبات لم تُسلّم</span>
          <span className="text-lg font-black text-amber-600">{overallStats.pendingCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">تكاليف الشهر</span>
          <span className="text-sm font-black text-slate-800">{formatCurrency(overallStats.totalCost)}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 block mb-1">متوسط المشوار</span>
          <span className="text-sm font-black text-brand-700">{formatCurrency(overallStats.avgCost)}</span>
        </div>
      </div>

      {/* ================= الرسوم البيانية التفاعلية ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* رسم بياني لمسار المشاوير والتكاليف اليومية */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">مسار المشاوير والتكاليف اليومية</h2>
              <p className="text-[11px] text-slate-400">توزيع المشاوير والتكاليف عبر الأيام</p>
            </div>
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
              آخر الأيام
            </span>
          </div>

          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e8ce9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0e8ce9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val, name) => [
                    name === 'totalCost' ? `${val} ر.س` : val,
                    name === 'totalCost' ? 'التكلفة الإجمالية' : 'عدد المشاوير',
                  ]}
                  labelFormatter={(lbl) => `التاريخ: ${lbl}`}
                />
                <Legend
                  formatter={(val) => val === 'totalCost' ? 'تكلفة التوصيل (ر.س)' : 'عدد المشاوير'}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalCost"
                  stroke="#0e8ce9"
                  fillOpacity={1}
                  fill="url(#colorCost)"
                  name="totalCost"
                />
                <Bar
                  yAxisId="left"
                  dataKey="totalTrips"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="totalTrips"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* رسم بياني لتوزيع حالات استلام الطلب */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">توزيع حالات الاستلام</h2>
            <p className="text-[11px] text-slate-400">نسبة نجاح التسليم وتعذر وإرجاع الطلبات</p>
          </div>

          <div className="h-56 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} طلب`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* مفتاح الحالات المخصص */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-bold text-slate-900 mr-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= جدول أحدث المشاوير ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">أحدث مشاوير التوصيل</h2>
            <p className="text-[11px] text-slate-400">آخر العمليات المسجلة للشركة النشطة</p>
          </div>
          <Link
            to="/trips"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-xl transition"
          >
            <span>عرض كل المشاوير ({trips.length})</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/70">
              <tr>
                <th className="py-3 px-4">رقم المشوار</th>
                <th className="py-3 px-4">الموصل</th>
                <th className="py-3 px-4">العميل</th>
                <th className="py-3 px-4">التاريخ والوقت</th>
                <th className="py-3 px-4">المدة والتكلفة</th>
                <th className="py-3 px-4">حالة المشوار</th>
                <th className="py-3 px-4">حالة الاستلام</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTrips.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    لا توجد مشاوير مسجلة بعد في هذه الشركة. ابدأ بتسجيل مشوار جديد!
                  </td>
                </tr>
              ) : (
                recentTrips.map(trip => {
                  const tripStatus = TRIP_STATUS_CONFIG[trip.status] || TRIP_STATUS_CONFIG.new;
                  const deliveryStatus = DELIVERY_STATUS_CONFIG[trip.deliveryStatus] || DELIVERY_STATUS_CONFIG.pending;

                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-extrabold text-brand-700">
                        {trip.tripNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {trip.driverName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{trip.customerName}</div>
                        <div className="text-[10px] text-slate-400">{trip.orderNumber || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <div>{formatArabicDate(trip.tripDate)}</div>
                        <div className="text-[10px] text-slate-400">{formatArabicTime(trip.tripTime)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{formatCurrency(trip.cost)}</div>
                        <div className="text-[10px] text-slate-400">{formatDuration(trip.durationMinutes)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${tripStatus.bgClass}`}>
                          {tripStatus.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedTripForStatus(trip)}
                          className="hover:scale-105 transition-transform"
                          title="انقر لتعديل حالة الاستلام"
                        >
                          <Badge variant={deliveryStatus.colorName} size="sm" dot>
                            {deliveryStatus.label}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedTripForDetails(trip)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition"
                          title="عرض التفاصيل الكاملة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال تفاصيل المشوار */}
      {selectedTripForDetails && (
        <TripDetailsModal
          isOpen={!!selectedTripForDetails}
          onClose={() => setSelectedTripForDetails(null)}
          trip={selectedTripForDetails}
        />
      )}

      {/* مودال تغيير حالة الاستلام */}
      {selectedTripForStatus && (
        <DeliveryStatusModal
          isOpen={!!selectedTripForStatus}
          onClose={() => setSelectedTripForStatus(null)}
          trip={selectedTripForStatus}
        />
      )}
    </div>
  );
}
