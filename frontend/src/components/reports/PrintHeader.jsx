import React from 'react';
import { useCompany } from '../../context/CompanyContext';
import { formatArabicDate, formatArabicTime, getTodayDateString, getCurrentTimeString } from '../../utils/dateUtils';

export default function PrintHeader({
  reportTitle = 'تقرير التوصيل والتشغيل',
  startDate,
  endDate,
}) {
  const { activeCompany } = useCompany();
  const today = getTodayDateString();
  const time = getCurrentTimeString();

  return (
    <div className="print-only mb-6 pb-4 border-b-2 border-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">{activeCompany?.name || 'نظام المجد لإدارة التوصيل'}</h1>
          <p className="text-xs text-slate-600 mt-1">
            سجل تجاري: {activeCompany?.crNumber || '-'} | المدينة: {activeCompany?.city || 'المملكة العربية السعودية'}
          </p>
        </div>
        <div className="text-left text-xs text-slate-600">
          <p className="font-bold text-slate-900 text-sm">{reportTitle}</p>
          <p className="mt-1">
            الفترة: {startDate ? formatArabicDate(startDate) : 'البداية'} إلى {endDate ? formatArabicDate(endDate) : 'اليوم'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            تاريخ الطباعة: {formatArabicDate(today)} - {formatArabicTime(time)}
          </p>
        </div>
      </div>
    </div>
  );
}
