import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, EmptyState } from '../../components/ui';
import { mockRequests, getStatusConfig, departments, getEmployeeById, requestStatuses } from '../../data';

const RequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const filteredRequests = useMemo(() => {
    let result = [...mockRequests];

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(r =>
        r.requestNumber.toLowerCase().includes(searchLower) ||
        r.contactInfo.name.toLowerCase().includes(searchLower) ||
        r.contactInfo.phone.includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      result = result.filter(r => r.departmentId === departmentFilter);
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [search, statusFilter, departmentFilter]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">الطلبات</h1>
        <p className="text-brand-gray">جميع الطلبات الواردة</p>
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gray" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث برقم الطلب، اسم العميل، أو رقم الجوال..."
                className="input pr-12"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="all">جميع الحالات</option>
            {requestStatuses.map((status) => (
              <option key={status.id} value={status.id}>{status.label}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="input w-full md:w-48"
          >
            <option value="all">جميع الأقسام</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Results Header */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-brand-gray">
          عرض {filteredRequests.length} طلب
        </p>
      </div>

      {/* Table */}
      <Card padding="none">
        {filteredRequests.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات"
            message="لم يتم العثور على طلبات تطابق البحث"
          />
        ) : (
          <table className="w-full">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">رقم الطلب</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">العميل</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">القسم</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">التاريخ</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">الحالة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-light">
              {filteredRequests.map((request) => {
                const statusConfig = getStatusConfig(request.status);
                const department = departments.find(d => d.id === request.departmentId);
                const employee = request.assignedEmployeeId
                  ? getEmployeeById(request.assignedEmployeeId)
                  : null;

                return (
                  <tr
                    key={request.id}
                    onClick={() => navigate(`/dashboard/requests/${request.id}`)}
                    className="hover:bg-brand-light/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-brand-dark">{request.requestNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-brand-dark">{request.contactInfo.name}</p>
                        <p className="text-sm text-brand-gray">{request.contactInfo.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-brand-dark">{department?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-brand-gray">{formatDate(request.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color,
                        }}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-brand-gray">{employee?.name || '-'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default RequestsPage;
