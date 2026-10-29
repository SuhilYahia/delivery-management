import React from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { useCompany } from '../../context/CompanyContext';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { formatArabicDate } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Truck,
  CheckCircle2,
  Clock,
  DollarSign,
  BarChart3,
  ExternalLink,
} from 'lucide-react';

export default function DriverDetailsModal({
  isOpen,
  onClose,
  driver,
}) {
  const { activeCompany } = useCompany();
  const { trips } = useApp();
  const navigate = useNavigate();

  if (!driver) return null;

  // استخراج مشاوير هذا الموصل
  const driverTrips = trips.filter(t => t.driverId === driver.id);
  const activeTrips = driverTrips.filter(t => t.status !== 'cancelled');
  const deliveredCount = activeTrips.filter(t => t.deliveryStatus === 'delivered').length;
  const pendingCount = activeTrips.filter(t => t.deliveryStatus === 'pending').length;
  const totalCost = activeTrips.reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
  const successRate = activeTrips.length > 0 ? (deliveredCount / activeTrips.length) * 100 : null;

  const handleOpenReport = () => {
    onClose();
    navigate(`/reports?tab=driver&driverId=${driver.id}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`ملف الموصل: ${driver.name}`}
      subtitle={`الشركة: ${activeCompany?.name || ''}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* معلومات الموصل الأساسية */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg">
              {driver.name.charAt(0)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">{driver.name}</h4>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5" dir="ltr">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{driver.phone}</span>
              </p>
            </div>
          </div>
          <div className="text-left">
            <Badge variant={driver.isActive ? 'green' : 'gray'} dot>
              {driver.isActive ? 'نشط' : 'معطل'}
            </Badge>
            <p className="text-[11px] text-slate-400 mt-1">{driver.vehicleType || 'مركبة نقل'}</p>
          </div>
        </div>

        {/* بطاقات الإحصائيات السريعة للموصل */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500 block mb-1">إجمالي المشاوير</span>
            <span className="text-base font-extrabold text-slate-900">{driverTrips.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] text-emerald-700 block mb-1">تم تسليمها</span>
            <span className="text-base font-extrabold text-emerald-800">{deliveredCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
            <span className="text-[11px] text-blue-700 block mb-1">إجمالي التكلفة</span>
            <span className="text-base font-extrabold text-blue-900">{formatCurrency(totalCost)}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
            <span className="text-[11px] text-amber-700 block mb-1">نسبة التسليم</span>
            <span className="text-base font-extrabold text-amber-800">{formatPercentage(successRate)}</span>
          </div>
        </div>

        {/* أحدث المشاوير الخاصة بالموصل */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-bold text-slate-700">أحدث مشاوير الموصل ({driverTrips.length})</h5>
            <button
              onClick={handleOpenReport}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              <span>عرض التقرير التفصيلي الكامل</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
            {driverTrips.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">لا توجد مشاوير مسجلة لهذا الموصل حتى الآن.</p>
            ) : (
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">رقم المشوار</th>
                    <th className="p-2.5">العميل</th>
                    <th className="p-2.5">التاريخ</th>
                    <th className="p-2.5">التكلفة</th>
                    <th className="p-2.5">حالة الاستلام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {driverTrips.slice(0, 10).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-brand-700">{t.tripNumber}</td>
                      <td className="p-2.5 text-slate-800">{t.customerName}</td>
                      <td className="p-2.5 text-slate-500">{formatArabicDate(t.tripDate)}</td>
                      <td className="p-2.5 font-bold text-slate-800">{formatCurrency(t.cost)}</td>
                      <td className="p-2.5">
                        <Badge
                          variant={
                            t.deliveryStatus === 'delivered' ? 'green' :
                            t.deliveryStatus === 'pending' ? 'orange' :
                            t.deliveryStatus === 'failed' ? 'red' : 'gray'
                          }
                          size="sm"
                        >
                          {t.deliveryStatus === 'delivered' ? 'تم التسليم' :
                           t.deliveryStatus === 'pending' ? 'لم يتم' :
                           t.deliveryStatus === 'failed' ? 'تعذر' : 'مرتجع'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
}
