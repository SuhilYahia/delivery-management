import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Building2,
  ChevronDown,
  Plus,
  Calendar,
  RotateCcw,
  Check,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import { useApp } from '../../context/AppContext';
import { formatArabicDate, getTodayDateString } from '../../utils/dateUtils';

export default function Topbar({ onMenuClick, onOpenNewTrip, onOpenNewCompany, onOpenAiAssistant }) {
  const { companies, activeCompanyId, activeCompany, switchCompany } = useCompany();
  const { resetToFactoryDefaults } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const todayStr = getTodayDateString();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs no-print">
      {/* Right side: Mobile Menu + Company Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Company Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300 transition-all text-right focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-[10px] text-slate-400 font-medium">الشركة النشطة</p>
              <p className="text-xs font-bold text-slate-800 truncate max-w-[170px]">
                {activeCompany ? activeCompany.name : 'اختر شركة'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-scale-in">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  قائمة الشركات المسجلة ({companies.length})
                </p>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {companies.map(c => {
                  const isCurrent = c.id === activeCompanyId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        switchCompany(c.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-right text-xs transition-colors ${
                        isCurrent
                          ? 'bg-brand-50/80 text-brand-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className={`w-4 h-4 ${isCurrent ? 'text-brand-600' : 'text-slate-400'}`} />
                        <span className="truncate">{c.name}</span>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-brand-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="p-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenNewCompany();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-brand-600 bg-brand-50/60 rounded-xl hover:bg-brand-100 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  تسجيل شركة جديدة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Left side: Date + Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-medium text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatArabicDate(todayStr)}</span>
        </div>

        {/* Reset Mock Data button */}
        <button
          onClick={() => {
            if (window.confirm('هل تريد إعادة تعيين البيانات التجريبية لحالتها الأولى؟')) {
              resetToFactoryDefaults();
            }
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="إعادة تعيين البيانات التجريبية"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Quick AI Assistant Button */}
        <button
          onClick={onOpenAiAssistant}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-brand-700 hover:from-indigo-700 hover:to-brand-800 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 transition-all hover:shadow hover:scale-[1.02] active:scale-95"
          title="المساعد الذكي (OpenAI GPT-4o)"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="hidden sm:inline">المساعد الذكي</span>
        </button>

        {/* Quick New Trip Button */}
        <button
          onClick={onOpenNewTrip}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm shadow-brand-600/30 transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" />
          <span>مشوار جديد</span>
        </button>
      </div>
    </header>
  );
}
