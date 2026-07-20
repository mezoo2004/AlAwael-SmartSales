import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, Phone, MessageCircle, MapPin, Clock, User, Calendar,
  Edit2, FileText, Eye, CheckCircle
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, EmptyState } from '../../components/ui';
import { getRequestById, getStatusConfig, departments, getEmployeeById, getQuestionsByDepartment } from '../../data';
import { DepartmentId } from '../../types';

const RequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const request = id ? getRequestById(id) : null;

  if (!request) {
    return (
      <DashboardLayout>
        <EmptyState
          title="الطلب غير موجود"
          message="لم يتم العثور على الطلب المطلوب"
          action={<Button onClick={() => navigate('/dashboard/requests')}>العودة للطلبات</Button>}
        />
      </DashboardLayout>
    );
  }

  const statusConfig = getStatusConfig(request.status);
  const department = departments.find(d => d.id === request.departmentId);
  const employee = request.assignedEmployeeId
    ? getEmployeeById(request.assignedEmployeeId)
    : null;
  const questions = getQuestionsByDepartment(request.departmentId as DepartmentId);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const renderAnswer = (value: unknown): string => {
    if (value === undefined || value === null) return '-';
    if (Array.isArray(value)) return value.join('، ');
    if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (obj.width || obj.height) {
        return `العرض: ${obj.width || '-'} × الارتفاع: ${obj.height || '-'} × العمق: ${obj.depth || '-'} ${obj.unit || 'سم'}`;
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/requests')}
            className="p-2 hover:bg-brand-light rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-dark">{request.requestNumber}</h1>
              <span
                className="px-4 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: statusConfig.bgColor,
                  color: statusConfig.color,
                }}
              >
                {statusConfig.label}
              </span>
            </div>
            <p className="text-brand-gray mt-1">
              {department?.name} • {formatDate(request.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={<FileText className="w-5 h-5" />}>
            طباعة
          </Button>
          <Button icon={<Edit2 className="w-5 h-5" />}>
            تغيير الحالة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card padding="lg">
            <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-orange" />
              بيانات العميل
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-brand-gray mb-1">الاسم</p>
                <p className="font-medium text-brand-dark">{request.contactInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-brand-gray mb-1">رقم الجوال</p>
                <p className="font-medium text-brand-dark direction-ltr text-right">{request.contactInfo.phone}</p>
              </div>
              <div>
                <p className="text-sm text-brand-gray mb-1">المدينة</p>
                <p className="font-medium text-brand-dark">{request.contactInfo.city}</p>
              </div>
              <div>
                <p className="text-sm text-brand-gray mb-1">الحي</p>
                <p className="font-medium text-brand-dark">{request.contactInfo.neighborhood || '-'}</p>
              </div>
              {request.contactInfo.email && (
                <div className="col-span-2">
                  <p className="text-sm text-brand-gray mb-1">البريد الإلكتروني</p>
                  <p className="font-medium text-brand-dark">{request.contactInfo.email}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-brand-light">
              <Button
                size="sm"
                icon={<Phone className="w-4 h-4" />}
                onClick={() => window.open(`tel:${request.contactInfo.phone}`)}
              >
                اتصال
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<MessageCircle className="w-4 h-4" />}
                onClick={() => window.open(`https://wa.me/${request.contactInfo.phone}`)}
              >
                واتساب
              </Button>
              <Button size="sm" variant="ghost">
                {request.contactInfo.preferredContactMethod === 'whatsapp'
                  ? 'واتساب: مفضل'
                  : request.contactInfo.preferredContactMethod === 'call'
                    ? 'اتصال: مفضل'
                    : request.contactInfo.preferredContactMethod === 'sms'
                      ? 'رسالة: مفضلة'
                      : 'طريقة التواصل غير محددة'}
              </Button>
            </div>
          </Card>

          {/* Answers */}
          <Card padding="lg">
            <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-orange" />
              تفاصيل الطلب
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.slice(0, 15).map((question) => {
                  const answer = request.answers[question.id];
                  if (answer === undefined) return null;

                  return (
                    <div key={question.id} className="p-3 bg-brand-light rounded-xl">
                      <p className="text-sm text-brand-gray mb-1">{question.title}</p>
                      <p className="font-medium text-brand-dark">
                        {question.options?.find(o => o.value === answer)?.label || renderAnswer(answer)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Measurements */}
          {request.measurements && (request.measurements.width || request.measurements.height) && (
            <Card padding="lg">
              <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-orange" />
                المقاسات
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {request.measurements.width && (
                  <div className="p-4 bg-brand-light rounded-xl text-center">
                    <p className="text-sm text-brand-gray mb-1">العرض</p>
                    <p className="text-2xl font-bold text-brand-dark">{request.measurements.width} {request.measurements.unit}</p>
                  </div>
                )}
                {request.measurements.height && (
                  <div className="p-4 bg-brand-light rounded-xl text-center">
                    <p className="text-sm text-brand-gray mb-1">الارتفاع</p>
                    <p className="text-2xl font-bold text-brand-dark">{request.measurements.height} {request.measurements.unit}</p>
                  </div>
                )}
                {request.measurements.depth && (
                  <div className="p-4 bg-brand-light rounded-xl text-center">
                    <p className="text-sm text-brand-gray mb-1">العمق</p>
                    <p className="text-2xl font-bold text-brand-dark">{request.measurements.depth} {request.measurements.unit}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Generated Designs */}
          <Card padding="lg">
            <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-orange" />
              التصاميم المنشأة ({request.generatedDesigns.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {request.generatedDesigns.map((design) => (
                <div
                  key={design.id}
                  className={`rounded-xl overflow-hidden ${
                    design.id === request.selectedDesignId
                      ? 'ring-2 ring-brand-orange'
                      : ''
                  }`}
                >
                  <div className="aspect-video bg-brand-light">
                    <img
                      src={design.thumbnailUrl}
                      alt={design.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 bg-white">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-brand-dark">{design.title}</h3>
                      {design.id === request.selectedDesignId && (
                        <span className="px-2 py-0.5 bg-brand-orange text-white text-xs rounded-full">
                          الاختيار
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-brand-gray">{design.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Assignment */}
          <Card padding="lg">
            <h2 className="text-lg font-bold text-brand-dark mb-4">الحالة والمسؤول</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-brand-gray mb-2">الحالة الحالية</p>
                <div
                  className="px-4 py-3 rounded-xl font-medium"
                  style={{
                    backgroundColor: statusConfig.bgColor,
                    color: statusConfig.color,
                  }}
                >
                  {statusConfig.label}
                </div>
              </div>
              <div>
                <p className="text-sm text-brand-gray mb-2">الموظف المسؤول</p>
                <div className="p-3 bg-brand-light rounded-xl">
                  <p className="font-medium text-brand-dark">{employee?.name || 'غير معين'}</p>
                </div>
              </div>
              {request.followUpDate && (
                <div>
                  <p className="text-sm text-brand-gray mb-2">متابعة في</p>
                  <div className="p-3 bg-brand-light rounded-xl">
                    <p className="font-medium text-brand-dark">{formatDate(request.followUpDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Activity Log */}
          <Card padding="lg">
            <h2 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-orange" />
              سجل النشاط
            </h2>
            <div className="space-y-4">
              {request.activityLog.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-brand-gray" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-brand-dark">{activity.description}</p>
                    <p className="text-xs text-brand-gray">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card padding="lg">
            <h2 className="text-lg font-bold text-brand-dark mb-4">إجراءات سريعة</h2>
            <div className="space-y-3">
              <Button fullWidth variant="secondary" size="sm" icon={<Phone className="w-4 h-4" />}>
                اتصال بالعميل
              </Button>
              <Button fullWidth variant="secondary" size="sm" icon={<MessageCircle className="w-4 h-4" />}>
                فتح واتساب
              </Button>
              <Button fullWidth variant="secondary" size="sm" icon={<Edit2 className="w-4 h-4" />}>
                إضافة ملاحظة
              </Button>
              <Button fullWidth variant="secondary" size="sm" icon={<Calendar className="w-4 h-4" />}>
                تحديد متابعة
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RequestDetailsPage;
