import React, { useMemo } from 'react';
import { CheckCircle, Crown, Lightbulb, Scale, Sparkles, Target } from 'lucide-react';
import { DecisionAnswers, DecisionValue } from '../../lib/decisionTree';

interface AIPreferencePredictionCardProps {
  answers: DecisionAnswers;
}

type ProjectBadge = {
  label: string;
  icon: React.ReactNode;
};

const toAnswerValues = (value: DecisionValue): string[] => {
  if (Array.isArray(value)) return value.map(String);
  if (value === undefined || value === null) return [];
  return [String(value)];
};

const getAnswerTokens = (answers: DecisionAnswers): string[] => (
  Object.values(answers)
    .flatMap(toAnswerValues)
    .map((value) => value.toLowerCase())
);

const hasAnyToken = (tokens: string[], values: string[]): boolean => (
  values.some((value) => tokens.includes(value))
);

const getProjectBadge = (answers: DecisionAnswers): ProjectBadge => {
  const budget = answers.budget_intelligence;
  const priority = answers.budgetPriority;

  if (budget === 'over-50000' || priority === 'luxury') {
    return {
      label: '⭐⭐ مستوى مشروع فاخر',
      icon: <Crown className="h-4 w-4" />,
    };
  }

  if (budget === 'under-5000' || priority === 'economy') {
    return {
      label: '💡 مشروع اقتصادي ذكي',
      icon: <Lightbulb className="h-4 w-4" />,
    };
  }

  return {
    label: '⭐ مشروع متوازن',
    icon: <Scale className="h-4 w-4" />,
  };
};

const getPreferencePredictions = (answers: DecisionAnswers): string[] => {
  const tokens = getAnswerTokens(answers);
  const predictions: string[] = [];

  if (tokens.length === 0) {
    return ['لم يتم اختيار تفاصيل كافية بعد لتكوين قراءة دقيقة للذوق.'];
  }

  if (
    answers.budgetPriority === 'luxury' ||
    answers.budget_intelligence === 'over-50000' ||
    hasAnyToken(tokens, ['luxury', 'hotel', 'modern-classic'])
  ) {
    predictions.push(
      'تميل إلى التصاميم الفاخرة.',
      'تفضل الخامات عالية الجودة.',
      'تهتم بالمظهر النهائي أكثر من السعر.'
    );
  }

  if (
    answers.budgetPriority === 'economy' ||
    answers.budget_intelligence === 'under-5000'
  ) {
    predictions.push(
      'تبحث عن أفضل قيمة.',
      'تفضل الخيارات العملية.',
      'الأولوية لديك هي التكلفة المناسبة.'
    );
  }

  if (answers.budgetPriority === 'balanced') {
    predictions.push(
      'تفضل توازنًا واضحًا بين الجودة والسعر.',
      'تبحث عن اختيارات عملية بمظهر راقٍ.'
    );
  }

  if (answers.budgetPriority === 'quality') {
    predictions.push(
      'تركز على جودة الخامات قبل التفاصيل الثانوية.',
      'تفضل حلولًا تدوم لفترة أطول.'
    );
  }

  if (hasAnyToken(tokens, ['black', 'dark-wood', 'matte-black', 'smoky', 'tinted', 'gray'])) {
    predictions.push(
      'تميل إلى الألوان الداكنة.',
      'تفضل الطابع العصري.',
      'تحب التباين القوي.'
    );
  }

  if (hasAnyToken(tokens, ['white', 'beige', 'cream', 'light-wood', 'clear'])) {
    predictions.push(
      'تميل إلى المساحات الهادئة.',
      'تحب الإضاءة الطبيعية.',
      'تفضل التصاميم المفتوحة.'
    );
  }

  if (hasAnyToken(tokens, ['outdoor', 'both', 'facade', 'facades'])) {
    predictions.push(
      'الأولوية لديك هي التحمل.',
      'تحتاج خامات مقاومة للعوامل الجوية.'
    );
  }

  if (hasAnyToken(tokens, ['modern', 'minimal', 'saudi-contemporary'])) {
    predictions.push(
      'تفضل خطوطًا نظيفة وواجهة تصميم حديثة.',
      'تميل إلى التفاصيل الهادئة وغير المزدحمة.'
    );
  }

  return [...new Set(predictions)].slice(0, 5);
};

export const AIPreferencePredictionCard: React.FC<AIPreferencePredictionCardProps> = ({
  answers,
}) => {
  const predictions = useMemo(() => getPreferencePredictions(answers), [answers]);
  const badge = useMemo(() => getProjectBadge(answers), [answers]);
  const animationKey = predictions.join('|');

  return (
    <section
      dir="rtl"
      className="ai-preference-enter relative mx-auto mt-4 w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/70 bg-white/40 px-5 py-5 shadow-[0_22px_68px_rgba(41,45,50,0.10)] backdrop-blur-[28px] md:px-7"
      aria-label="AI preference prediction"
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent" />
      <div className="pointer-events-none absolute -left-14 -top-16 h-44 w-44 rounded-full bg-brand-orange/14 blur-[62px]" />
      <div className="pointer-events-none absolute right-10 bottom-0 h-28 w-44 rounded-full bg-white/60 blur-[58px]" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="ai-target-glow relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/54 text-brand-orange shadow-[0_14px_36px_rgba(255,90,0,0.16)] backdrop-blur-[28px]">
            <Target className="relative z-10 h-7 w-7" />
          </div>

          <div>
            <p className="flex items-center gap-2 text-base font-bold text-brand-dark md:text-lg">
              <Sparkles className="h-4 w-4 text-brand-orange" />
              🎯 ماذا فهم الذكاء الاصطناعي عن ذوقك؟
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/54 px-3 py-1.5 text-xs font-bold text-brand-orange shadow-[0_10px_28px_rgba(255,90,0,0.12)] backdrop-blur-[28px]">
              {badge.icon}
              <span>{badge.label}</span>
            </div>
          </div>
        </div>

        <div key={animationKey} className="ai-prediction-fade grid flex-1 gap-2 md:max-w-xl">
          {predictions.map((prediction) => (
            <div
              key={prediction}
              className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/46 px-4 py-3 text-sm font-bold leading-relaxed text-brand-dark shadow-[0_10px_28px_rgba(41,45,50,0.06)] backdrop-blur-[28px]"
            >
              <CheckCircle className="h-4 w-4 shrink-0 text-brand-orange" />
              <span>{prediction}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ai-preference-enter {
          from { opacity: 0; transform: translateY(-6px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes ai-prediction-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes ai-target-pulse {
          0%, 100% { box-shadow: 0 14px 36px rgba(255, 90, 0, 0.16); }
          50% { box-shadow: 0 18px 48px rgba(255, 90, 0, 0.24); }
        }

        .ai-preference-enter {
          animation: ai-preference-enter 480ms ease-out both;
        }

        .ai-prediction-fade {
          animation: ai-prediction-fade 360ms ease-out both;
        }

        .ai-target-glow {
          animation: ai-target-pulse 3.4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .ai-preference-enter,
          .ai-prediction-fade,
          .ai-target-glow {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default AIPreferencePredictionCard;
