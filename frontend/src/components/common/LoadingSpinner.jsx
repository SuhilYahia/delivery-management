import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'جارٍ تحميل البيانات...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
