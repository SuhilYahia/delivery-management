import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  BarChart3,
  Building2,
  Settings,
  ChevronRight,
  ChevronLeft,
  Package,
} from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';

export default function Sidebar({ isOpen, onToggle }) {
  const { activeCompany } = useCompany();

  const navigation = [
    { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
    { name: 'المشاوير', href: '/trips', icon: Truck },
    { name: 'الموصلون', href: '/drivers', icon: Users },
    { name: 'التقارير', href: '/reports', icon: BarChart3 },
    { name: 'إدارة الشركات', href: '/companies', icon: Building2 },
    { name: 'إعدادات الشركة والتسعير', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden no-print"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 right-0 z-40 flex flex-col bg-slate-900 text-slate-300 border-l border-slate-800 transition-all duration-300 no-print ${
          isOpen ? 'w-64 translate-x-0' : 'w-64 translate-x-full lg:w-20 lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0'}`}>
              <h1 className="font-extrabold text-sm text-white tracking-wide truncate">
                نظام المجد
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                إدارة التوصيل والمشاوير
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isOpen ? 'طي القائمة' : 'توسيع القائمة'}
          >
            {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Company Active Pill (when expanded) */}
        {isOpen && activeCompany && (
          <div className="mx-3 mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              الشركة النشطة
            </p>
            <p className="text-xs font-bold text-brand-300 truncate mt-0.5">
              {activeCompany.name}
            </p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`truncate transition-opacity ${isOpen ? 'opacity-100' : 'lg:opacity-0 lg:w-0'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-[11px] text-slate-500 text-center">
          {isOpen ? (
            <p>Al Majd Delivery v1.0</p>
          ) : (
            <span className="hidden lg:block text-slate-600 font-bold">1.0</span>
          )}
        </div>
      </aside>
    </>
  );
}
