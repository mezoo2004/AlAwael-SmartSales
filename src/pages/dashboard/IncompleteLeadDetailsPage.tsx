import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Phone, MessageCircle, MapPin, User, Clock, Calendar } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, Button, EmptyState, LoadingScreen } from '../../components/ui';
import {
  fetchIncompleteLeadById,
  IncompleteLeadView,
  isSupabaseConfigured,
  getSupabaseConfigWarning,
} from '../../services/leadService';
import { formatPhoneDisplay } from '../../utils/phone';
import { getJourneyStepLabel } from '../../utils/journeySteps';

const contactMethodLabel: Record<string, string> = {
  whatsapp: 'واتساب',
  call: 'اتصال',
  sms: 'رسالة نصية',
};

const IncompleteLeadDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<IncompleteLeadView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) return;
      if (!isSupabaseConfigured) {
        setError(getSupabaseConfigWarning());
        setLoading(false);
        return;
      }

      try {
        const data = await fetchIncompleteLeadById(id);
        if (!cancelled) {
          if (!data) setError('العميل غير موجود');
          else setLead(data);
        }
      } catch {
        if (!cancelled) setError('تعذر تحميل بيانات العميل');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [id]);

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingScreen message="جاري التحميل..." />
      </DashboardLayout>
    );
  }

  if (error || !lead) {
    return (
      <DashboardLayout>
        <EmptyState
          title="غير متاح"
          message={error || 'العميل غير موجود'}
          action={
            <Button onClick={() => navigate('/dashboard/incomplete-leads')}>
              العودة للقائمة
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate('/dashboard/incomplete-leads')}
        className="flex items-center gap-2 text-brand-gray hover:text-brand-orange mb-6"
      >
        <ArrowRight className="w-5 h-5" />
        العودة لعملاء لم يكملوا الطلب
      </button>

      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-brand-dark">{lead.fullName}</h1>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
          طلب غير مكتمل
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h2 className="text-xl font-bold text-brand-dark mb-6">بيانات التواصل</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-brand-orange" />
              <div>
                <p className="text-sm text-brand-gray">الاسم</p>
                <p className="font-medium text-brand-dark">{lead.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-brand-orange" />
              <div>
                <p className="text-sm text-brand-gray">رقم الجوال</p>
                <p className="font-medium text-brand-dark direction-ltr text-right">
                  {formatPhoneDisplay(lead.phoneE164)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-brand-orange" />
              <div>
                <p className="text-sm text-brand-gray">المدينة</p>
                <p className="font-medium text-brand-dark">{lead.city || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-brand-orange" />
              <div>
                <p className="text-sm text-brand-gray">طريقة التواصل المفضلة</p>
                <p className="font-medium text-brand-dark">
                  {lead.preferredContactMethod
                    ? contactMethodLabel[lead.preferredContactMethod]
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              fullWidth
              variant="secondary"
              size="sm"
              icon={<Phone className="w-4 h-4" />}
              onClick={() => window.open(`tel:${lead.phoneE164}`)}
            >
              اتصال
            </Button>
            <Button
              fullWidth
              size="sm"
              icon={<MessageCircle className="w-4 h-4" />}
              onClick={() => window.open(`https://wa.me/${lead.phoneE164.replace('+', '')}`)}
            >
              واتساب
            </Button>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-xl font-bold text-brand-dark mb-6">حالة الرحلة</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand-orange" />
              <div>
                <p className="text-sm text-brand-gray">الخطوة الحالية</p>
                <p className="font-medium text-brand-dark">
                  {getJourneyStepLabel(lead.currentStep)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-brand-orange" />
              <div>
                <p className="text-sm text-brand-gray">تاريخ البدء</p>
                <p className="font-medium text-brand-dark">{formatDate(lead.startedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-brand-orange" />
              <div>
                <p className="text-sm text-brand-gray">آخر نشاط</p>
                <p className="font-medium text-brand-dark">{formatDate(lead.lastActivityAt)}</p>
              </div>
            </div>
            <div className="p-4 bg-brand-light rounded-xl">
              <p className="text-sm text-brand-gray mb-1">الموافقة التسويقية</p>
              <p className="font-medium text-brand-dark">
                {lead.marketingConsent ? 'موافق على الرسائل التسويقية' : 'لم يوافق على التسويق'}
              </p>
            </div>
            <p className="text-sm text-brand-gray leading-relaxed">
              لم يُكمل هذا العميل الاستبيان أو إرسال الطلب بعد. تظهر هنا فقط البيانات المتوفرة
              حتى الآن دون إجابات غير مكتملة.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IncompleteLeadDetailsPage;
