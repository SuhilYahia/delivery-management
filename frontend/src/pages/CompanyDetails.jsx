import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { useApp } from '../context/AppContext';
import Badge from '../components/common/Badge';
import { formatArabicDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/formatters';
import {
  Building2,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Check,
  ShieldCheck,
  DollarSign,
  Truck,
  Users,
} from 'lucide-react';

export default function CompanyDetails() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { companies, activeCompanyId, switchCompany } = useCompany();
  const { trips, drivers } = useApp();

  const company = companies.find(c => c.id === companyId);

  if (!company) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-800">الشركة غير موجودة</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">لم يتم العثور على الشركة المطلوبة.</p>
        <button
          onClick={() => navigate('/companies')}
          className="px-4 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl"
        >
          العودة لقائمة الشركات
        </button>
      </div>
    );
  }

  const isCurrentActive = company.id === activeCompanyId;
  const config = company.pricingConfig || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* شريط التنقل العلوي */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/companies')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة الشركات</span>
        </button>

        {!isCurrentActive && (
          <button
            onClick={() => switchCompany(company.id)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition"
          >
            تحديد كالشركة النشطة الحالية
          </button>
        )}
      </div>

      {/* بطاقة الشركة الرئيسية */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center font-black text-2xl shadow-md">
              {company.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-slate-900">{company.name}</h1>
                <Badge variant={company.isActive ? 'green' : 'gray'} dot>
                  {company.isActive ? 'مفعلة' : 'معطلة'}
                </Badge>
                {isCurrentActive && (
                  <span className="text-[10px] font-bold bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full border border-brand-200">
                    النشطة حالياً
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                المسؤول: <span className="font-bold text-slate-700">{company.managerName}</span> | المعرف: <span className="font-mono text-slate-400">{company.id}</span>
              </p>
            </div>
          </div>
        </div>

        {/* تفاصيل السجل والتواصل */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              المدينة
            </span>
            <span className="font-bold text-slate-800 text-sm">{company.city || 'الرياض'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              رقم الجوال
            </span>
            <span className="font-bold text-slate-800 text-sm font-mono" dir="ltr">{company.phone || '-'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              البريد الإلكتروني
            </span>
            <span className="font-bold text-slate-800 text-sm truncate block" dir="ltr">{company.email || '-'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              السجل التجاري
            </span>
            <span className="font-bold text-slate-800 text-sm font-mono">{company.crNumber || '-'}</span>
          </div>
        </div>

        {/* قواعد التسعير الحالية للشركة */}
        <div className="p-5 rounded-2xl bg-brand-50/50 border border-brand-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-brand-900">
              <DollarSign className="w-4 h-4 text-brand-600" />
              <span>إعدادات التسعير المخصصة لهذه الشركة</span>
            </div>
            <button
              onClick={() => {
                if (!isCurrentActive) switchCompany(company.id);
                navigate('/settings');
              }}
              className="text-xs font-bold text-brand-700 hover:underline"
            >
              تعديل أسعار هذه الشركة
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-white p-3 rounded-xl border border-brand-100">
              <span className="text-slate-400 block mb-0.5">من 1 إلى 19 دقيقة</span>
              <span className="font-black text-brand-900 text-base">{config.tier1Price || 20} ريال</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-brand-100">
              <span className="text-slate-400 block mb-0.5">من 20 إلى 29 دقيقة</span>
              <span className="font-black text-brand-900 text-base">{config.tier2Price || 30} ريال</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-brand-100">
              <span className="text-slate-400 block mb-0.5">من 30 إلى 60 دقيقة</span>
              <span className="font-black text-brand-900 text-base">{config.tier3Price || 50} ريال</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-brand-100">
              <span className="text-slate-400 block mb-0.5">كل ساعة إضافية</span>
              <span className="font-black text-brand-900 text-base">+{config.extraHourRate || 50} ريال</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
