import React from 'react';

export default function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  colorScheme = 'blue',
  trend,
  className = '',
}) {
  const colorMaps = {
    blue: {
      bg: 'bg-blue-50/70 text-blue-600',
      border: 'border-slate-200/80 hover:border-blue-300',
      ring: 'group-hover:ring-blue-100',
    },
    emerald: {
      bg: 'bg-emerald-50/70 text-emerald-600',
      border: 'border-slate-200/80 hover:border-emerald-300',
      ring: 'group-hover:ring-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50/70 text-amber-600',
      border: 'border-slate-200/80 hover:border-amber-300',
      ring: 'group-hover:ring-amber-100',
    },
    rose: {
      bg: 'bg-rose-50/70 text-rose-600',
      border: 'border-slate-200/80 hover:border-rose-300',
      ring: 'group-hover:ring-rose-100',
    },
    indigo: {
      bg: 'bg-indigo-50/70 text-indigo-600',
      border: 'border-slate-200/80 hover:border-indigo-300',
      ring: 'group-hover:ring-indigo-100',
    },
    slate: {
      bg: 'bg-slate-100 text-slate-700',
      border: 'border-slate-200/80 hover:border-slate-300',
      ring: 'group-hover:ring-slate-100',
    },
  };

  const scheme = colorMaps[colorScheme] || colorMaps.blue;

  return (
    <div
      className={`group relative bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 ${scheme.border} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              {value}
            </h3>
            {subValue && (
              <span className="text-xs font-medium text-slate-500">
                {subValue}
              </span>
            )}
          </div>
          {trend && (
            <p className="text-xs text-slate-500 mt-1">
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl transition-transform duration-200 group-hover:scale-105 ${scheme.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
