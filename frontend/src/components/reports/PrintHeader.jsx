import React from 'react';
import { useCompany } from '../../context/CompanyContext';
import { formatArabicDate, formatArabicTime, getTodayDateString, getCurrentTimeString } from '../../utils/dateUtils';

export default function PrintHeader({
  reportTitle = 'تقرير التوصيل والتشغيل',
  startDate,
  endDate,
  driver = null,
}) {
  const { activeCompany } = useCompany();
  const today = getTodayDateString();
  const time = getCurrentTimeString();

  return (
    <div className="print-only mb-4 pb-3 border-b-2 border-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">{activeCompany?.name || 'نظام المجد لإدارة التوصيل'}</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            سجل تجاري: {activeCompany?.crNumber || '-'} | المدينة: {activeCompany?.city || 'المملكة العربية السعودية'}
            {activeCompany?.phone ? ` | الهاتف: ${activeCompany.phone}` : ''}
          </p>
        </div>
        <div className="text-left text-xs text-slate-600">
          <p className="font-black text-slate-900 text-sm">{reportTitle}</p>
          <p className="mt-0.5">
            الفترة: {startDate ? formatArabicDate(startDate) : 'البداية'} إلى {endDate ? formatArabicDate(endDate) : 'اليوم'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            تاريخ الطباعة: {formatArabicDate(today)} - {formatArabicTime(time)}
          </p>
        </div>
      </div>

      {driver && (
        <div className="mt-3 pt-2.5 border-t border-slate-300 grid grid-cols-3 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-bold">اسم الموصل: </span>
            <span className="font-black text-slate-900">{driver.name}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold">رقم الجوال: </span>
            <span className="font-bold text-slate-800 font-mono" dir="ltr">{driver.phone || '-'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold">وسيلة التوصيل: </span>
            <span className="font-bold text-slate-800">{driver.vehicleType || 'مركبة نقل'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
