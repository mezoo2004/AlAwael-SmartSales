import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Home, Printer } from 'lucide-react';
import { Button } from '../../components/ui';
import { WelcomeAtmosphere } from '../../components/welcome/WelcomeAtmosphere';
import { useSession } from '../../context/SessionContext';
import { getDepartmentById, getQuestionsByDepartment } from '../../data';
import { DepartmentId } from '../../types';

const formatDate = (value: Date): string => new Intl.DateTimeFormat('ar-SA', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(value);

const renderAnswerValue = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) return value.join('، ');
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.width || obj.height || obj.depth || obj.length || obj.area) {
      return [
        obj.length ? `الطول: ${obj.length}` : null,
        obj.width ? `العرض: ${obj.width}` : null,
        obj.height ? `الارتفاع: ${obj.height}` : null,
        obj.depth ? `العمق: ${obj.depth}` : null,
        obj.area ? `المساحة: ${obj.area}` : null,
        obj.unit ? `الوحدة: ${obj.unit}` : null,
      ].filter(Boolean).join(' - ');
    }
    return JSON.stringify(value);
  }
  return String(value);
};

const findAnswer = (
  rows: Array<{ id: string; title: string; value: string }>,
  keywords: string[]
): string => {
  const lowered = keywords.map((keyword) => keyword.toLowerCase());
  return rows.find((row) =>
    lowered.some((keyword) =>
      row.id.toLowerCase().includes(keyword) ||
      row.title.toLowerCase().includes(keyword)
    )
  )?.value || '-';
};

const Field: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({
  label,
  value,
  className = '',
}) => (
  <div className={`report-field ${className}`}>
    <p className="report-field-label">{label}</p>
    <div className="report-field-value">{value}</div>
  </div>
);

const PageHeader: React.FC<{ page: number; title: string }> = ({ page, title }) => (
  <div className="report-page-header">
    <div className="flex items-center gap-3">
      <img src="/brand/logo.png" alt="الأول الأوائل" className="h-8 w-auto object-contain" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange">Al Awael</p>
        <p className="text-sm font-black text-brand-dark">{title}</p>
      </div>
    </div>
    <p className="text-xs font-bold text-brand-gray">صفحة {page} / 4</p>
  </div>
);

const PageFooter: React.FC = () => (
  <div className="report-page-footer">
    <span>Confidential Project Document</span>
    <span>الأول الأوائل</span>
  </div>
);

const SuccessPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, resetSession } = useSession();

  const requestNumber = useMemo(() => {
    return (location.state as { requestNumber?: string })?.requestNumber || 'AWA-2026-000000';
  }, [location]);

  const createdAt = useMemo(() => new Date(), []);
  const contact = session?.contactInfo;
  const department = session?.departmentId
    ? getDepartmentById(session.departmentId)
    : null;
  const selectedDesign = session?.generatedDesigns.find(
    (design) => design.id === session.selectedDesignId
  );
  const questions = session?.departmentId
    ? getQuestionsByDepartment(session.departmentId as DepartmentId)
    : [];

  const answerRows = useMemo(() => {
    return questions
      .map((question) => {
        const answer = session?.answers?.[question.id];
        if (answer === undefined) return null;
        const optionLabel = question.options?.find((option) => option.value === answer)?.label;
        return {
          id: question.id,
          title: question.title,
          value: optionLabel || renderAnswerValue(answer),
        };
      })
      .filter(Boolean) as Array<{ id: string; title: string; value: string }>;
  }, [questions, session?.answers]);

  const recommendationCards = useMemo(() => {
    const fallbackImage = selectedDesign?.thumbnailUrl || selectedDesign?.imageUrl || '/brand/welcome-background.png';
    const cards = [
      selectedDesign && {
        image: selectedDesign.thumbnailUrl || selectedDesign.imageUrl,
        name: selectedDesign.title,
        description: selectedDesign.description,
      },
      ...(selectedDesign?.materials || []).slice(0, 3).map((material) => ({
        image: fallbackImage,
        name: material,
        description: 'خامة مقترحة ضمن التصميم النهائي.',
      })),
      ...(selectedDesign?.colors || []).slice(0, 2).map((color) => ({
        image: fallbackImage,
        name: color,
        description: 'لون متناسق مع اتجاه التصميم.',
      })),
    ].filter(Boolean) as Array<{ image: string; name: string; description: string }>;

    return cards.length > 0 ? cards : [{
      image: fallbackImage,
      name: department?.name || 'توصية المشروع',
      description: 'سيتم تجهيز التوصيات بعد مراجعة فريق المبيعات.',
    }];
  }, [department?.name, selectedDesign]);

  const handlePrint = () => {
    window.print();
  };

  const handleFinish = () => {
    resetSession();
    navigate('/kiosk');
  };

  const summaryUrl = `${window.location.origin}/kiosk/success?request=${encodeURIComponent(requestNumber)}`;
  const gpsCoordinates = contact?.latitude && contact?.longitude
    ? `${contact.latitude.toFixed(6)}, ${contact.longitude.toFixed(6)}`
    : '-';
  const mapsUrl = contact?.googleMapsUrl ||
    (contact?.latitude && contact?.longitude
      ? `https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`
      : null);
  const measurements = session?.measurements;
  const measurementCandidates: Array<[string, unknown]> = [
    ['الطول', (measurements as Record<string, unknown> | undefined)?.length],
    ['العرض', measurements?.width],
    ['الارتفاع', measurements?.height],
    ['المساحة', (measurements as Record<string, unknown> | undefined)?.area],
  ];
  const measurementRows = measurementCandidates.filter(([, value]) =>
    value !== undefined && value !== null && value !== ''
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden" dir="rtl">
      <div className="screen-only">
        <WelcomeAtmosphere />
      </div>

      <div className="relative z-10 px-3 py-6 md:px-6">
        <div className="print-actions mb-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            variant="secondary"
            size="lg"
            onClick={handlePrint}
            icon={<Printer className="h-5 w-5" />}
          >
            طباعة الملخص
          </Button>
          <Button
            size="lg"
            onClick={handleFinish}
            icon={<Home className="ml-2 h-5 w-5" />}
            iconPosition="start"
            className="px-8"
          >
            إنهاء والعودة
          </Button>
        </div>

        <div className="print-content mx-auto flex max-w-[210mm] flex-col gap-6">
          {/* ===================== PAGE 1 — COVER ===================== */}
          <section className="a4-page a4-cover">
            <div className="cover-accent" />
            <div className="cover-inner">
              <div className="cover-brand">
                <img src="/brand/logo.png" alt="الأول الأوائل" className="cover-logo" />
                <p className="cover-eyebrow">Al Awael Smart Sales</p>
                <h1 className="cover-company">الأول الأوائل</h1>
                <p className="cover-subtitle">ملف مشروع العميل</p>
              </div>

              <div className="cover-divider" />

              <div className="cover-meta-grid">
                <Field label="اسم العميل" value={contact?.name || '-'} />
                <Field label="رقم الطلب" value={requestNumber} />
                <Field label="الفئة" value={department?.name || '-'} />
                <Field label="تاريخ الإنشاء" value={formatDate(createdAt)} />
              </div>

              <div className="cover-status-row">
                <span className="cover-status-badge">تم الاستلام</span>
              </div>

              <div className="cover-qr-block">
                <QRCodeSVG
                  value={summaryUrl}
                  size={120}
                  level="H"
                  includeMargin
                  bgColor="#FFFFFF"
                  fgColor="#292D32"
                />
                <p className="cover-qr-caption">امسح الرمز لمتابعة حالة المشروع</p>
              </div>

              <p className="cover-confidential">Confidential Engineering Project File</p>
            </div>
          </section>

          {/* ===================== PAGE 2 — PROJECT INFO ===================== */}
          <section className="a4-page">
            <PageHeader page={2} title="معلومات المشروع" />

            <div className="page-body space-y-4">
              <div className="report-block">
                <h2 className="report-block-title">بيانات العميل</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <Field label="الاسم الكامل" value={contact?.name || '-'} />
                  <Field label="رقم الجوال" value={contact?.phone || '-'} />
                  <Field label="المدينة" value={contact?.city || '-'} />
                  <Field label="الحي" value={contact?.district || contact?.neighborhood || '-'} />
                  <Field label="الشارع" value={contact?.street || '-'} />
                </div>
              </div>

              <div className="report-block">
                <h2 className="report-block-title">الموقع</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field
                    label="الإحداثيات"
                    value={<span className="direction-ltr block text-right">{gpsCoordinates}</span>}
                  />
                  <Field
                    label="خرائط Google"
                    value={mapsUrl ? (
                      <a href={mapsUrl} target="_blank" rel="noreferrer" className="break-all text-brand-orange">
                        فتح الموقع
                      </a>
                    ) : '-'}
                  />
                </div>
              </div>

              <div className="report-block">
                <h2 className="report-block-title">معلومات المشروع والميزانية</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <Field label="الفئة" value={department?.name || '-'} />
                  <Field label="المنتج" value={selectedDesign?.title || findAnswer(answerRows, ['product', 'material', 'usage'])} />
                  <Field label="نوع المشروع" value={findAnswer(answerRows, ['type', 'usage', 'service'])} />
                  <Field label="الميزانية" value={findAnswer(answerRows, ['budget'])} />
                  <Field label="الأولوية" value={findAnswer(answerRows, ['priority'])} />
                  <Field
                    label="المقاسات"
                    value={measurementRows.length > 0 ? 'متوفرة' : 'سيتم أخذ المقاسات أثناء المعاينة.'}
                  />
                </div>
              </div>

              <div className="report-block">
                <h2 className="report-block-title">المقاسات</h2>
                {measurementRows.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {measurementRows.map(([label, value]) => (
                      <Field key={label} label={label} value={`${value} ${measurements?.unit || ''}`} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-brand-gray">سيتم أخذ المقاسات أثناء المعاينة.</p>
                )}
              </div>

              <div className="report-block">
                <h2 className="report-block-title">إجابات الاستبيان</h2>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>السؤال</th>
                      <th>الإجابة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {answerRows.length > 0 ? answerRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.title}</td>
                        <td>{row.value}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={2}>لا توجد إجابات مسجلة.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="report-block">
                <h2 className="report-block-title">التوصيات</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {recommendationCards.slice(0, 6).map((card, index) => (
                    <div key={`${card.name}-${index}`} className="report-rec-card">
                      <p className="text-sm font-black text-brand-dark">{card.name}</p>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-gray">{card.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <PageFooter />
          </section>

          {/* ===================== PAGE 3 — AI DESIGN ===================== */}
          <section className="a4-page">
            <PageHeader page={3} title="تصميم الذكاء الاصطناعي" />

            <div className="page-body space-y-4">
              <div className="report-block">
                <h2 className="report-block-title">التصميم النهائي</h2>
                <div className="ai-stage">
                  {selectedDesign ? (
                    <img
                      src={selectedDesign.imageUrl || selectedDesign.thumbnailUrl}
                      alt={selectedDesign.title}
                      className="ai-stage-image"
                    />
                  ) : (
                    <div className="ai-stage-placeholder">
                      سيظهر التصميم النهائي هنا بعد اكتمال التوليد.
                    </div>
                  )}
                </div>
                {selectedDesign && (
                  <div className="mt-3">
                    <p className="text-lg font-black text-brand-dark">{selectedDesign.title}</p>
                    <p className="mt-1 text-sm font-semibold text-brand-gray">{selectedDesign.description}</p>
                  </div>
                )}
              </div>

              <div className="report-block">
                <h2 className="report-block-title">المنتجات الموصى بها</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {recommendationCards.map((card, index) => (
                    <div key={`rec-img-${card.name}-${index}`} className="overflow-hidden rounded-xl border border-brand-gray/15 bg-white">
                      <img src={card.image} alt={card.name} className="h-28 w-full object-cover" />
                      <div className="p-3">
                        <p className="text-sm font-black text-brand-dark">{card.name}</p>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-gray">{card.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <PageFooter />
          </section>

          {/* ===================== PAGE 4 — SALES ===================== */}
          <section className="a4-page">
            <PageHeader page={4} title="فريق المبيعات والاعتماد" />

            <div className="page-body space-y-4">
              <div className="report-block">
                <h2 className="report-block-title">ملاحظات فريق المبيعات</h2>
                <div className="handwriting-area">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="handwriting-line" />
                  ))}
                </div>
              </div>

              <div className="report-block">
                <h2 className="report-block-title">ملاحظات زيارة الموقع</h2>
                <div className="handwriting-area">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="handwriting-line" />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="report-block signature-box">
                  <h2 className="report-block-title">توقيع العميل</h2>
                  <div className="signature-space" />
                  <p className="text-sm font-bold text-brand-gray">{contact?.name || 'الاسم والتوقيع'}</p>
                  <p className="mt-1 text-xs text-brand-gray">التاريخ: _______________</p>
                </div>
                <div className="report-block signature-box">
                  <h2 className="report-block-title">توقيع مستشار المبيعات</h2>
                  <div className="signature-space" />
                  <p className="text-sm font-bold text-brand-gray">الاسم والتوقيع</p>
                  <p className="mt-1 text-xs text-brand-gray">التاريخ: _______________</p>
                </div>
              </div>

              <div className="report-block">
                <h2 className="report-block-title">الاعتماد النهائي</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field label="حالة الاعتماد" value="بانتظار مراجعة المبيعات" />
                  <Field label="رقم الطلب" value={requestNumber} />
                  <Field label="تاريخ الملف" value={formatDate(createdAt)} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-4 border-t border-brand-gray/15 pt-4">
                  <div>
                    <p className="text-xs font-black text-brand-gray">اعتماد المدير</p>
                    <div className="signature-space mt-4" />
                  </div>
                  <QRCodeSVG
                    value={summaryUrl}
                    size={84}
                    level="H"
                    includeMargin
                    bgColor="#FFFFFF"
                    fgColor="#292D32"
                  />
                </div>
              </div>
            </div>

            <PageFooter />
          </section>
        </div>
      </div>

      <style>{`
        .direction-ltr { direction: ltr; }

        .a4-page {
          position: relative;
          width: 100%;
          min-height: 297mm;
          display: flex;
          flex-direction: column;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.58);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 28px 80px rgba(41,45,50,0.12);
          overflow: hidden;
          padding: 18mm 14mm 14mm;
        }

        .a4-cover {
          justify-content: center;
          padding: 0;
        }

        .cover-accent {
          position: absolute;
          inset-inline-start: 0;
          top: 0;
          bottom: 0;
          width: 8px;
          background: #FF5A00;
        }

        .cover-inner {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 100%;
          padding: 28mm 18mm 20mm;
        }

        .cover-brand {
          text-align: center;
        }

        .cover-logo {
          height: 88px;
          width: auto;
          object-fit: contain;
          margin: 0 auto 18px;
          display: block;
        }

        .cover-eyebrow {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #FF5A00;
        }

        .cover-company {
          margin-top: 14px;
          font-size: 48px;
          line-height: 1.15;
          font-weight: 900;
          color: #292D32;
        }

        .cover-subtitle {
          margin-top: 10px;
          font-size: 22px;
          font-weight: 700;
          color: #6B7280;
        }

        .cover-divider {
          height: 1px;
          margin: 28px 0;
          background: linear-gradient(90deg, transparent, rgba(174,181,188,0.55), transparent);
        }

        .cover-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .cover-status-row {
          display: flex;
          justify-content: center;
          margin-top: 22px;
        }

        .cover-status-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          background: rgba(255,90,0,0.12);
          color: #FF5A00;
          font-size: 13px;
          font-weight: 900;
          padding: 8px 18px;
        }

        .cover-qr-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-top: 28px;
        }

        .cover-qr-caption {
          font-size: 12px;
          font-weight: 700;
          color: #6B7280;
        }

        .cover-confidential {
          margin-top: 28px;
          text-align: center;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #AEB5BC;
        }

        .report-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
          margin-bottom: 14px;
          border-bottom: 1px solid rgba(174,181,188,0.28);
        }

        .report-page-footer {
          margin-top: auto;
          padding-top: 10px;
          border-top: 1px solid rgba(174,181,188,0.28);
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          color: #AEB5BC;
        }

        .page-body {
          flex: 1;
        }

        .report-block {
          border: 1px solid rgba(174,181,188,0.22);
          border-radius: 16px;
          background: rgba(255,255,255,0.72);
          padding: 14px;
        }

        .report-block-title {
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: 900;
          color: #292D32;
          padding-bottom: 6px;
          border-bottom: 2px solid rgba(255,90,0,0.35);
        }

        .report-field-label {
          margin-bottom: 3px;
          font-size: 10px;
          font-weight: 900;
          color: #8A9299;
        }

        .report-field-value {
          font-size: 13px;
          font-weight: 700;
          color: #292D32;
          line-height: 1.45;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .report-table th {
          text-align: right;
          background: #292D32;
          color: #fff;
          padding: 8px 10px;
          font-weight: 900;
        }

        .report-table td {
          border-bottom: 1px solid rgba(174,181,188,0.25);
          padding: 7px 10px;
          vertical-align: top;
          font-weight: 600;
          color: #292D32;
        }

        .report-table td:last-child {
          color: #6B7280;
        }

        .report-rec-card {
          border: 1px solid rgba(174,181,188,0.22);
          border-radius: 12px;
          background: #fff;
          padding: 10px;
        }

        .ai-stage {
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid rgba(174,181,188,0.22);
          background: #F7F8F9;
          min-height: 320px;
        }

        .ai-stage-image {
          width: 100%;
          height: 360px;
          object-fit: cover;
          display: block;
        }

        .ai-stage-placeholder {
          min-height: 360px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
          font-size: 18px;
          font-weight: 900;
          color: #8A9299;
        }

        .handwriting-area {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 8px 0 4px;
        }

        .handwriting-line {
          height: 1px;
          background: rgba(174,181,188,0.45);
        }

        .signature-box {
          min-height: 170px;
        }

        .signature-space {
          height: 70px;
          margin-bottom: 8px;
          border-bottom: 1px solid rgba(174,181,188,0.55);
        }

        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          html, body {
            width: 210mm;
            background: #fff !important;
          }

          body * {
            visibility: hidden;
          }

          .print-content,
          .print-content * {
            visibility: visible;
          }

          .print-actions,
          .print-actions *,
          .screen-only,
          .screen-only * {
            display: none !important;
            visibility: hidden !important;
          }

          .print-content {
            position: absolute;
            inset: 0;
            width: 210mm;
            max-width: 210mm;
            margin: 0;
            gap: 0 !important;
            display: block;
          }

          .a4-page {
            width: 210mm;
            height: 297mm;
            min-height: 297mm;
            max-height: 297mm;
            margin: 0;
            padding: 14mm 12mm 12mm;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
          }

          .a4-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          .a4-cover {
            padding: 0 !important;
          }

          .cover-inner {
            min-height: 297mm;
            padding: 24mm 16mm 18mm;
          }

          .report-block,
          .report-rec-card,
          .ai-stage {
            box-shadow: none !important;
            background: #fff !important;
            backdrop-filter: none !important;
          }

          .report-block,
          .report-page-header,
          .report-page-footer,
          .ai-stage,
          .signature-box {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-content img,
          .print-content * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }

        @media screen and (max-width: 900px) {
          .a4-page {
            min-height: auto;
          }

          .cover-company {
            font-size: 36px;
          }

          .ai-stage-image,
          .ai-stage-placeholder {
            height: 260px;
            min-height: 260px;
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessPage;
