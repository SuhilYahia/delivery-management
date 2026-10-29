import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ToastContainer from '../common/ToastContainer';
import TripFormModal from '../trips/TripFormModal';
import CompanyFormModal from '../companies/CompanyFormModal';
import AiAssistantModal from '../ai/AiAssistantModal';
import OnboardingCompany from '../../pages/OnboardingCompany';
import { useCompany } from '../../context/CompanyContext';
import LoadingSpinner from '../common/LoadingSpinner';

export default function Layout() {
  const { companies, loading } = useCompany();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // حالة المودالات العامة التي تفتح من Topbar
  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
  const [isNewCompanyOpen, setIsNewCompanyOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner text="جارٍ تهيئة نظام المجد لإدارة التوصيل..." />
      </div>
    );
  }

  // إذا لم تكن هناك أي شركة مسجلة، اعرض شاشة إنشاء الشركة الأولى فوراً
  if (!companies || companies.length === 0) {
    return <OnboardingCompany />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-cairo">
      {/* القائمة الجانبية */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* المحتوى الرئيسي */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'lg:mr-64' : 'lg:mr-20'
        }`}
      >
        {/* الشريط العلوي */}
        <Topbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onOpenNewTrip={() => setIsNewTripOpen(true)}
          onOpenNewCompany={() => setIsNewCompanyOpen(true)}
          onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        />

        {/* مساحة الصفحات */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* مودال المساعد الذكي */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
      />

      {/* مودال تسجيل مشوار جديد السريع */}
      <TripFormModal
        isOpen={isNewTripOpen}
        onClose={() => setIsNewTripOpen(false)}
      />

      {/* مودال تسجيل شركة جديدة */}
      <CompanyFormModal
        isOpen={isNewCompanyOpen}
        onClose={() => setIsNewCompanyOpen(false)}
      />

      {/* حاوية التنبيهات الإشعارات */}
      <ToastContainer />
    </div>
  );
}
