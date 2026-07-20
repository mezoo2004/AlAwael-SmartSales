import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Edit2, Image, FileText, Palette, Ruler, MapPin } from 'lucide-react';
import { KioskLayout } from '../../components/layout';
import { Button, Card } from '../../components/ui';
import { useSession } from '../../context/SessionContext';
import { getDepartmentById, getQuestionsByDepartment } from '../../data';
import { DepartmentId } from '../../types';

const ReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();

  const department = session?.departmentId
    ? getDepartmentById(session.departmentId)
    : null;

  const questions = session?.departmentId
    ? getQuestionsByDepartment(session.departmentId as DepartmentId)
    : [];

  const handleEdit = (questionId: string) => {
    navigate(`/kiosk/configure/${session?.departmentId}?edit=${questionId}`);
  };

  const handleGenerate = () => {
    navigate('/kiosk/recommendation-summary');
  };

  // Group answers by category
  const groupedAnswers = {
    basic: questions.slice(0, 6),
    measurements: questions.filter(q =>
      q.id.includes('measurement') || q.id.includes('unknown') || q.id === 'measurements'
    ),
    style: questions.filter(q =>
      ['design_style', 'marble_color', 'marble_pattern', 'cabinet_config', 'cabinet_color', 'mirror_type', 'mirror_lighting', 'faucet_type', 'accessories_finish'].includes(q.id)
    ),
    other: questions.filter(q =>
      ['budget', 'implementation_date', 'notes'].includes(q.id)
    ),
  };

  const renderAnswerValue = (value: unknown): string => {
    if (value === undefined || value === null) return '-';
    if (Array.isArray(value)) return value.join('، ');
    if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (obj.width || obj.height) {
        const parts = [];
        if (obj.width) parts.push(`العرض: ${obj.width}`);
        if (obj.height) parts.push(`الارتفاع: ${obj.height}`);
        if (obj.depth) parts.push(`العمق: ${obj.depth}`);
        return parts.join(' - ');
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <KioskLayout currentStep={4}>
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-brand-dark mb-4">
              مراجعة الطلب
            </h1>
            <p className="text-xl text-brand-gray">
              راجع اختياراتك قبل إنشاء التصاميم
            </p>
          </div>

          {/* Department Card */}
          <Card className="mb-8" padding="lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center">
                <Palette className="w-8 h-8 text-brand-orange" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-brand-dark">{department?.name}</h2>
                <p className="text-brand-gray">{department?.description}</p>
              </div>
            </div>
          </Card>

          {/* Answers Groups */}
          <div className="space-y-6">
            {/* Basic Info Group */}
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-6 h-6 text-brand-orange" />
                <h3 className="text-xl font-bold text-brand-dark">التفاصيل الأساسية</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedAnswers.basic.map((question) => {
                  const answer = session?.answers?.[question.id];
                  if (answer === undefined) return null;

                  return (
                    <div key={question.id} className="flex items-start justify-between p-4 bg-brand-light rounded-xl">
                      <div className="flex-1">
                        <p className="text-brand-gray text-sm mb-1">{question.title}</p>
                        <p className="text-brand-dark font-medium text-lg">
                          {question.options?.find(o => o.value === answer)?.label || renderAnswerValue(answer)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEdit(question.id)}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-brand-gray" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Measurements Group */}
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <Ruler className="w-6 h-6 text-brand-orange" />
                <h3 className="text-xl font-bold text-brand-dark">المقاسات</h3>
              </div>
              {session?.measurements ? (
                <div className="grid grid-cols-3 gap-4">
                  {session.measurements.width && (
                    <div className="p-4 bg-brand-light rounded-xl text-center">
                      <p className="text-brand-gray text-sm">العرض</p>
                      <p className="text-2xl font-bold text-brand-dark">{session.measurements.width} {session.measurements.unit}</p>
                    </div>
                  )}
                  {session.measurements.height && (
                    <div className="p-4 bg-brand-light rounded-xl text-center">
                      <p className="text-brand-gray text-sm">الارتفاع</p>
                      <p className="text-2xl font-bold text-brand-dark">{session.measurements.height} {session.measurements.unit}</p>
                    </div>
                  )}
                  {session.measurements.depth && (
                    <div className="p-4 bg-brand-light rounded-xl text-center">
                      <p className="text-brand-gray text-sm">العمق</p>
                      <p className="text-2xl font-bold text-brand-dark">{session.measurements.depth} {session.measurements.unit}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-brand-gray">لم يتم إدخال مقاسات</p>
              )}
            </Card>

            {/* Style and Design Group */}
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="w-6 h-6 text-brand-orange" />
                <h3 className="text-xl font-bold text-brand-dark">التصميم والأناقة</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {groupedAnswers.style.map((question) => {
                  const answer = session?.answers?.[question.id];
                  if (answer === undefined) return null;

                  return (
                    <div key={question.id} className="p-4 bg-brand-light rounded-xl">
                      <p className="text-brand-gray text-sm mb-1">{question.title}</p>
                      <p className="text-brand-dark font-medium">
                        {question.options?.find(o => o.value === answer)?.label || renderAnswerValue(answer)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Images Group */}
            {session?.uploadedImages && session.uploadedImages.length > 0 && (
              <Card padding="lg">
                <div className="flex items-center gap-3 mb-6">
                  <Image className="w-6 h-6 text-brand-orange" />
                  <h3 className="text-xl font-bold text-brand-dark">الصور المرفقة</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {session.uploadedImages.map((img) => (
                    <div key={img.id} className="aspect-square rounded-xl overflow-hidden">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Other Details Group */}
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-6 h-6 text-brand-orange" />
                <h3 className="text-xl font-bold text-brand-dark">تفاصيل إضافية</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedAnswers.other.map((question) => {
                  const answer = session?.answers?.[question.id];
                  if (answer === undefined) return null;

                  return (
                    <div key={question.id} className="p-4 bg-brand-light rounded-xl">
                      <p className="text-brand-gray text-sm mb-1">{question.title}</p>
                      <p className="text-brand-dark font-medium">
                        {question.options?.find(o => o.value === answer)?.label || renderAnswerValue(answer)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6 mt-10">
            <Button
              variant="secondary"
              size="xl"
              onClick={() => navigate(-1)}
            >
              <ArrowRight className="w-5 h-5 ml-2" />
              تعديل
            </Button>
            <Button
              size="xl"
              onClick={handleGenerate}
              className="px-12"
            >
              إنشاء التصاميم
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>
      </div>
    </KioskLayout>
  );
};

export default ReviewPage;
