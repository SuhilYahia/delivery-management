import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { useApp } from '../context/AppContext';
import DriverFormModal from '../components/drivers/DriverFormModal';
import DriverDetailsModal from '../components/drivers/DriverDetailsModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { aggregateDriverComparison } from '../utils/reportUtils';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { formatArabicDate } from '../utils/dateUtils';
import {
  Users,
  Plus,
  Search,
  Phone,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  BarChart3,
  Power,
} from 'lucide-react';

export default function Drivers() {
  const { activeCompany } = useCompany();
  const { drivers, trips, toggleDriver, removeDriver } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [viewingDriver, setViewingDriver] = useState(null);
  const [deletingDriverId, setDeletingDriverId] = useState(null);

  // حساب إحصائيات الموصلين الفعلية المستخلصة من المشاوير
  const driverStats = aggregateDriverComparison(trips, drivers);

  // تصفية الموصلين بالبحث
  const filteredDrivers = driverStats.filter(driver => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (driver.driverName || '').toLowerCase().includes(q) ||
      (driver.driverPhone || '').includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الرأس */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الموصلين</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة أسطول التوصيل ومتابعة إحصائيات الإنجاز والتكاليف لشركة{' '}
            <span className="font-bold text-brand-700">{activeCompany?.name}</span>
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موصل جديد</span>
        </button>
      </div>

      {/* شريط البحث السريع */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث باسم الموصل أو رقم الجوال..."
            className="w-full text-xs rounded-xl border border-slate-200 pr-10 pl-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold">
          إجمالي الموصلين: <span className="text-slate-800">{drivers.length}</span>
        </div>
      </div>

      {/* جدول الموصلين */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/70">
              <tr>
                <th className="py-3.5 px-4">اسم الموصل</th>
                <th className="py-3.5 px-4">رقم الجوال</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">عدد المشاوير</th>
                <th className="py-3.5 px-4 text-center">تم تسليمها</th>
                <th className="py-3.5 px-4 text-center">لم تُسلّم</th>
                <th className="py-3.5 px-4">إجمالي التكاليف</th>
                <th className="py-3.5 px-4 text-center">نسبة التسليم</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12">
                    <EmptyState
                      title="لم يتم العثور على أي موصلين"
                      description="ابدأ بإضافة موصلين لشركة التوصيل لتتمكن من إسناد المشاوير إليهم."
                      actionLabel="إضافة موصل جديد"
                      onAction={() => setIsAddModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                filteredDrivers.map(d => {
                  const rawDriver = drivers.find(item => item.id === d.driverId);
                  const isActive = rawDriver ? rawDriver.isActive : true;

                  return (
                    <tr key={d.driverId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{d.driverName}</div>
                        <div className="text-[10px] text-slate-400">{rawDriver?.vehicleType || 'مركبة نقل'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono" dir="ltr">
                        {d.driverPhone || rawDriver?.phone || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={isActive ? 'green' : 'gray'} dot>
                          {isActive ? 'نشط' : 'معطل'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {d.totalTrips}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                        {d.deliveredCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                        {d.pendingCount + d.failedCount + d.returnedCount}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {formatCurrency(d.totalCost)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                          d.successRate === null ? 'bg-slate-100 text-slate-500' :
                          d.successRate >= 80 ? 'bg-emerald-50 text-emerald-700' :
                          d.successRate >= 50 ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {formatPercentage(d.successRate)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingDriver(rawDriver)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition"
                            title="عرض ملف الموصل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/reports?tab=driver&driverId=${d.driverId}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="تقرير أداء الموصل"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingDriver(rawDriver)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="تعديل البيانات"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleDriver(d.driverId)}
                            className={`p-1.5 rounded-lg transition ${
                              isActive
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isActive ? 'تعطيل الموصل' : 'تفعيل الموصل'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingDriverId(d.driverId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="حذف الموصل"
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
      </div>

      {/* مودال إضافة موصل */}
      <DriverFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* مودال تعديل موصل */}
      {editingDriver && (
        <DriverFormModal
          isOpen={!!editingDriver}
          onClose={() => setEditingDriver(null)}
          initialData={editingDriver}
        />
      )}

      {/* مودال عرض تفاصيل الموصل */}
      {viewingDriver && (
        <DriverDetailsModal
          isOpen={!!viewingDriver}
          onClose={() => setViewingDriver(null)}
          driver={viewingDriver}
        />
      )}

      {/* تأكيد حذف موصل */}
      <ConfirmDialog
        isOpen={!!deletingDriverId}
        onClose={() => setDeletingDriverId(null)}
        onConfirm={async () => {
          if (deletingDriverId) {
            await removeDriver(deletingDriverId);
          }
        }}
        title="تأكيد حذف الموصل"
        message="هل أنت متأكد من رغبتك في حذف هذا الموصل؟ إذا كان للموصل مشاوير تاريخية، فسيقوم النظام بتعطيله وأرشفته تلقائياً لحماية دقة التقارير والسجلات المالية."
        confirmText="نعم، حذف الموصل"
      />
    </div>
  );
}
