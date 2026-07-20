import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserX } from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import { Card, EmptyState, LoadingScreen } from '../../components/ui';
import {
  fetchIncompleteLeads,
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

const IncompleteLeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<IncompleteLeadView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isSupabaseConfigured) {
        setError(getSupabaseConfigWarning());
        setLoading(false);
        return;
      }

      try {
        const data = await fetchIncompleteLeads();
        if (!cancelled) setLeads(data);
      } catch {
        if (!cancelled) setError('تعذر تحميل العملاء غير المكتملين');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      lead.fullName.toLowerCase().includes(q) ||
      lead.phoneE164.includes(search) ||
      formatPhoneDisplay(lead.phoneE164).includes(search) ||
      (lead.city || '').includes(search)
    );
  });

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">عملاء لم يكملوا الطلب</h1>
        <p className="text-brand-gray">عملاء حفظوا بيانات التواصل دون إكمال الطلب</p>
      </div>

      <Card padding="md" className="mb-6">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gray" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الجوال أو المدينة..."
            className="input pr-12"
          />
        </div>
      </Card>

      {loading ? (
        <LoadingScreen message="جاري تحميل العملاء..." />
      ) : error ? (
        <EmptyState title="غير متاح" message={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="لا يوجد عملاء غير مكتملين"
          message="عند حفظ بيانات التواصل في الكيوسك دون إكمال الطلب ستظهر هنا"
          icon={<UserX className="w-12 h-12 text-brand-gray" />}
        />
      ) : (
        <Card padding="none">
          <table className="w-full">
            <thead className="bg-brand-light">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">العميل</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">المدينة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">الخطوة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">التواصل</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">التسويق</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">آخر نشاط</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-brand-gray">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-light">
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => navigate(`/dashboard/incomplete-leads/${lead.id}`)}
                  className="hover:bg-brand-light/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-brand-dark">{lead.fullName}</p>
                    <p className="text-sm text-brand-gray direction-ltr text-right">
                      {formatPhoneDisplay(lead.phoneE164)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-brand-dark">{lead.city || '—'}</td>
                  <td className="px-6 py-4 text-brand-dark">
                    {getJourneyStepLabel(lead.currentStep)}
                  </td>
                  <td className="px-6 py-4 text-brand-dark">
                    {lead.preferredContactMethod
                      ? contactMethodLabel[lead.preferredContactMethod]
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {lead.marketingConsent ? (
                      <span className="text-green-600 text-sm font-medium">موافق</span>
                    ) : (
                      <span className="text-brand-gray text-sm">غير موافق</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-brand-gray text-sm">
                    {formatDate(lead.lastActivityAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      طلب غير مكتمل
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default IncompleteLeadsPage;
