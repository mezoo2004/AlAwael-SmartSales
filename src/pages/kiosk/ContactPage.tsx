import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, Phone } from 'lucide-react';
import { KioskLayout } from '../../components/layout';
import { Button, NumericKeypad } from '../../components/ui';
import { useSession } from '../../context/SessionContext';
import { ContactInfo } from '../../types';
import {
  normalizeSaudiPhone,
  isValidSaudiPhone,
  getSaudiPhoneErrorMessage,
} from '../../utils/phone';
import { CONSENT_TEXT_VERSION } from '../../constants/consent';
import {
  isSupabaseConfigured,
} from '../../services/leadService';

const FORM_DRAFT_KEY = 'showroom_contact_draft';

type CustomerIdentityForm = {
  name: string;
  phone: string;
};

const emptyForm = (): CustomerIdentityForm => ({
  name: '',
  phone: '',
});

const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1';
  const {
    session,
    startNewSession,
    setContactInfo,
    saveContactAsLead,
    updateSavedContact,
  } = useSession();

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showKeypad, setShowKeypad] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ensure a local session exists when arriving from welcome
  useEffect(() => {
    if (!session) {
      startNewSession();
    }
  }, [session, startNewSession]);

  // Prefill from session or temporary draft
  useEffect(() => {
    if (session?.contactInfo) {
      setFormData({
        name: session.contactInfo.name || '',
        phone: session.contactInfo.phone || '',
      });
      return;
    }

    try {
      const draft = localStorage.getItem(FORM_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft) as typeof formData;
        setFormData({
          ...emptyForm(),
          ...parsed,
        });
      }
    } catch {
      // ignore
    }
  }, [session?.contactInfo]);

  // Cache typed values locally (does not replace remote save)
  useEffect(() => {
    try {
      localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(formData));
    } catch {
      // ignore
    }
  }, [formData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = getSaudiPhoneErrorMessage();
    } else if (!isValidSaudiPhone(formData.phone)) {
      newErrors.phone = getSaudiPhoneErrorMessage();
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (): ContactInfo => {
    const normalized = normalizeSaudiPhone(formData.phone)!;
    return {
      name: formData.name.trim(),
      phone: normalized,
      city: '',
      preferredContactMethod: undefined,
      privacyAccepted: true,
      marketingConsent: false,
      consentTimestamp: new Date().toISOString(),
      consentTextVersion: CONSENT_TEXT_VERSION,
      agreedToPrivacy: true,
      requestMeasurementVisit: false,
    };
  };

  const getQuestionnaireStartPath = (): string => {
    return session?.departmentId ? `/kiosk/configure/${session.departmentId}` : '/kiosk/departments';
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload = buildPayload();
    setContactInfo(payload);
    try { localStorage.removeItem(FORM_DRAFT_KEY); } catch { /* ignore */ }

    if (isSupabaseConfigured) {
      const savePromise =
        isEditMode && session?.customerId && session?.leadSessionId
          ? updateSavedContact(payload)
          : saveContactAsLead(payload);
      void savePromise.catch(() => {
        // Contact submission must never block the questionnaire flow.
      });
    }

    navigate(isEditMode ? getQuestionnaireStartPath() : '/kiosk/departments');
  };

  return (
    <KioskLayout currentStep={isEditMode ? 5 : 0}>
      <div className="relative flex-1 overflow-y-auto p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[12%] top-[12%] h-72 w-72 rounded-full bg-brand-orange/14 blur-[95px]" />
          <div className="absolute left-[14%] top-[42%] h-80 w-80 rounded-full bg-white/70 blur-[115px]" />
          <div className="absolute bottom-[10%] right-[34%] h-64 w-64 rounded-full bg-brand-orange/10 blur-[105px]" />
        </div>

        <div className="relative mx-auto flex min-h-full w-full max-w-3xl items-center justify-center py-6">
          <div className="contact-glass-enter w-full overflow-hidden rounded-[36px] border border-white/70 bg-white/38 p-6 shadow-[0_34px_100px_rgba(41,45,50,0.14)] backdrop-blur-[28px] md:p-9">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-orange/13 blur-[70px]" />

            <div className="relative mb-10 text-center">
              <div className="contact-icon-orbit relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-[32px] border border-brand-orange/20 bg-white/38 shadow-[0_18px_54px_rgba(255,90,0,0.16)] backdrop-blur-[28px]" />
                <div className="absolute inset-3 rounded-[26px] bg-brand-orange/10 blur-sm" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-white/78 text-brand-orange shadow-[0_18px_48px_rgba(41,45,50,0.12)] ring-1 ring-white/80">
                  <User className="h-8 w-8" />
                </div>
              </div>

              <h1 className="mb-4 text-4xl font-bold text-brand-dark md:text-5xl">
                بيانات العميل
              </h1>
              <p className="mx-auto max-w-xl text-lg leading-relaxed text-brand-gray md:text-xl">
                بقيت خطوة واحدة ليبدأ الذكاء الاصطناعي ببناء تصميمك.
              </p>

              <div className="mx-auto mt-7 max-w-sm rounded-full border border-white/70 bg-white/44 p-2 shadow-[0_16px_44px_rgba(41,45,50,0.08)] backdrop-blur-[28px]">
                <div className="mb-2 flex items-center justify-center gap-2 text-sm font-bold text-brand-orange">
                  <span>95% مكتمل</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/72 shadow-inner">
                  <div className="contact-progress h-full w-[95%] rounded-full bg-gradient-to-r from-brand-orange via-orange-400 to-brand-orange shadow-[0_0_22px_rgba(255,90,0,0.34)]" />
                </div>
              </div>
            </div>

            <div className="relative space-y-6">
              {/* Name */}
              <div className="contact-field-card group rounded-[32px] border border-white/72 bg-white/42 p-5 shadow-[0_18px_54px_rgba(41,45,50,0.09)] backdrop-blur-[28px] transition-all duration-[350ms] hover:-translate-y-1 hover:bg-white/52 hover:shadow-[0_26px_76px_rgba(41,45,50,0.13)] md:p-6">
                <div className="relative">
                  <User className="pointer-events-none absolute right-5 top-1/2 z-10 h-6 w-6 -translate-y-1/2 text-brand-orange" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`peer h-[76px] w-full rounded-[26px] border bg-white/44 px-5 pb-3 pr-16 pt-8 text-2xl font-bold text-brand-dark shadow-inner outline-none backdrop-blur-[28px] transition-all duration-[350ms] placeholder:text-transparent focus:scale-[1.01] focus:bg-white/62 focus:shadow-[0_0_0_4px_rgba(255,90,0,0.10),0_18px_54px_rgba(255,90,0,0.14)] ${errors.name ? 'border-red-400' : 'border-white/78 focus:border-brand-orange/60'}`}
                    placeholder="أدخل اسمك الكامل"
                    dir="rtl"
                    autoComplete="name"
                  />
                  <label className="pointer-events-none absolute right-16 top-3 flex items-center gap-2 text-sm font-bold text-brand-gray transition-all duration-[350ms] peer-focus:text-brand-orange">
                    الاسم الكامل *
                  </label>
                  <div className="pointer-events-none absolute inset-x-5 top-px h-px bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-80" />
                </div>
                {errors.name && <p className="mt-3 text-sm font-bold text-red-500">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div className="contact-field-card group rounded-[32px] border border-white/72 bg-white/42 p-5 shadow-[0_18px_54px_rgba(41,45,50,0.09)] backdrop-blur-[28px] transition-all duration-[350ms] hover:-translate-y-1 hover:bg-white/52 hover:shadow-[0_26px_76px_rgba(41,45,50,0.13)] md:p-6">
                {showKeypad ? (
                  <div className="rounded-[28px] border border-white/72 bg-white/42 p-4 shadow-inner backdrop-blur-[28px]">
                    <NumericKeypad
                      value={formData.phone.replace(/\D/g, '').slice(0, 15)}
                      onChange={(val) => setFormData({ ...formData, phone: val })}
                      onSubmit={() => setShowKeypad(false)}
                      maxLength={15}
                      placeholder="05XXXXXXXX"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                      <Phone className="pointer-events-none absolute right-5 top-1/2 z-10 h-6 w-6 -translate-y-1/2 text-brand-orange" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`peer h-[76px] w-full rounded-[26px] border bg-white/44 px-5 pb-3 pr-16 pt-8 text-left text-2xl font-bold text-brand-dark shadow-inner outline-none backdrop-blur-[28px] transition-all duration-[350ms] placeholder:text-transparent focus:scale-[1.01] focus:bg-white/62 focus:shadow-[0_0_0_4px_rgba(255,90,0,0.10),0_18px_54px_rgba(255,90,0,0.14)] ${errors.phone ? 'border-red-400' : 'border-white/78 focus:border-brand-orange/60'}`}
                        placeholder="05XXXXXXXX"
                        dir="ltr"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                      <label className="pointer-events-none absolute right-16 top-3 flex items-center gap-2 text-sm font-bold text-brand-gray transition-all duration-[350ms] peer-focus:text-brand-orange">
                        رقم الجوال *
                      </label>
                      <div className="pointer-events-none absolute inset-x-5 top-px h-px bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-80" />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setShowKeypad(true)}
                      className="min-h-[76px] rounded-[24px] border-white/70 bg-white/56 px-6 shadow-[0_14px_36px_rgba(41,45,50,0.08)] backdrop-blur-[28px] transition-all duration-[350ms] hover:-translate-y-1 hover:shadow-[0_20px_54px_rgba(41,45,50,0.13)]"
                    >
                      لوحة المفاتيح
                    </Button>
                  </div>
                )}
                {errors.phone && <p className="mt-3 text-sm font-bold text-red-500">{errors.phone}</p>}
              </div>
            </div>

            <div className="relative mb-2 mt-10 flex justify-center">
              <Button
                size="xl"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                className="contact-submit-button group relative overflow-hidden px-16 shadow-[0_18px_50px_rgba(255,90,0,0.22)] transition-all duration-[350ms] hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(255,90,0,0.30)] active:scale-[0.98]"
              >
                <span className="contact-button-sheen absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100" />
                <span className="relative flex items-center">
                  متابعة
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </span>
              </Button>
            </div>

            <style>{`
              @keyframes contact-glass-enter {
                from { opacity: 0; transform: translateY(14px) scale(0.985); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }

              @keyframes contact-icon-orbit {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }

              @keyframes contact-progress-glow {
                0%, 100% { filter: brightness(1); opacity: 0.92; }
                50% { filter: brightness(1.18); opacity: 1; }
              }

              @keyframes contact-button-sheen {
                from { transform: translateX(-160%) skewX(-16deg); }
                to { transform: translateX(360%) skewX(-16deg); }
              }

              .contact-glass-enter {
                position: relative;
                animation: contact-glass-enter 520ms ease-out both;
              }

              .contact-icon-orbit::before,
              .contact-icon-orbit::after {
                content: '';
                position: absolute;
                inset: -7px;
                border-radius: 34px;
                border: 1px solid rgba(255, 90, 0, 0.22);
                animation: contact-icon-orbit 16s linear infinite;
              }

              .contact-icon-orbit::after {
                inset: 4px;
                border-style: dashed;
                opacity: 0.72;
                animation-duration: 22s;
                animation-direction: reverse;
              }

              .contact-progress {
                animation: contact-progress-glow 2.8s ease-in-out infinite;
              }

              .contact-field-card {
                position: relative;
                overflow: hidden;
              }

              .contact-field-card::after {
                content: '';
                position: absolute;
                inset: 1px;
                border-radius: 31px;
                pointer-events: none;
                background: linear-gradient(135deg, rgba(255,255,255,0.58), transparent 32%, rgba(255,255,255,0.20));
                opacity: 0.72;
              }

              .contact-submit-button:hover .contact-button-sheen {
                animation: contact-button-sheen 1.1s ease-out both;
              }

              @media (prefers-reduced-motion: reduce) {
                .contact-glass-enter,
                .contact-icon-orbit::before,
                .contact-icon-orbit::after,
                .contact-progress,
                .contact-submit-button:hover .contact-button-sheen {
                  animation: none !important;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </KioskLayout>
  );
};

export default ContactPage;
