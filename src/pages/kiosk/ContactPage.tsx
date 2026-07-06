import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, User, Phone, MapPin, Mail, Clock } from 'lucide-react';
import { KioskLayout } from '../../components/layout';
import { Button, Input, NumericKeypad } from '../../components/ui';
import { useSession } from '../../context/SessionContext';
import { ContactInfo, PreferredContactMethod } from '../../types';

const SaudiCities = [
  'الرياض',
  'جدة',
  'مكة المكرمة',
  'المدينة المنورة',
  'الدمام',
  'الخبر',
  'الظهران',
  'الطائف',
  'تبوك',
  'بريدة',
  'خميس مشيط',
  'أبها',
  'نجران',
  'حائل',
  'الجبيل',
  'ينبع',
];

const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, setContactInfo, submitSession } = useSession();

  const [formData, setFormData] = useState<ContactInfo>({
    name: '',
    phone: '',
    city: '',
    neighborhood: '',
    email: '',
    preferredContactMethod: 'whatsapp',
    preferredContactTime: '',
    requestMeasurementVisit: false,
    agreedToPrivacy: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showKeypad, setShowKeypad] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الجوال مطلوب';
    } else if (!/^05\d{8}$/.test(formData.phone)) {
      newErrors.phone = 'رقم جوال غير صالح (يجب أن يبدأ بـ 05 ويكون 10 أرقام)';
    }

    if (!formData.city) {
      newErrors.city = 'المدينة مطلوبة';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'بريد إلكتروني غير صالح';
    }

    if (!formData.agreedToPrivacy) {
      newErrors.privacy = 'يجب الموافقة على سياسة الخصوصية';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setContactInfo(formData);

    try {
      const requestNumber = await submitSession();
      navigate('/kiosk/success', { state: { requestNumber } });
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods: { id: PreferredContactMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'whatsapp', label: 'واتساب', icon: <Phone className="w-5 h-5" /> },
    { id: 'call', label: 'اتصال', icon: <Phone className="w-5 h-5" /> },
    { id: 'sms', label: 'رسالة نصية', icon: <Phone className="w-5 h-5" /> },
  ];

  return (
    <KioskLayout currentStep={4}>
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-brand-dark mb-4">
              بيانات التواصل
            </h1>
            <p className="text-xl text-brand-gray">
              أدخل بياناتك للتواصل معك
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Name */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-brand-gray/20">
              <label className="flex items-center gap-2 text-lg font-bold text-brand-dark mb-4">
                <User className="w-5 h-5 text-brand-orange" />
                الاسم الكامل *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`input text-xl ${errors.name ? 'input-error' : ''}`}
                placeholder="أدخل اسمك الكامل"
                dir="rtl"
              />
              {errors.name && <p className="text-red-500 mt-2">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-brand-gray/20">
              <label className="flex items-center gap-2 text-lg font-bold text-brand-dark mb-4">
                <Phone className="w-5 h-5 text-brand-orange" />
                رقم الجوال *
              </label>
              {showKeypad ? (
                <NumericKeypad
                  value={formData.phone}
                  onChange={(val) => setFormData({ ...formData, phone: val })}
                  onSubmit={() => setShowKeypad(false)}
                  maxLength={10}
                />
              ) : (
                <div className="flex gap-4">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`input text-xl flex-1 direction-ltr text-right ${errors.phone ? 'input-error' : ''}`}
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                  />
                  <Button variant="secondary" onClick={() => setShowKeypad(true)}>
                    لوحة المفاتيح
                  </Button>
                </div>
              )}
              {errors.phone && <p className="text-red-500 mt-2">{errors.phone}</p>}
            </div>

            {/* City */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-brand-gray/20">
              <label className="flex items-center gap-2 text-lg font-bold text-brand-dark mb-4">
                <MapPin className="w-5 h-5 text-brand-orange" />
                المدينة *
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`input text-xl ${errors.city ? 'input-error' : ''}`}
              >
                <option value="">اختر المدينة</option>
                {SaudiCities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.city && <p className="text-red-500 mt-2">{errors.city}</p>}
            </div>

            {/* Neighborhood */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-brand-gray/20">
              <label className="flex items-center gap-2 text-lg font-bold text-brand-dark mb-4">
                <MapPin className="w-5 h-5 text-brand-gray" />
                الحي (اختياري)
              </label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="input text-xl"
                placeholder="أدخل اسم الحي"
              />
            </div>

            {/* Email */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-brand-gray/20">
              <label className="flex items-center gap-2 text-lg font-bold text-brand-dark mb-4">
                <Mail className="w-5 h-5 text-brand-gray" />
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`input text-xl ${errors.email ? 'input-error' : ''}`}
                placeholder="example@email.com"
                dir="ltr"
              />
              {errors.email && <p className="text-red-500 mt-2">{errors.email}</p>}
            </div>

            {/* Preferred Contact Method */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-brand-gray/20">
              <label className="flex items-center gap-2 text-lg font-bold text-brand-dark mb-4">
                <Phone className="w-5 h-5 text-brand-orange" />
                طريقة التواصل المفضلة
              </label>
              <div className="flex gap-4">
                {contactMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setFormData({ ...formData, preferredContactMethod: method.id })}
                    className={`
                      flex-1 p-4 rounded-xl flex items-center justify-center gap-2
                      transition-all duration-300 font-medium
                      ${formData.preferredContactMethod === method.id
                        ? 'bg-brand-orange text-white'
                        : 'bg-brand-light text-brand-dark hover:bg-brand-orange/10'
                      }
                    `}
                  >
                    {method.icon}
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Time */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-brand-gray/20">
              <label className="flex items-center gap-2 text-lg font-bold text-brand-dark mb-4">
                <Clock className="w-5 h-5 text-brand-gray" />
                الوقت المناسب للتواصل (اختياري)
              </label>
              <div className="flex gap-4">
                {['صباحًا', 'ظهرًا', 'مساءً', 'أي وقت'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setFormData({ ...formData, preferredContactTime: time })}
                    className={`
                      flex-1 p-4 rounded-xl text-center
                      transition-all duration-300 font-medium
                      ${formData.preferredContactTime === time
                        ? 'bg-brand-orange text-white'
                        : 'bg-brand-light text-brand-dark hover:bg-brand-orange/10'
                      }
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Measurement Visit */}
            <div
              onClick={() => setFormData({ ...formData, requestMeasurementVisit: !formData.requestMeasurementVisit })}
              className="bg-white rounded-2xl p-6 shadow-lg border border-brand-gray/20 cursor-pointer hover:border-brand-orange/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-6 h-6 rounded-md border-2 flex items-center justify-center
                  transition-all
                  ${formData.requestMeasurementVisit
                    ? 'bg-brand-orange border-brand-orange'
                    : 'border-brand-gray/40'
                  }
                `}>
                  {formData.requestMeasurementVisit && (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-brand-dark">طلب زيارة قياس</p>
                  <p className="text-sm text-brand-gray">سيقوم أحد مندوبينا بزيارة الموقع للقياسات الدقيقة</p>
                </div>
              </div>
            </div>

            {/* Privacy Agreement */}
            <div
              onClick={() => setFormData({ ...formData, agreedToPrivacy: !formData.agreedToPrivacy })}
              className={`bg-white rounded-2xl p-6 shadow-lg border ${
                errors.privacy ? 'border-red-500' : 'border-brand-gray/20'
              } cursor-pointer hover:border-brand-orange/30 transition-all`}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-6 h-6 rounded-md border-2 flex items-center justify-center
                  transition-all
                  ${formData.agreedToPrivacy
                    ? 'bg-brand-orange border-brand-orange'
                    : 'border-brand-gray/40'
                  }
                `}>
                  {formData.agreedToPrivacy && (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <p className="text-brand-gray">
                  أوافق على <span className="text-brand-orange">سياسة الخصوصية</span> وأسمح بمعالجة بياناتي لأغراض التواصل
                </p>
              </div>
              {errors.privacy && <p className="text-red-500 mt-2">{errors.privacy}</p>}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-6 justify-center mt-10 mb-8">
            <Button
              variant="secondary"
              size="xl"
              onClick={() => navigate('/kiosk/designs')}
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              السابق
            </Button>
            <Button
              size="xl"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={!formData.agreedToPrivacy}
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

export default ContactPage;
