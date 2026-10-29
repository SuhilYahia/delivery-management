import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Home, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-6 shadow-sm">
        <Truck className="w-10 h-10" />
      </div>

      <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">404</h1>
      <h2 className="text-lg font-bold text-slate-800 mb-2">الصفحة المطلوبة غير موجودة</h2>
      <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
        يبدو أنك حاولت الوصول إلى مسار غير متاح أو تم نقله. يمكنك العودة إلى لوحة التحكم الرئيسية لمتابعة العمليات.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition"
      >
        <Home className="w-4 h-4" />
        <span>العودة للوحة التحكم</span>
      </Link>
    </div>
  );
}
