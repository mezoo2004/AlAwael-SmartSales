import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, MapPin, Phone, User } from 'lucide-react';
import { KioskLayout } from '../../components/layout';
import { Button, Modal, NumericKeypad } from '../../components/ui';
import { useSession } from '../../context/SessionContext';
import { ContactInfo } from '../../types';
import {
  normalizeSaudiPhone,
  isValidSaudiPhone,
  getSaudiPhoneErrorMessage,
} from '../../utils/phone';
import { CONSENT_TEXT_VERSION } from '../../constants/consent';
import {
  createCustomerAndProject,
  createNewProjectForCustomer,
  ExistingCustomerProjectError,
  getOrCreatePreviousProject,
  updateCustomerContact,
  updateProjectLocation,
} from '../../services/projectService';

const FORM_DRAFT_KEY = 'showroom_contact_draft';

type CustomerIdentityForm = {
  name: string;
  phone: string;
};

type LocationStatus = 'idle' | 'detecting' | 'detected' | 'denied' | 'lowAccuracy' | 'manual';

type DetectedProjectLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  city: string;
  district: string;
  street: string;
  region: string;
  country: string;
  googleMapsUrl: string;
};

type LowAccuracyLocation = {
  accuracy: number;
};

const emptyForm = (): CustomerIdentityForm => ({
  name: '',
  phone: '',
});

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();

const pickAddressValue = (
  address: Record<string, string | undefined>,
  keys: string[]
): string => {
  for (const key of keys) {
    const value = address[key]?.trim();
    if (value) return value;
  }
  return '';
};

const isValidCityName = (value: string): boolean => {
  const normalized = value.trim();
  if (normalized.length < 2) return false;
  if (/^-?\d+(\.\d+)?$/.test(normalized)) return false;
  if (/^[A-Z0-9]{3,}\+[A-Z0-9]{2,}$/i.test(normalized)) return false;
  return !/unknown|unnamed|route|road|street|plus code/i.test(normalized);
};

const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<Pick<DetectedProjectLocation, 'city' | 'district' | 'street' | 'region' | 'country'>> => {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=ar&key=${GOOGLE_MAPS_API_KEY}`
      );
      if (response.ok) {
        const data = await response.json() as {
          status?: string;
          results?: Array<{
            address_components?: Array<{
              long_name: string;
              types: string[];
            }>;
          }>;
        };
        if (data.status === 'OK' && data.results?.length) {
          const components = data.results.flatMap(result => result.address_components || []);
          const findComponent = (types: string[]): string => {
            const match = components.find(component =>
              types.some(type => component.types.includes(type))
            );
            return match?.long_name?.trim() || '';
          };
          const city = findComponent(['locality', 'postal_town', 'administrative_area_level_2']);
          const district = findComponent(['sublocality_level_1', 'sublocality', 'neighborhood']);
          const street = findComponent(['route']);
          const region = findComponent(['administrative_area_level_1']);
          const country = findComponent(['country']);

          return {
            city: isValidCityName(city) ? city : '',
            district,
            street,
            region,
            country,
          };
        }
      }
    } catch {
      // Fall through to the open fallback provider.
    }
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${latitude}&lon=${longitude}&accept-language=ar`
    );
    if (!response.ok) {
      return { city: '', district: '', street: '', region: '', country: '' };
    }

    const data = await response.json() as {
      address?: Record<string, string | undefined>;
    };
    const address = data.address || {};
    const city = pickAddressValue(address, ['city', 'town', 'municipality', 'county']);
    const district = pickAddressValue(address, ['suburb', 'neighbourhood', 'city_district', 'quarter']);
    const street = pickAddressValue(address, ['road', 'pedestrian', 'footway', 'residential']);
    const region = pickAddressValue(address, ['state', 'region', 'province', 'state_district']);
    const country = pickAddressValue(address, ['country']);

    return {
      city: isValidCityName(city) ? city : '',
      district,
      street,
      region,
      country,
    };
  } catch {
    return { city: '', district: '', street: '', region: '', country: '' };
  }
};

const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1';
  const {
    session,
    startNewSession,
    setContactInfo,
    setRemoteCustomerProject,
  } = useSession();

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showKeypad, setShowKeypad] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateCustomer, setDuplicateCustomer] = useState<ExistingCustomerProjectError | null>(null);
  const [pendingPayload, setPendingPayload] = useState<ContactInfo | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [projectLocation, setProjectLocation] = useState<DetectedProjectLocation | null>(null);
  const [lowAccuracyLocation, setLowAccuracyLocation] = useState<LowAccuracyLocation | null>(null);
  const [manualCity, setManualCity] = useState('');

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
      if (
        typeof session.contactInfo.latitude === 'number' &&
        typeof session.contactInfo.longitude === 'number'
      ) {
        setProjectLocation({
          latitude: session.contactInfo.latitude,
          longitude: session.contactInfo.longitude,
          accuracy: session.contactInfo.accuracy ?? 0,
          city: session.contactInfo.city || '',
          district: session.contactInfo.district || session.contactInfo.neighborhood || '',
          street: session.contactInfo.street || '',
          region: session.contactInfo.region || '',
          country: session.contactInfo.country || '',
          googleMapsUrl: session.contactInfo.googleMapsUrl ||
            `https://www.google.com/maps?q=${session.contactInfo.latitude},${session.contactInfo.longitude}`,
        });
        setLocationStatus('detected');
      }
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

  const isIdentityReady = Boolean(formData.name.trim()) && isValidSaudiPhone(formData.phone);

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

  const requestProjectLocation = async () => {
    if (!validateForm()) return;

    if (!('geolocation' in navigator)) {
      setLocationStatus('denied');
      setLocationMessage('لا يمكن تحديد موقع المشروع بدون السماح باستخدام موقع الجهاز.');
      return;
    }

    setLocationStatus('detecting');
    setLocationMessage(null);
    setLowAccuracyLocation(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        });
      });
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      if (!Number.isFinite(accuracy) || accuracy > 50) {
        setProjectLocation(null);
        setLowAccuracyLocation({ accuracy: Number.isFinite(accuracy) ? accuracy : 0 });
        setLocationStatus('lowAccuracy');
        setLocationMessage('يمكن تحسين دقة الموقع، يرجى الانتظار لحظة والمحاولة مرة أخرى.');
        return;
      }

      const geocoded = await reverseGeocode(latitude, longitude);
      const detectedLocation: DetectedProjectLocation = {
        latitude,
        longitude,
        accuracy,
        ...geocoded,
        googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
      };

      setProjectLocation(detectedLocation);
      setLocationStatus('detected');
      setLocationMessage(null);
    } catch {
      setProjectLocation(null);
      setLocationStatus('denied');
      setLocationMessage('لا يمكن تحديد موقع المشروع بدون السماح باستخدام موقع الجهاز.');
    }
  };

  const useManualCityEntry = () => {
    setProjectLocation(null);
    setLowAccuracyLocation(null);
    setLocationStatus('manual');
    setLocationMessage(null);
  };

  const buildPayload = (): ContactInfo => {
    const normalized = normalizeSaudiPhone(formData.phone)!;
    return {
      name: formData.name.trim(),
      phone: normalized,
      city: projectLocation?.city || manualCity.trim(),
      district: projectLocation?.district || '',
      street: projectLocation?.street || '',
      region: projectLocation?.region || '',
      country: projectLocation?.country || '',
      latitude: projectLocation?.latitude,
      longitude: projectLocation?.longitude,
      accuracy: projectLocation?.accuracy,
      googleMapsUrl: projectLocation?.googleMapsUrl,
      preferredContactMethod: undefined,
      privacyAccepted: true,
      marketingConsent: false,
      consentTimestamp: new Date().toISOString(),
      consentTextVersion: CONSENT_TEXT_VERSION,
      neighborhood: projectLocation?.district,
      agreedToPrivacy: true,
      requestMeasurementVisit: false,
    };
  };

  const getQuestionnaireStartPath = (): string => {
    return session?.departmentId ? `/kiosk/configure/${session.departmentId}` : '/kiosk/departments';
  };

  const finishCustomerProjectSubmit = (
    payload: ContactInfo,
    customerId: string,
    projectId: string
  ) => {
    setContactInfo(payload);
    setRemoteCustomerProject(customerId, projectId);
    console.log('Stored customer object after contact submit', {
      customer: { id: customerId, ...payload },
      project: { id: projectId, customer_id: customerId },
    });
    try { localStorage.removeItem(FORM_DRAFT_KEY); } catch { /* ignore */ }
    navigate(isEditMode ? getQuestionnaireStartPath() : '/kiosk/departments');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = buildPayload();

    try {
      if (isEditMode && session?.customerId && session?.projectId) {
        await updateCustomerContact(session.customerId, payload);
        await updateProjectLocation(session.projectId, payload);
        finishCustomerProjectSubmit(payload, session.customerId, session.projectId);
        return;
      }

      const result = await createCustomerAndProject(payload);
      console.log('Customer/project creation result', result);
      finishCustomerProjectSubmit(payload, result.customer.id, result.project.id);
    } catch (error) {
      if (error instanceof ExistingCustomerProjectError) {
        setPendingPayload(payload);
        setDuplicateCustomer(error);
        return;
      }

      setSubmitError(error instanceof Error
        ? error.message
        : 'تعذر حفظ بيانات العميل. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinuePreviousProject = async () => {
    if (!duplicateCustomer || !pendingPayload || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const project = duplicateCustomer.project || await getOrCreatePreviousProject(duplicateCustomer.customer.id);
      await updateProjectLocation(project.id, pendingPayload);
      finishCustomerProjectSubmit(pendingPayload, duplicateCustomer.customer.id, project.id);
    } catch (error) {
      setSubmitError(error instanceof Error
        ? error.message
        : 'تعذر متابعة المشروع السابق. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setIsSubmitting(false);
      setDuplicateCustomer(null);
      setPendingPayload(null);
    }
  };

  const handleStartNewProject = async () => {
    if (!duplicateCustomer || !pendingPayload || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const project = await createNewProjectForCustomer(duplicateCustomer.customer.id, pendingPayload);
      finishCustomerProjectSubmit(pendingPayload, duplicateCustomer.customer.id, project.id);
    } catch (error) {
      setSubmitError(error instanceof Error
        ? error.message
        : 'تعذر إنشاء مشروع جديد. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setIsSubmitting(false);
      setDuplicateCustomer(null);
      setPendingPayload(null);
    }
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

              {isIdentityReady && (locationStatus === 'idle' || (locationStatus === 'detecting' && !projectLocation)) && (
                <div className="contact-location-card rounded-[32px] border border-white/72 bg-white/42 p-6 text-right shadow-[0_18px_54px_rgba(41,45,50,0.09)] backdrop-blur-[28px] transition-all duration-[350ms] md:p-7">
                  <div className="mb-5 flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-brand-orange shadow-[0_14px_36px_rgba(255,90,0,0.15)] ring-1 ring-white/80">
                      <MapPin className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h2 className="mb-3 text-2xl font-bold text-brand-dark">
                        تحديد موقع المشروع
                      </h2>
                      <p className="text-lg leading-relaxed text-brand-gray">
                        لخدمتك بشكل أفضل وتحديد أقرب فرع وجدولة المعاينة، يمكننا معرفة موقع مشروعك تلقائياً.
                      </p>
                      <p className="mt-3 text-base font-bold text-brand-gray">
                        لن يتم استخدام موقعك إلا لهذا الطلب فقط.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={requestProjectLocation}
                      disabled={locationStatus === 'detecting'}
                      loading={locationStatus === 'detecting'}
                      fullWidth
                      className="min-h-[56px] shadow-[0_16px_42px_rgba(255,90,0,0.20)]"
                    >
                      السماح بالموقع
                    </Button>
                  </div>
                </div>
              )}

              {isIdentityReady && (locationStatus === 'detected' || locationStatus === 'detecting') && projectLocation && (
                <div className="contact-location-card rounded-[32px] border border-white/72 bg-white/46 p-6 text-right shadow-[0_18px_54px_rgba(41,45,50,0.10)] backdrop-blur-[28px] transition-all duration-[350ms] md:p-7">
                  <div className="mb-5 flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/74 text-brand-orange shadow-[0_14px_36px_rgba(255,90,0,0.15)] ring-1 ring-white/80">
                      <CheckCircle className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <h2 className="mb-3 text-2xl font-bold text-brand-dark">
                        تم تحديد موقع المشروع
                      </h2>
                      <div className="space-y-3 text-lg leading-relaxed text-brand-gray">
                        <p className="flex items-center justify-end gap-2 text-xl font-bold text-brand-orange">
                          <span>تم تحديد موقع المشروع</span>
                          <MapPin className="h-5 w-5" />
                        </p>
                        <p>
                          <span className="font-bold text-brand-dark">المدينة: </span>
                          {projectLocation.city || 'تم تحديد موقع المشروع بنجاح'}
                        </p>
                        <p>
                          <span className="font-bold text-brand-dark">الحي: </span>
                          {projectLocation.district || 'غير متوفر حالياً'}
                        </p>
                        <p>
                          <span className="font-bold text-brand-dark">دقة الموقع: </span>
                          {Math.round(projectLocation.accuracy)} متر
                        </p>
                        {projectLocation.accuracy > 50 && (
                          <p className="rounded-2xl border border-brand-orange/20 bg-brand-orange/10 px-4 py-3 text-base font-bold text-brand-orange">
                            يمكن تحسين دقة الموقع، يرجى الانتظار لحظة والمحاولة مرة أخرى.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="secondary"
                      onClick={requestProjectLocation}
                      disabled={locationStatus === 'detecting'}
                      loading={locationStatus === 'detecting'}
                      fullWidth
                      className="min-h-[56px] border-white/70 bg-white/56 backdrop-blur-[28px]"
                    >
                      تغيير الموقع
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => window.open(projectLocation.googleMapsUrl, '_blank', 'noopener,noreferrer')}
                      fullWidth
                      className="min-h-[56px] border-white/70 bg-white/56 backdrop-blur-[28px]"
                    >
                      عرض الموقع على خرائط Google
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      loading={isSubmitting}
                      fullWidth
                      className="min-h-[56px] shadow-[0_16px_42px_rgba(255,90,0,0.20)]"
                    >
                      متابعة
                    </Button>
                  </div>
                </div>
              )}

              {isIdentityReady && locationStatus === 'lowAccuracy' && locationMessage && (
                <div className="contact-location-card rounded-[32px] border border-white/72 bg-white/42 p-6 text-right shadow-[0_18px_54px_rgba(41,45,50,0.09)] backdrop-blur-[28px] md:p-7">
                  <p className="mb-3 text-lg font-bold text-brand-orange">
                    {locationMessage}
                  </p>
                  {lowAccuracyLocation && (
                    <p className="mb-5 text-brand-gray">
                      دقة الموقع الحالية: {Math.round(lowAccuracyLocation.accuracy)} متر
                    </p>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={requestProjectLocation} fullWidth className="min-h-[56px]">
                      إعادة المحاولة
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={useManualCityEntry}
                      fullWidth
                      className="min-h-[56px] border-white/70 bg-white/56 backdrop-blur-[28px]"
                    >
                      إدخال المدينة يدويًا
                    </Button>
                  </div>
                </div>
              )}

              {isIdentityReady && locationStatus === 'denied' && locationMessage && (
                <div className="contact-location-card rounded-[32px] border border-white/72 bg-white/42 p-6 text-right shadow-[0_18px_54px_rgba(41,45,50,0.09)] backdrop-blur-[28px] md:p-7">
                  <p className="mb-5 text-lg font-bold text-brand-gray">
                    {locationMessage}
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={requestProjectLocation} fullWidth className="min-h-[56px]">
                      إعادة المحاولة
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={useManualCityEntry}
                      fullWidth
                      className="min-h-[56px] border-white/70 bg-white/56 backdrop-blur-[28px]"
                    >
                      إدخال المدينة يدويًا
                    </Button>
                  </div>
                </div>
              )}

              {isIdentityReady && locationStatus === 'manual' && (
                <div className="contact-location-card rounded-[32px] border border-white/72 bg-white/42 p-6 text-right shadow-[0_18px_54px_rgba(41,45,50,0.09)] backdrop-blur-[28px] md:p-7">
                  <label className="mb-3 block text-lg font-bold text-brand-dark">
                    إدخال المدينة يدويًا
                  </label>
                  <input
                    type="text"
                    value={manualCity}
                    onChange={(event) => setManualCity(event.target.value)}
                    className="h-[64px] w-full rounded-[24px] border border-white/78 bg-white/44 px-5 text-right text-xl font-bold text-brand-dark shadow-inner outline-none backdrop-blur-[28px] transition-all duration-[350ms] focus:border-brand-orange/60 focus:bg-white/62 focus:shadow-[0_0_0_4px_rgba(255,90,0,0.10),0_18px_54px_rgba(255,90,0,0.14)]"
                    placeholder="اكتب المدينة"
                    dir="rtl"
                  />
                  <p className="mt-3 text-sm font-bold text-brand-gray">
                    لن يتم حفظ إحداثيات بدون سماح موقع الجهاز.
                  </p>
                </div>
              )}
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

            {submitError && (
              <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-center text-sm font-bold text-red-600 backdrop-blur">
                {submitError}
              </p>
            )}

            <Modal
              isOpen={Boolean(duplicateCustomer)}
              onClose={() => {
                if (isSubmitting) return;
                setDuplicateCustomer(null);
                setPendingPayload(null);
              }}
              title="هذا الرقم مسجل مسبقًا"
              size="md"
            >
              <div dir="rtl" className="text-center">
                <p className="mb-7 text-lg leading-relaxed text-brand-gray">
                  وجدنا مشروعًا سابقًا مرتبطًا بهذا الرقم. هل ترغب في متابعة المشروع السابق أو بدء مشروع جديد؟
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    onClick={handleStartNewProject}
                    loading={isSubmitting}
                    fullWidth
                  >
                    بدء مشروع جديد
                  </Button>
                  <Button
                    onClick={handleContinuePreviousProject}
                    loading={isSubmitting}
                    fullWidth
                  >
                    متابعة المشروع السابق
                  </Button>
                </div>
              </div>
            </Modal>

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

              .contact-location-card {
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

              .contact-location-card::after {
                content: '';
                position: absolute;
                inset: 1px;
                border-radius: 31px;
                pointer-events: none;
                background: linear-gradient(135deg, rgba(255,255,255,0.58), transparent 34%, rgba(255,255,255,0.18));
                opacity: 0.68;
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
