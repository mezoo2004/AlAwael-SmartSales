import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { LoadingScreen } from './components/ui';

// Lazy load pages
const WelcomePage = lazy(() => import('./pages/kiosk/WelcomePage'));
const DepartmentSelectionPage = lazy(() => import('./pages/kiosk/DepartmentSelectionPage'));
const ConfigurePage = lazy(() => import('./pages/kiosk/ConfigurePage'));
const ReviewPage = lazy(() => import('./pages/kiosk/ReviewPage'));
const GeneratePage = lazy(() => import('./pages/kiosk/GeneratePage'));
const DesignsPage = lazy(() => import('./pages/kiosk/DesignsPage'));
const ContactPage = lazy(() => import('./pages/kiosk/ContactPage'));
const SuccessPage = lazy(() => import('./pages/kiosk/SuccessPage'));

const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const RequestsPage = lazy(() => import('./pages/dashboard/RequestsPage'));
const RequestDetailsPage = lazy(() => import('./pages/dashboard/RequestDetailsPage'));

const App: React.FC = () => {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen message="جاري التحميل..." />}>
          <Routes>
            {/* Kiosk Routes */}
            <Route path="/" element={<Navigate to="/kiosk" replace />} />
            <Route path="/kiosk" element={<WelcomePage />} />
            <Route path="/kiosk/departments" element={<DepartmentSelectionPage />} />
            <Route path="/kiosk/configure/:departmentId" element={<ConfigurePage />} />
            <Route path="/kiosk/review" element={<ReviewPage />} />
            <Route path="/kiosk/generate" element={<GeneratePage />} />
            <Route path="/kiosk/designs" element={<DesignsPage />} />
            <Route path="/kiosk/contact" element={<ContactPage />} />
            <Route path="/kiosk/success" element={<SuccessPage />} />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/requests" element={<RequestsPage />} />
            <Route path="/dashboard/requests/:id" element={<RequestDetailsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/kiosk" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </SessionProvider>
  );
};

export default App;
