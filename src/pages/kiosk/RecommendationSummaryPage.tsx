import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle,
  ClipboardList,
  Gem,
  Layers,
  Palette,
  Ruler,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KioskLayout } from '../../components/layout';
import { Button } from '../../components/ui';
import { WelcomeAtmosphere } from '../../components/welcome/WelcomeAtmosphere';
import { useSession } from '../../context/SessionContext';
import { getDepartmentById, getQuestionsByDepartment } from '../../data';
import { DecisionAnswers } from '../../lib/decisionTree';
import {
  ComplementaryProductRule,
  getSummaryRecommendationResult,
  RankedSummaryRecommendation,
  SummaryRecommendationRule,
} from '../../lib/summaryRecommendationEngine';
import { DepartmentId, Question } from '../../types';
import complementaryProductRules from '../../config/questionnaire/complementaryProducts.json';
import summaryRecommendationRules from '../../config/questionnaire/summaryRecommendations.json';

type SummaryItem = {
  id: string;
  title: string;
  value: string;
  icon: React.ReactNode;
};

type ComparisonItem = {
  label: string;
  recommendation: RankedSummaryRecommendation;
};

const budgetLabels: Record<string, string> = {
  'under-5000': 'أقل من 5,000 ريال',
  '5000-10000': '5,000 - 10,000 ريال',
  '10000-20000': '10,000 - 20,000 ريال',
  '20000-50000': '20,000 - 50,000 ريال',
  'over-50000': 'أكثر من 50,000 ريال',
};

const formatRawAnswer = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getAnswerLabel = (question: Question, value: unknown): string => {
  if (Array.isArray(value)) {
    return value
      .map((item) => question.options?.find((option) => option.value === item)?.label || String(item))
      .join(', ');
  }

  return question.options?.find((option) => option.value === value)?.label || formatRawAnswer(value);
};

const formatDimensions = (
  measurements: { width?: number; height?: number; depth?: number; unit: string } | undefined,
  dimensionsChoice: unknown
): string => {
  const parts = [
    measurements?.width,
    measurements?.height,
    measurements?.depth,
  ].filter((value): value is number => typeof value === 'number' && value > 0);

  if (parts.length === 0 || dimensionsChoice === 'unknown') {
    return 'سيتم أخذ المقاسات بواسطة فريقنا أثناء المعاينة.';
  }

  return `${parts.join(' x ')} ${measurements?.unit || 'cm'}`;
};

const getIconForQuestion = (questionId: string): React.ReactNode => {
  if (questionId.includes('color') || questionId.includes('style') || questionId.includes('finish')) {
    return <Palette className="h-6 w-6" />;
  }
  if (questionId.includes('type') || questionId.includes('category')) {
    return <Layers className="h-6 w-6" />;
  }
  return <CheckCircle className="h-6 w-6" />;
};

const getBudgetSuitability = (
  recommendation: RankedSummaryRecommendation,
  budgetAnswer: unknown
): string => {
  const budgetValue = typeof budgetAnswer === 'string' ? budgetAnswer : '';
  const ruleId = recommendation.ruleId.toLowerCase();
  const isEconomical = ruleId.includes('economical') || ruleId.includes('standard') || ruleId.includes('practical');
  const isPremium = ruleId.includes('luxury') || ruleId.includes('premium') || ruleId.includes('imported') || ruleId.includes('custom');

  if (!budgetValue) return 'تحتاج مراجعة الميزانية مع العميل قبل الاعتماد النهائي.';
  if (budgetValue === 'under-5000') {
    if (isEconomical) return 'مناسب جداً للميزانية الاقتصادية.';
    if (isPremium) return 'أعلى من الميزانية، ويصلح كخيار مقارنة فاخر.';
    return 'مقبول بعد ضبط التفاصيل ضمن الميزانية الاقتصادية.';
  }
  if (budgetValue === 'over-50000') {
    if (isPremium) return 'مناسب جداً للميزانية الفاخرة.';
    if (isEconomical) return 'أقل من سقف الميزانية ويركز على العملية.';
    return 'متوافق مع ميزانية مرنة تسمح بترقيات إضافية.';
  }

  return `متوافق مع نطاق ${budgetLabels[budgetValue] || budgetValue}.`;
};

const AnimatedAwaelLogo: React.FC = () => (
  <div className="relative h-16 w-16">
    <div className="summary-logo-orbit summary-logo-orbit-outer" aria-hidden />
    <div className="summary-logo-orbit summary-logo-orbit-inner" aria-hidden />
    <svg className="summary-logo-blueprint" viewBox="0 0 120 120" aria-hidden>
      <path className="summary-logo-line summary-logo-line-1" d="M20 82V38L60 18L100 38V82" />
      <path className="summary-logo-line summary-logo-line-2" d="M34 86V48H86V86" />
      <path className="summary-logo-line summary-logo-line-3" d="M44 74H76M44 60H76M60 48V86" />
      <circle className="summary-logo-particle summary-logo-particle-1" r="2.2" />
      <circle className="summary-logo-particle summary-logo-particle-2" r="1.8" />
      <circle className="summary-logo-particle summary-logo-particle-3" r="2" />
    </svg>
    <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/88 shadow-[0_18px_50px_rgba(255,90,0,0.18)] ring-1 ring-white/80 backdrop-blur summary-logo-breathe">
      <img
        src="/brand/logo.png"
        alt="Al Awael"
        className="h-11 w-11 object-contain"
        loading="eager"
        decoding="async"
      />
    </div>
    <style>{`
      @keyframes summary-logo-breathe {
        0%, 100% {
          box-shadow: 0 18px 50px rgba(255, 90, 0, 0.18), 0 0 0 rgba(255, 90, 0, 0);
          transform: scale(1);
        }
        50% {
          box-shadow: 0 22px 62px rgba(255, 90, 0, 0.26), 0 0 28px rgba(255, 90, 0, 0.18);
          transform: scale(1.025);
        }
      }
      @keyframes summary-logo-orbit {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }
      @keyframes summary-logo-orbit-reverse {
        from { transform: translate(-50%, -50%) rotate(360deg); }
        to { transform: translate(-50%, -50%) rotate(0deg); }
      }
      @keyframes summary-logo-line-draw {
        0%, 12% { opacity: 0; stroke-dashoffset: 180; }
        30%, 78% { opacity: 0.65; stroke-dashoffset: 0; }
        100% { opacity: 0; stroke-dashoffset: -180; }
      }
      @keyframes summary-logo-particle-1 {
        0%, 100% { opacity: 0; transform: translate(18px, 42px); }
        32% { opacity: 0.9; transform: translate(60px, 20px); }
        66% { opacity: 0.45; transform: translate(101px, 43px); }
      }
      @keyframes summary-logo-particle-2 {
        0%, 100% { opacity: 0; transform: translate(99px, 82px); }
        38% { opacity: 0.85; transform: translate(60px, 100px); }
        72% { opacity: 0.42; transform: translate(22px, 82px); }
      }
      @keyframes summary-logo-particle-3 {
        0%, 100% { opacity: 0; transform: translate(34px, 86px); }
        45% { opacity: 0.78; transform: translate(60px, 60px); }
        78% { opacity: 0.38; transform: translate(86px, 86px); }
      }
      .summary-logo-breathe {
        animation: summary-logo-breathe 4.8s ease-in-out infinite;
      }
      .summary-logo-orbit {
        position: absolute;
        left: 50%;
        top: 50%;
        border-radius: 9999px;
        border: 1px solid rgba(255, 90, 0, 0.22);
        pointer-events: none;
      }
      .summary-logo-orbit::before {
        content: '';
        position: absolute;
        top: -3px;
        left: 50%;
        width: 6px;
        height: 6px;
        border-radius: 9999px;
        background: rgba(255, 90, 0, 0.7);
        box-shadow: 0 0 18px rgba(255, 90, 0, 0.45);
      }
      .summary-logo-orbit-outer {
        width: 96px;
        height: 96px;
        animation: summary-logo-orbit 13s linear infinite;
      }
      .summary-logo-orbit-inner {
        width: 78px;
        height: 78px;
        border-style: dashed;
        opacity: 0.7;
        animation: summary-logo-orbit-reverse 18s linear infinite;
      }
      .summary-logo-blueprint {
        position: absolute;
        inset: -28px;
        width: 120px;
        height: 120px;
        overflow: visible;
        pointer-events: none;
      }
      .summary-logo-line {
        fill: none;
        stroke: #FF5A00;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.2;
        stroke-dasharray: 180;
        stroke-dashoffset: 180;
        filter: drop-shadow(0 0 5px rgba(255, 90, 0, 0.22));
        animation: summary-logo-line-draw 7.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
      }
      .summary-logo-line-2 { animation-delay: 0.28s; opacity: 0.5; }
      .summary-logo-line-3 { animation-delay: 0.56s; opacity: 0.38; }
      .summary-logo-particle {
        fill: #FF5A00;
        filter: drop-shadow(0 0 7px rgba(255, 90, 0, 0.45));
        opacity: 0;
      }
      .summary-logo-particle-1 { animation: summary-logo-particle-1 8.8s ease-in-out infinite; }
      .summary-logo-particle-2 { animation: summary-logo-particle-2 9.4s ease-in-out infinite; }
      .summary-logo-particle-3 { animation: summary-logo-particle-3 10.2s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .summary-logo-breathe,
        .summary-logo-orbit,
        .summary-logo-line,
        .summary-logo-particle {
          animation: none !important;
        }
      }
    `}</style>
  </div>
);

const RecommendationSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const department = session?.departmentId ? getDepartmentById(session.departmentId) : null;
  const questions = session?.departmentId
    ? getQuestionsByDepartment(session.departmentId as DepartmentId)
    : [];

  const answerItems: SummaryItem[] = [
    ...(department
      ? [{
        id: 'category',
        title: 'Category',
        value: department.name,
        icon: <Layers className="h-6 w-6" />,
      }]
      : []),
    ...questions
      .map((question) => {
        const answer = session?.answers?.[question.id];
        if (answer === undefined || question.id === 'measurements') return null;

        return {
          id: question.id,
          title: question.title,
          value: getAnswerLabel(question, answer),
          icon: getIconForQuestion(question.id),
        };
      })
      .filter((item): item is SummaryItem => item !== null),
    {
      id: 'dimensions',
      title: 'Dimensions',
      value: formatDimensions(session?.measurements, session?.answers?.dimensions_known),
      icon: <Ruler className="h-6 w-6" />,
    },
  ];
  const recommendationResult = getSummaryRecommendationResult(
    session?.departmentId || undefined,
    (session?.answers || {}) as DecisionAnswers,
    summaryRecommendationRules as unknown as SummaryRecommendationRule[],
    complementaryProductRules as unknown as ComplementaryProductRule[]
  );
  const recommendation = recommendationResult?.primary;
  const heroImage = department?.image || '/brand/welcome-background.png';
  const specificationItems = answerItems.slice(0, 6);
  const complementaryItems = recommendation?.complementaryRecommendations || [];
  const comparisonItems: ComparisonItem[] = recommendationResult
    ? [
      { label: 'التوصية الأساسية', recommendation: recommendationResult.primary },
      ...recommendationResult.alternatives.slice(0, 2).map((alternative, index) => ({
        label: `البديل ${index + 1}`,
        recommendation: alternative,
      })),
    ]
    : [];
  const bestComparisonScore = Math.max(
    ...comparisonItems.map((item) => item.recommendation.matchScore),
    0
  );

  return (
    <KioskLayout currentStep={4} showProgress={false}>
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <WelcomeAtmosphere />

        <div className="relative z-10 flex-1 px-6 py-10 md:py-14">
          <div className="mx-auto max-w-6xl">
            {recommendation && (
              <div
                dir="rtl"
                className="recommendation-card-in space-y-7"
              >
                <section className="overflow-hidden rounded-[2.5rem] border border-white/75 bg-white/78 shadow-[0_34px_100px_rgba(41,45,50,0.18)] backdrop-blur-xl">
                  <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="relative min-h-[360px] overflow-hidden">
                      <img
                        src={heroImage}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="eager"
                        decoding="async"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 via-brand-dark/18 to-transparent" />
                      <div className="absolute bottom-6 right-6 left-6 flex items-end justify-between gap-4">
                        <div className="rounded-[28px] border border-white/35 bg-white/18 px-5 py-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                          <p className="text-sm font-bold opacity-80">تقرير صالة العرض</p>
                          <p className="text-2xl font-bold">{department?.name || 'التوصية'}</p>
                        </div>
                        <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-[30px] border border-white/40 bg-white/22 text-white shadow-[0_18px_50px_rgba(255,90,0,0.22)] backdrop-blur-xl">
                          <span className="text-3xl font-bold">{recommendation.matchScore}%</span>
                          <span className="text-xs font-bold opacity-80">مطابقة</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex flex-col justify-center bg-[radial-gradient(circle_at_top_right,rgba(255,90,0,0.14),rgba(255,255,255,0.86)_42%,rgba(255,255,255,0.72)_100%)] p-6 md:p-9">
                      <div className="mb-7 flex items-center justify-between gap-4">
                        <AnimatedAwaelLogo />
                        <div className="rounded-full bg-brand-orange/10 px-4 py-2 text-sm font-bold text-brand-orange">
                          التوصية الذكية
                        </div>
                      </div>

                      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-brand-orange">
                        <Award className="h-5 w-5" />
                        المنتج المقترح
                      </p>
                      <h1 className="text-3xl md:text-5xl font-bold text-brand-dark leading-tight">
                        {recommendation.productName}
                      </h1>
                      <p className="mt-5 text-lg md:text-2xl font-bold text-brand-dark/80 leading-relaxed">
                        {recommendation.shortDescription}
                      </p>
                      <p className="mt-5 text-base md:text-lg text-brand-gray leading-relaxed">
                        {recommendation.whyItFits}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
                  <div className="rounded-[2rem] border border-white/75 bg-white/80 p-6 md:p-8 shadow-[0_24px_76px_rgba(41,45,50,0.12)] backdrop-blur-xl">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
                        <Gem className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-gray">لماذا اختاره النظام؟</p>
                        <h2 className="text-2xl font-bold text-brand-dark">سبب الاختيار</h2>
                      </div>
                    </div>
                    <p className="text-lg leading-relaxed text-brand-gray">
                      {recommendation.whyItFits}
                    </p>
                  </div>

                  <div className="rounded-[2rem] border border-white/75 bg-white/80 p-6 md:p-8 shadow-[0_24px_76px_rgba(41,45,50,0.12)] backdrop-blur-xl">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
                        <Star className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-gray">مميزات هذا الاختيار</p>
                        <h2 className="text-2xl font-bold text-brand-dark">نقاط القوة</h2>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {recommendation.keyBenefits.map((benefit) => (
                        <div
                          key={benefit}
                          className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/78 px-4 py-3 text-brand-dark shadow-[0_10px_28px_rgba(41,45,50,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(41,45,50,0.1)]"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange">
                            <CheckCircle className="h-5 w-5" />
                          </span>
                          <span className="font-bold leading-relaxed">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-[2rem] border border-white/75 bg-white/80 p-6 md:p-8 shadow-[0_24px_76px_rgba(41,45,50,0.12)] backdrop-blur-xl">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-gray">تفاصيل المنتج</p>
                        <h2 className="text-2xl font-bold text-brand-dark">المواصفات</h2>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {specificationItems.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/80 bg-white/76 p-4 shadow-[0_10px_28px_rgba(41,45,50,0.06)]">
                          <p className="mb-1 text-sm font-bold text-brand-gray">{item.title}</p>
                          <p className="text-lg font-bold text-brand-dark leading-snug">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/75 bg-white/80 p-6 md:p-8 shadow-[0_24px_76px_rgba(41,45,50,0.12)] backdrop-blur-xl">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
                        <Layers className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-gray">ملخص العميل</p>
                        <h2 className="text-2xl font-bold text-brand-dark">اختيارات العميل</h2>
                      </div>
                    </div>
                    <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
                      {answerItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/76 p-4 shadow-[0_10px_28px_rgba(41,45,50,0.06)]">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
                            {item.icon}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-brand-gray">{item.title}</p>
                            <p className="text-base font-bold text-brand-dark">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {comparisonItems.length > 1 && (
                  <section className="rounded-[2rem] border border-white/75 bg-white/80 p-6 md:p-8 shadow-[0_24px_76px_rgba(41,45,50,0.12)] backdrop-blur-xl">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-gray">مقارنة المنتجات</p>
                        <h2 className="text-2xl font-bold text-brand-dark">مقارنة التوصية مع البدائل</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {comparisonItems.map((item) => {
                        const isBestRecommendation = item.recommendation.matchScore === bestComparisonScore;

                        return (
                          <div
                            key={item.recommendation.ruleId}
                            className={`relative overflow-hidden rounded-[28px] border p-5 text-right shadow-[0_14px_38px_rgba(41,45,50,0.08)] transition-all duration-300 hover:-translate-y-1 ${
                              isBestRecommendation
                                ? 'border-brand-orange/45 bg-[linear-gradient(145deg,rgba(255,90,0,0.13),rgba(255,255,255,0.86)_42%,rgba(255,255,255,0.78))] shadow-[0_20px_58px_rgba(255,90,0,0.16)]'
                                : 'border-white/80 bg-white/78 hover:shadow-[0_20px_54px_rgba(41,45,50,0.13)]'
                            }`}
                          >
                            {isBestRecommendation && (
                              <div className="absolute left-4 top-4 rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white shadow-[0_10px_24px_rgba(255,90,0,0.22)]">
                                الأفضل تلقائياً
                              </div>
                            )}

                            <div className="mb-4 flex items-center justify-between gap-3">
                              <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-bold text-brand-orange">
                                {item.label}
                              </span>
                              <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand-dark">
                                {item.recommendation.matchScore}% مطابقة
                              </span>
                            </div>

                            <h4 className="mb-4 text-lg font-bold text-brand-dark leading-snug">
                              {item.recommendation.productName}
                            </h4>

                            <div className="space-y-4">
                              <div>
                                <p className="mb-2 text-sm font-bold text-brand-gray">المميزات</p>
                                <div className="space-y-2">
                                  {item.recommendation.keyBenefits.slice(0, 3).map((benefit) => (
                                    <div key={benefit} className="flex items-center gap-2 text-sm font-bold text-brand-dark">
                                      <CheckCircle className="h-4 w-4 shrink-0 text-brand-orange" />
                                      <span>{benefit}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="rounded-2xl bg-white/68 p-4">
                                <p className="mb-1 text-sm font-bold text-brand-gray">أفضل استخدام</p>
                                <p className="text-sm font-bold leading-relaxed text-brand-dark">
                                  {item.recommendation.shortDescription}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-brand-light/70 p-4">
                                <p className="mb-1 text-sm font-bold text-brand-gray">ملاءمة الميزانية</p>
                                <p className="text-sm font-bold leading-relaxed text-brand-dark">
                                  {getBudgetSuitability(item.recommendation, session?.answers?.budget_intelligence)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {recommendationResult.alternatives.length > 0 && (
                  <section className="rounded-[2rem] border border-white/75 bg-white/80 p-6 md:p-8 shadow-[0_24px_76px_rgba(41,45,50,0.12)] backdrop-blur-xl">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
                        <Palette className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-gray">منتجات بديلة</p>
                        <h2 className="text-2xl font-bold text-brand-dark">بدائل مرتبة حسب الملاءمة</h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {recommendationResult.alternatives.map((alternative, index) => (
                        <div
                          key={alternative.ruleId}
                          className="rounded-[26px] border border-white/80 bg-white/78 p-5 text-right shadow-[0_14px_38px_rgba(41,45,50,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_54px_rgba(41,45,50,0.13)]"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-bold text-brand-orange">
                              #{index + 1}
                            </span>
                            <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand-dark">
                              {alternative.matchScore}%
                            </span>
                          </div>
                          <h4 className="mb-2 text-lg font-bold text-brand-dark leading-snug">
                            {alternative.productName}
                          </h4>
                          <p className="mb-3 text-sm font-bold text-brand-dark/75 leading-relaxed">
                            {alternative.shortDescription}
                          </p>
                          <p className="text-sm text-brand-gray leading-relaxed">
                            {alternative.whyItFits}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {complementaryItems.length > 0 && (
                  <section className="rounded-[2rem] border border-white/75 bg-white/80 p-6 md:p-8 shadow-[0_24px_76px_rgba(41,45,50,0.12)] backdrop-blur-xl">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
                        <Gem className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-gray">منتجات مكملة</p>
                        <h2 className="text-2xl font-bold text-brand-dark">اقتراحات تكمل التصميم</h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {complementaryItems.map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/78 p-4 text-brand-dark shadow-[0_10px_28px_rgba(41,45,50,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(41,45,50,0.1)]">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange/10 text-brand-orange">
                            <Palette className="h-5 w-5" />
                          </span>
                          <span className="font-bold leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <style>{`
                  @keyframes recommendation-card-in {
                    from {
                      opacity: 0;
                      transform: translateY(14px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                  .recommendation-card-in {
                    animation: recommendation-card-in 520ms ease-out both;
                  }
                  .recommendation-card-in > section {
                    animation: recommendation-card-in 620ms ease-out both;
                  }
                  .recommendation-card-in > section:nth-child(2) { animation-delay: 70ms; }
                  .recommendation-card-in > section:nth-child(3) { animation-delay: 120ms; }
                  .recommendation-card-in > section:nth-child(4) { animation-delay: 170ms; }
                  .recommendation-card-in > section:nth-child(5) { animation-delay: 220ms; }
                  @media (prefers-reduced-motion: reduce) {
                    .recommendation-card-in,
                    .recommendation-card-in > section {
                      animation: none !important;
                    }
                  }
                `}</style>
              </div>
            )}

            <div className="mt-9 flex flex-col-reverse sm:flex-row items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="xl"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto"
              >
                <ArrowRight className="w-5 h-5" />
                Back to Edit
              </Button>
              <Button
                size="xl"
                onClick={() => navigate('/kiosk/generate')}
                className="w-full sm:w-auto px-12"
              >
                Generate AI Design
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </KioskLayout>
  );
};

export default RecommendationSummaryPage;
