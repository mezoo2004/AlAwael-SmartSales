import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  UserX,
} from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'requests', label: 'الطلبات', icon: FileText, path: '/dashboard/requests' },
  { id: 'incomplete', label: 'عملاء لم يكملوا الطلب', icon: UserX, path: '/dashboard/incomplete-leads' },
  { id: 'settings', label: 'الإعدادات', icon: Settings, path: '/dashboard/settings' },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-brand-light flex">
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 h-full bg-white shadow-xl z-40
          transition-all duration-300
          ${isSidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        <div className="p-4 border-b border-brand-light">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <h1 className="text-xl font-bold text-brand-orange">نظام المبيعات</h1>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-brand-light transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-xl
                  transition-all duration-200
                  ${isActive
                    ? 'bg-brand-orange text-white'
                    : 'text-brand-dark hover:bg-brand-light'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 right-0 left-0 p-4">
          <button
            onClick={() => navigate('/kiosk')}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl
              text-brand-gray hover:bg-red-50 hover:text-red-500
              transition-all duration-200
            `}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="font-medium">العودة للكيوسك</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
          flex-1 transition-all duration-300
          ${isSidebarOpen ? 'mr-64' : 'mr-20'}
        `}
      >
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
