import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, User, Phone, MapPin, MessageCircle } from 'lucide-react';
import { KioskLayout } from '../../components/layout';
import { Button } from '../../components/ui';
import { useSession } from '../../context/SessionContext';
import { getDepartmentById } from '../../data';
import { maskPhone, formatPhoneDisplay } from '../../utils/phone';
import { LeadPersistenceError } from '../../services/leadService';

const contactMethodLabel: Record<string, string> = {
  whatsapp: 'واتساب',
  call: 'اتصال',
  sms: 'رسالة نصية',
};

const FinalReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, submitSession, setJourneyStep } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.contactInfo || !session.customerId) {
      navigate('/kiosk/contact', { replace: true });
      return;
    }
    if (!session.selectedDesignId) {
      navigate('/kiosk/designs', { replace: true });
      return;
    }
    if (session.journeyStep !== 'final_review') {
      setJourneyStep('final_review');
    }
  }, [
    session?.contactInfo,
    session?.customerId,
    session?.selectedDesignId,
    session?.journeyStep,
    navigate,
    setJourneyStep,
  ]);

  const department = session?.departmentId
    ? getDepartmentById(session.departmentId)
    : null;

  const selectedDesign = useMemo(
    () => session?.generatedDesigns.find((d) => d.id === session.selectedDesignId),
    [session]
  );

  const contact = session?.contactInfo;

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const requestNumber = await submitSession();
      navigate('/kiosk/success', { state: { requestNumber } });
    } catch (error) {
      const message =
        error instanceof LeadPersistenceError
          ? error.message
          : 'تعذر إرسال الطلب حاليًا. تحقق من الاتصال وحاول مرة أخرى.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!contact) {
    return null;
  }

  return (
    <KioskLayout currentStep={5}>
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-brand-dark mb-4">
              المراجعة النهائية
            </h1>
            <p className="text-xl text-brand-gray">
              تأكد من بياناتك والتصميم المختار قبل إرسال الطلب
            </p>
          </div>

          {/* Contact confirmation card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-brand-gray/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-brand-dark">بيانات التواصل</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/kiosk/contact?edit=1')}
              >
                تعديل بيانات التواصل
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-brand-light rounded-xl">
                <User className="w-5 h-5 text-brand-orange shrink-0" />
                <div>
                  <p className="text-sm text-brand-gray">الاسم</p>
                  <p className="font-bold text-brand-dark">{contact.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-light rounded-xl">
                <Phone className="w-5 h-5 text-brand-orange shrink-0" />
                <div>
                  <p className="text-sm text-brand-gray">رقم الجوال</p>
                  <p className="font-bold text-brand-dark direction-ltr text-right" title={formatPhoneDisplay(contact.phone)}>
                    {maskPhone(contact.phone)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-light rounded-xl">
                <MapPin className="w-5 h-5 text-brand-orange shrink-0" />
                <div>
                  <p className="text-sm text-brand-gray">المدينة</p>
                  <p className="font-bold text-brand-dark">{contact.city || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-brand-light rounded-xl">
                <MessageCircle className="w-5 h-5 text-brand-orange shrink-0" />
                <div>
                  <p className="text-sm text-brand-gray">طريقة التواصل</p>
                  <p className="font-bold text-brand-dark">
                    {contact.preferredContactMethod
                      ? contactMethodLabel[contact.preferredContactMethod]
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Design / department summary */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-brand-gray/20 mb-6">
            <h2 className="text-xl font-bold text-brand-dark mb-4">ملخص الطلب</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-brand-light rounded-xl">
                <p className="text-sm text-brand-gray">القسم</p>
                <p className="font-bold text-brand-dark">{department?.name || '—'}</p>
              </div>
              <div className="p-4 bg-brand-light rounded-xl">
                <p className="text-sm text-brand-gray">التصميم المختار</p>
                <p className="font-bold text-brand-dark">{selectedDesign?.title || '—'}</p>
              </div>
            </div>
            {selectedDesign && (
              <div className="rounded-xl overflow-hidden">
                <img
                  src={selectedDesign.thumbnailUrl || selectedDesign.imageUrl}
                  alt={selectedDesign.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
          </div>

          {submitError && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-700 mb-6">
              <p className="font-medium mb-3">{submitError}</p>
              <Button variant="secondary" onClick={handleSubmit} disabled={isSubmitting}>
                إعادة المحاولة
              </Button>
            </div>
          )}

          <div className="flex gap-6 justify-center mt-8 mb-8">
            <Button
              variant="secondary"
              size="xl"
              onClick={() => navigate('/kiosk/designs')}
              disabled={isSubmitting}
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              السابق
            </Button>
            <Button
              size="xl"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              className="px-12"
            >
              إرسال الطلب
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>
      </div>
    </KioskLayout>
  );
};

export default FinalReviewPage;
