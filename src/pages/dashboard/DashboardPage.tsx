import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, DollarSign, Phone, CheckCircle, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card } from '../../components/ui';
import { mockRequests, getStatusConfig, departments } from '../../data';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Calculate stats
  const stats = {
    new: mockRequests.filter(r => r.status === 'new').length,
    needsFollowUp: mockRequests.filter(r => r.status === 'needs-follow-up').length,
    pricing: mockRequests.filter(r => r.status === 'pricing').length,
    contacted: mockRequests.filter(r => r.status === 'contacted').length,
    approved: mockRequests.filter(r => r.status === 'approved').length,
    completed: mockRequests.filter(r => r.status === 'completed').length,
  };

  const statCards = [
    { key: 'new', label: 'الطلبات الجديدة', count: stats.new, color: '#FF5A00', bg: '#FFF3EB', icon: FileText },
    { key: 'needs-follow-up', label: 'تحتاج متابعة', count: stats.needsFollowUp, color: '#F59E0B', bg: '#FFF8EB', icon: Clock },
    { key: 'pricing', label: 'قيد التسعير', count: stats.pricing, color: '#3B82F6', bg: '#EBF5FF', icon: DollarSign },
    { key: 'contacted', label: 'تم التواصل', count: stats.contacted, color: '#8B5CF6', bg: '#F5EBFF', icon: Phone },
    { key: 'approved', label: 'تمت الموافقة', count: stats.approved, color: '#10B981', bg: '#EBFFF5', icon: CheckCircle },
    { key: 'completed', label: 'مكتمل', count: stats.completed, color: '#059669', bg: '#EBFDF5', icon: TrendingUp },
  ];

  const recentRequests = mockRequests.slice(0, 5);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">لوحة التحكم</h1>
        <p className="text-brand-gray">نظرة عامة على الطلبات والإحصائيات</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.key}
              padding="md"
              className="cursor-pointer hover:shadow-xl transition-all"
              onClick={() => navigate('/dashboard/requests?status=' + stat.key)}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: stat.bg }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <p className="text-3xl font-bold text-brand-dark">{stat.count}</p>
                <p className="text-sm text-brand-gray mt-1">{stat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Requests Table */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-6 py-4 border-b border-brand-light">
              <h2 className="text-xl font-bold text-brand-dark">الطلبات الأخيرة</h2>
            </div>
            <div className="divide-y divide-brand-light">
              {recentRequests.map((request) => {
                const statusConfig = getStatusConfig(request.status);
                const department = departments.find(d => d.id === request.departmentId);

                return (
                  <div
                    key={request.id}
                    onClick={() => navigate(`/dashboard/requests/${request.id}`)}
                    className="px-6 py-4 hover:bg-brand-light/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-bold text-brand-dark">
                            {request.requestNumber}
                          </span>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: statusConfig.bgColor,
                              color: statusConfig.color,
                            }}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-brand-gray">
                          <span>{department?.name}</span>
                          <span>•</span>
                          <span>{request.contactInfo.name}</span>
                          <span>•</span>
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-brand-dark">
                          {request.contactInfo.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-brand-light">
              <button
                onClick={() => navigate('/dashboard/requests')}
                className="text-brand-orange font-medium hover:underline"
              >
                عرض جميع الطلبات
              </button>
            </div>
          </Card>
        </div>

        {/* Department Breakdown */}
        <div>
          <Card padding="lg">
            <h2 className="text-xl font-bold text-brand-dark mb-6">الطلبات حسب القسم</h2>
            <div className="space-y-4">
              {departments.map((dept) => {
                const count = mockRequests.filter(r => r.departmentId === dept.id).length;
                const percent = mockRequests.length > 0
                  ? Math.round((count / mockRequests.length) * 100)
                  : 0;

                return (
                  <div key={dept.id}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-brand-dark">{dept.name}</span>
                      <span className="text-brand-gray">{count} طلب</span>
                    </div>
                    <div className="h-2 bg-brand-light rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-orange-gradient rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
