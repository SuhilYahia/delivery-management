import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CompanyProvider } from './context/CompanyContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';

// الصفحات
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import Drivers from './pages/Drivers';
import Companies from './pages/Companies';
import CompanyDetails from './pages/CompanyDetails';
import Reports from './pages/Reports';
import DriverReport from './pages/DriverReport';
import DeliveryReport from './pages/DeliveryReport';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <CompanyProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="trips" element={<Trips />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/driver" element={<DriverReport />} />
              <Route path="reports/delivery" element={<DeliveryReport />} />
              <Route path="companies" element={<Companies />} />
              <Route path="companies/:companyId" element={<CompanyDetails />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </CompanyProvider>
  );
}
