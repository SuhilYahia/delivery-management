import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import CompanyFormModal from '../components/companies/CompanyFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Badge from '../components/common/Badge';
import { formatArabicDate } from '../utils/dateUtils';
import {
  Building2,
  Plus,
  Check,
  Edit,
  Trash2,
  Power,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function Companies() {
  const {
    companies,
    activeCompanyId,
    switchCompany,
    toggleCompanyStatus,
    deleteCompany,
  } = useCompany();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState(null);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* الرأس */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الشركات Multi-Tenant</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة حسابات الشركات المستقلة، عزل البيانات، واختيار الشركة النشطة للعمليات
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل شركة جديدة</span>
        </button>
      </div>

      {/* بطاقات الشركات المسجلة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {companies.map(company => {
          const isActiveSelected = company.id === activeCompanyId;

          return (
            <div
              key={company.id}
              className={`relative bg-white rounded-2xl p-5 border transition-all duration-200 shadow-xs flex flex-col justify-between ${
                isActiveSelected
                  ? 'border-brand-500 ring-2 ring-brand-500/10 shadow-md'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* شارة الشركة النشطة الحالية */}
              {isActiveSelected && (
                <div className="absolute -top-3 left-6 bg-brand-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>الشركة النشطة الحالية</span>
                </div>
              )}

              <div>
                {/* رأس البطاقة */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{company.name}</h3>
                      <p className="text-xs text-slate-500">{company.managerName}</p>
                    </div>
                  </div>

                  <Badge variant={company.isActive ? 'green' : 'gray'} dot size="sm">
                    {company.isActive ? 'مفعلة' : 'معطلة'}
                  </Badge>
                </div>

                {/* التفاصيل الأساسية */}
                <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      المدينة:
                    </span>
                    <span className="font-bold text-slate-800">{company.city || 'الرياض'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      الجوال:
                    </span>
                    <span className="font-mono text-slate-800" dir="ltr">{company.phone || '-'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      البريد:
                    </span>
                    <span className="text-slate-800 truncate max-w-[150px]" dir="ltr">{company.email || '-'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      تاريخ التسجيل:
                    </span>
                    <span className="text-slate-800">{formatArabicDate(company.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="pt-4 mt-2 flex items-center justify-between gap-2">
                {!isActiveSelected ? (
                  <button
                    onClick={() => switchCompany(company.id)}
                    className="flex-1 py-2 px-3 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition text-center"
                  >
                    تحديد كالشركة النشطة
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl flex-1 text-center">
                    قيد العمل حالياً
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/companies/${company.id}`)}
                    className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                    title="تفاصيل الشركة"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingCompany(company)}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="تعديل البيانات"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleCompanyStatus(company.id)}
                    className={`p-2 rounded-lg transition ${
                      company.isActive
                        ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={company.isActive ? 'تعطيل الشركة' : 'تفعيل الشركة'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  {companies.length > 1 && (
                    <button
                      onClick={() => setDeletingCompanyId(company.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="حذف الشركة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* مودال تسجيل شركة جديدة */}
      <CompanyFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* مودال تعديل شركة */}
      {editingCompany && (
        <CompanyFormModal
          isOpen={!!editingCompany}
          onClose={() => setEditingCompany(null)}
          initialData={editingCompany}
        />
      )}

      {/* تأكيد حذف شركة */}
      <ConfirmDialog
        isOpen={!!deletingCompanyId}
        onClose={() => setDeletingCompanyId(null)}
        onConfirm={async () => {
          if (deletingCompanyId) {
            await deleteCompany(deletingCompanyId);
          }
        }}
        title="تأكيد حذف الشركة"
        message="تحذير هام: سيؤدي حذف الشركة إلى حذف جميع المشاوير والموصلين وإعدادات التسعير المرتبطة بها نهائياً. هل أنت متأكد؟"
        confirmText="نعم، حذف الشركة وبياناتها"
      />
    </div>
  );
}
