import React from 'react';
import { getDateRangePreset } from '../../utils/dateUtils';
import {
  Filter,
  RotateCcw,
  Printer,
  Download,
  Calendar,
  User,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function ReportFilterBar({
  filters,
  onFilterChange,
  onReset,
  onPrint,
  onExportCSV,
  drivers = [],
  showDriverFilter = true,
  showStatusFilters = true,
}) {
  const handlePresetClick = (preset) => {
    const range = getDateRangePreset(preset);
    onFilterChange({
      ...filters,
      datePreset: preset,
      startDate: range.startDate,
      endDate: range.endDate,
    });
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      ...filters,
      datePreset: 'custom',
      startDate: val,
    });
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    onFilterChange({
      ...filters,
      datePreset: 'custom',
      endDate: val,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 no-print">
      {/* سطر الاختصارات الزمنية السريعة (Presets) */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 ml-2">الفترة الزمنية:</span>
          {[
            { id: 'today', label: 'اليوم' },
            { id: 'yesterday', label: 'أمس' },
            { id: 'last7days', label: 'آخر 7 أيام' },
            { id: 'last30days', label: 'آخر 30 يوماً' },
            { id: 'thisMonth', label: 'هذا الشهر' },
            { id: 'lastMonth', label: 'الشهر السابق' },
            { id: 'custom', label: 'فترة مخصصة' },
          ].map(p => {
            const isActive = filters.datePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetClick(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* أزرار الإجراءات: الطباعة والتصدير وإعادة الضبط */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
            title="إعادة ضبط الفلاتر"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">إعادة ضبط</span>
          </button>

          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة التقرير</span>
            </button>
          )}
        </div>
      </div>

      {/* سطر حقول الفلاتر التفصيلية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* من تاريخ */}
        <div>
          <label className="block text-slate-500 font-bold mb-1">من تاريخ</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={handleStartDateChange}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>

        {/* إلى تاريخ */}
        <div>
          <label className="block text-slate-500 font-bold mb-1">إلى تاريخ</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={handleEndDateChange}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
        </div>

        {/* الموصل */}
        {showDriverFilter && (
          <div>
            <label className="block text-slate-500 font-bold mb-1">الموصل</label>
            <select
              value={filters.driverId || ''}
              onChange={(e) => onFilterChange({ ...filters, driverId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            >
              <option value="">جميع الموصلين</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* حالة استلام الطلب */}
        {showStatusFilters && (
          <div>
            <label className="block text-slate-500 font-bold mb-1">حالة استلام الطلب</label>
            <select
              value={filters.deliveryStatus || ''}
              onChange={(e) => onFilterChange({ ...filters, deliveryStatus: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            >
              <option value="">جميع حالات الاستلام</option>
              <option value="delivered">تم التسليم</option>
              <option value="pending">لم يتم التسليم</option>
              <option value="failed">تعذر التسليم</option>
              <option value="returned">تم إرجاع الطلب</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
