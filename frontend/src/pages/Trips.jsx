import React, { useState, useMemo } from 'react';
import { useCompany } from '../context/CompanyContext';
import { useApp } from '../context/AppContext';
import TripFormModal from '../components/trips/TripFormModal';
import TripDetailsModal from '../components/trips/TripDetailsModal';
import DeliveryStatusModal from '../components/trips/DeliveryStatusModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import {
  formatCurrency,
  formatDuration,
  TRIP_STATUS_CONFIG,
  DELIVERY_STATUS_CONFIG,
  PAYMENT_METHODS,
} from '../utils/formatters';
import { formatArabicDate, formatArabicTime, isDateInRange } from '../utils/dateUtils';
import { exportToCSV } from '../utils/csvExport';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  RotateCcw,
  Clock,
  CheckCircle2,
  ArrowUpDown,
} from 'lucide-react';

export default function Trips() {
  const { activeCompany } = useCompany();
  const { trips, drivers, removeTrip, editTrip } = useApp();

  // فلاتر البحث
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedTripStatus, setSelectedTripStatus] = useState('');
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // فرز الأعمدة
  const [sortField, setSortField] = useState('tripDate');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // التصفح (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // الحالات التفاعلية للمودالات
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [viewingTrip, setViewingTrip] = useState(null);
  const [statusChangingTrip, setStatusChangingTrip] = useState(null);
  const [deletingTripId, setDeletingTripId] = useState(null);

  // تصفية وترتيب البيانات
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      // 1. البحث النصي
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchNumber = (trip.tripNumber || '').toLowerCase().includes(query);
        const matchOrder = (trip.orderNumber || '').toLowerCase().includes(query);
        const matchCustomer = (trip.customerName || '').toLowerCase().includes(query);
        const matchDriver = (trip.driverName || '').toLowerCase().includes(query);
        if (!matchNumber && !matchOrder && !matchCustomer && !matchDriver) {
          return false;
        }
      }

      // 2. فلتر الموصل
      if (selectedDriverId && trip.driverId !== selectedDriverId) {
        return false;
      }

      // 3. فلتر حالة المشوار
      if (selectedTripStatus && trip.status !== selectedTripStatus) {
        return false;
      }

      // 4. فلتر حالة الاستلام
      if (selectedDeliveryStatus && trip.deliveryStatus !== selectedDeliveryStatus) {
        return false;
      }

      // 5. فلتر طريقة الدفع
      if (selectedPaymentMethod && trip.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // 6. فلتر التاريخ
      if (startDate || endDate) {
        if (!isDateInRange(trip.tripDate, startDate, endDate)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'cost' || sortField === 'durationMinutes') {
        valA = Number(valA);
        valB = Number(valB);
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      if (sortOrder === 'asc') {
        return String(valA).localeCompare(String(valB));
      } else {
        return String(valB).localeCompare(String(valA));
      }
    });
  }, [trips, searchTerm, selectedDriverId, selectedTripStatus, selectedDeliveryStatus, selectedPaymentMethod, startDate, endDate, sortField, sortOrder]);

  // الحساب لصفحات Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / pageSize));
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDriverId('');
    setSelectedTripStatus('');
    setSelectedDeliveryStatus('');
    setSelectedPaymentMethod('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const columns = [
      { key: 'tripNumber', label: 'رقم المشوار' },
      { key: 'orderNumber', label: 'رقم الطلب' },
      { key: 'driverName', label: 'اسم الموصل' },
      { key: 'customerName', label: 'اسم العميل' },
      { key: 'customerPhone', label: 'جوال العميل' },
      { key: 'deliveryAddress', label: 'عنوان التوصيل' },
      { key: 'tripDate', label: 'تاريخ المشوار' },
      { key: 'tripTime', label: 'وقت المشوار' },
      { key: 'durationMinutes', label: 'المدة بالدقائق' },
      { key: 'cost', label: 'تكلفة المشوار (ر.س)' },
      { key: 'status', label: 'حالة المشوار', formatter: (val) => TRIP_STATUS_CONFIG[val]?.label || val },
      { key: 'deliveryStatus', label: 'حالة الاستلام', formatter: (val) => DELIVERY_STATUS_CONFIG[val]?.label || val },
      { key: 'actualDeliveryDate', label: 'تاريخ التسليم الفعلي' },
      { key: 'actualDeliveryTime', label: 'وقت التسليم الفعلي' },
      { key: 'recipientName', label: 'مستلم الطلب' },
      { key: 'pendingReason', label: 'سبب عدم التسليم' },
      { key: 'paidAmount', label: 'المبلغ المدفوع' },
      { key: 'paymentMethod', label: 'طريقة الدفع' },
    ];
    exportToCSV(filteredTrips, columns, `مشاوير-${activeCompany?.name || 'الشركة'}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الرأس وإجراء إضافة مشوار */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة مشاوير التوصيل</h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل ومتابعة المشاوير، احتساب التكاليف آلياً، وتحديث حالة استلام الطلبات لـ{' '}
            <span className="font-bold text-brand-700">{activeCompany?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مشوار جديد</span>
          </button>
        </div>
      </div>

      {/* ================= صندوق البحث والفلاتر ================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        {/* سطر البحث النصي الرئيسي */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث برقم المشوار، رقم الطلب، اسم العميل، أو اسم الموصل..."
              className="w-full text-xs rounded-xl border border-slate-200 pr-10 pl-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition border border-slate-200 flex-shrink-0"
            title="إعادة ضبط الفلاتر"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">إعادة ضبط</span>
          </button>
        </div>

        {/* سطر الفلاتر المنسدلة */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* الموصل */}
          <select
            value={selectedDriverId}
            onChange={(e) => { setSelectedDriverId(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200 px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none"
          >
            <option value="">جميع الموصلين</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* حالة المشوار */}
          <select
            value={selectedTripStatus}
            onChange={(e) => { setSelectedTripStatus(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200 px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none"
          >
            <option value="">حالة المشوار</option>
            <option value="new">جديد</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>

          {/* حالة استلام الطلب */}
          <select
            value={selectedDeliveryStatus}
            onChange={(e) => { setSelectedDeliveryStatus(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200 px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none"
          >
            <option value="">حالة الاستلام</option>
            <option value="delivered">تم التسليم</option>
            <option value="pending">لم يتم التسليم</option>
            <option value="failed">تعذر التسليم</option>
            <option value="returned">تم إرجاع الطلب</option>
          </select>

          {/* طريقة الدفع */}
          <select
            value={selectedPaymentMethod}
            onChange={(e) => { setSelectedPaymentMethod(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200 px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none"
          >
            <option value="">طريقة الدفع</option>
            {PAYMENT_METHODS.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>

          {/* من تاريخ */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200 px-2 py-1.5 bg-slate-50 text-[11px]"
            title="من تاريخ"
          />

          {/* إلى تاريخ */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200 px-2 py-1.5 bg-slate-50 text-[11px]"
            title="إلى تاريخ"
          />
        </div>
      </div>

      {/* ================= جدول المشاوير ================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/70">
              <tr>
                <th
                  onClick={() => handleSort('tripNumber')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>رقم المشوار</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">اسم الموصل</th>
                <th className="py-3 px-4">العميل والطلب</th>
                <th
                  onClick={() => handleSort('tripDate')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>التاريخ والوقت</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cost')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>المدة والتكلفة</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">حالة المشوار</th>
                <th className="py-3 px-4">حالة الاستلام</th>
                <th className="py-3 px-4">طريقة الدفع</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTrips.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12">
                    <EmptyState
                      title="لم يتم العثور على أي مشاوير"
                      description="جرّب تعديل مصطلحات البحث أو الفلاتر المحددة، أو سجّل مشواراً جديداً."
                      actionLabel="تسجيل مشوار جديد"
                      onAction={() => setIsAddModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                paginatedTrips.map(trip => {
                  const tripStatus = TRIP_STATUS_CONFIG[trip.status] || TRIP_STATUS_CONFIG.new;
                  const deliveryStatus = DELIVERY_STATUS_CONFIG[trip.deliveryStatus] || DELIVERY_STATUS_CONFIG.pending;
                  const paymentObj = PAYMENT_METHODS.find(m => m.id === trip.paymentMethod);

                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-black text-brand-700">
                        {trip.tripNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {trip.driverName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{trip.customerName}</div>
                        <div className="text-[10px] text-slate-400">{trip.orderNumber || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{formatArabicDate(trip.tripDate)}</div>
                        <div className="text-[10px] text-slate-400">{formatArabicTime(trip.tripTime)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{formatCurrency(trip.cost)}</div>
                        <div className="text-[10px] text-brand-600 font-semibold">{formatDuration(trip.durationMinutes)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tripStatus.bgClass}`}>
                          {tripStatus.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setStatusChangingTrip(trip)}
                          className="hover:scale-105 transition-transform"
                          title="انقر لتعديل حالة الاستلام"
                        >
                          <Badge variant={deliveryStatus.colorName} size="sm" dot>
                            {deliveryStatus.label}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {paymentObj ? paymentObj.label : trip.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingTrip(trip)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingTrip(trip)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="تعديل المشوار"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingTripId(trip.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="حذف المشوار"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* شريط Pagination الإحصائي السفلي */}
        {filteredTrips.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
            <div>
              إجمالي النتائج: <span className="font-bold text-slate-800">{filteredTrips.length}</span> مشوار
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-medium"
              >
                السابق
              </button>
              <span>
                صفحة <span className="font-bold text-slate-800">{currentPage}</span> من{' '}
                <span className="font-bold text-slate-800">{totalPages}</span>
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition font-medium"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* مودال إضافة مشوار */}
      <TripFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* مودال تعديل مشوار */}
      {editingTrip && (
        <TripFormModal
          isOpen={!!editingTrip}
          onClose={() => setEditingTrip(null)}
          initialData={editingTrip}
        />
      )}

      {/* مودال عرض تفاصيل المشوار */}
      {viewingTrip && (
        <TripDetailsModal
          isOpen={!!viewingTrip}
          onClose={() => setViewingTrip(null)}
          trip={viewingTrip}
          onEdit={(t) => setEditingTrip(t)}
        />
      )}

      {/* مودال تغيير حالة الاستلام السريع */}
      {statusChangingTrip && (
        <DeliveryStatusModal
          isOpen={!!statusChangingTrip}
          onClose={() => setStatusChangingTrip(null)}
          trip={statusChangingTrip}
        />
      )}

      {/* مربع تأكيد حذف مشوار */}
      <ConfirmDialog
        isOpen={!!deletingTripId}
        onClose={() => setDeletingTripId(null)}
        onConfirm={() => {
          if (deletingTripId) {
            removeTrip(deletingTripId);
          }
        }}
        title="تأكيد حذف المشوار"
        message="هل أنت متأكد من رغبتك في حذف هذا المشوار؟ سيتم استبعاده من إحصائيات التوصيل والتقارير."
        confirmText="نعم، احذف المشوار"
        cancelText="إلغاء"
      />
    </div>
  );
}
