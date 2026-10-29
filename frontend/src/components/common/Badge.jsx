import React from 'react';

export default function Badge({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
  className = '',
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const variantClasses = {
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    orange: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    red: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    gray: 'bg-slate-100 text-slate-700 border border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
  };

  const dotColorClasses = {
    green: 'bg-emerald-500',
    orange: 'bg-amber-500',
    red: 'bg-rose-500',
    blue: 'bg-blue-500',
    gray: 'bg-slate-400',
    indigo: 'bg-indigo-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses[size]} ${variantClasses[variant] || variantClasses.gray} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColorClasses[variant] || 'bg-slate-400'}`} />
      )}
      {children}
    </span>
  );
}
