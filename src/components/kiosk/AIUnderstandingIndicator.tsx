import React, { useEffect, useMemo, useState } from 'react';
import { Brain, CheckCircle } from 'lucide-react';

interface AIUnderstandingIndicatorProps {
  answeredCount: number;
  currentQuestionIndex: number;
  totalQuestions: number;
}

const understandingMessages = [
  'جاري تحليل نوع المشروع...',
  'فهمنا نوع الاستخدام...',
  'جاري تحديد مستوى الجودة المناسب...',
  'تحليل الميزانية...',
  'مطابقة الخيارات...',
  'بناء تصور أولي...',
  'تحسين التوصيات...',
  'جاهز لإنشاء التصميم.',
];

const getTargetConfidence = (
  answeredCount: number,
  currentQuestionIndex: number,
  totalQuestions: number
): number => {
  if (totalQuestions <= 0) return 12;

  const answeredRatio = answeredCount / totalQuestions;
  const positionRatio = (currentQuestionIndex + 1) / totalQuestions;
  const blendedRatio = Math.max(answeredRatio, positionRatio * 0.45);

  return Math.max(12, Math.min(100, Math.round(12 + blendedRatio * 88)));
};

export const AIUnderstandingIndicator: React.FC<AIUnderstandingIndicatorProps> = ({
  answeredCount,
  currentQuestionIndex,
  totalQuestions,
}) => {
  const targetConfidence = useMemo(
    () => getTargetConfidence(answeredCount, currentQuestionIndex, totalQuestions),
    [answeredCount, currentQuestionIndex, totalQuestions]
  );
  const [displayedConfidence, setDisplayedConfidence] = useState(targetConfidence);

  useEffect(() => {
    if (displayedConfidence === targetConfidence) return undefined;

    const step = displayedConfidence < targetConfidence ? 1 : -1;
    const distance = Math.abs(targetConfidence - displayedConfidence);
    const interval = window.setInterval(() => {
      setDisplayedConfidence((current) => {
        if (current === targetConfidence) return current;
        const next = current + step;
        return step > 0 ? Math.min(next, targetConfidence) : Math.max(next, targetConfidence);
      });
    }, Math.max(14, Math.min(38, Math.round(420 / Math.max(distance, 1)))));

    return () => window.clearInterval(interval);
  }, [displayedConfidence, targetConfidence]);

  const messageIndex = Math.min(
    understandingMessages.length - 1,
    Math.max(0, Math.floor((displayedConfidence / 101) * understandingMessages.length))
  );

  return (
    <section
      dir="rtl"
      className="ai-understanding-enter relative mx-auto mt-5 w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/70 bg-white/42 px-5 py-4 shadow-[0_22px_68px_rgba(41,45,50,0.11)] backdrop-blur-[28px] md:px-7"
      aria-label="AI understanding indicator"
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-brand-orange/16 blur-[64px]" />
      <div className="pointer-events-none absolute left-10 bottom-0 h-28 w-40 rounded-full bg-white/60 blur-[58px]" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="ai-brain-orbit relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/54 text-brand-orange shadow-[0_14px_36px_rgba(255,90,0,0.16)] backdrop-blur-[28px]">
            <Brain className="relative z-10 h-7 w-7" />
          </div>

          <div>
            <p className="text-base font-bold text-brand-dark md:text-lg">
              الذكاء الاصطناعي يفهم مشروعك...
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-brand-gray">
              <CheckCircle className="h-4 w-4 text-brand-orange" />
              {understandingMessages[messageIndex]}
            </p>
          </div>
        </div>

        <div className="min-w-[220px]">
          <div className="mb-2 flex items-end justify-between gap-4">
            <span className="text-xs font-bold text-brand-gray">AI Confidence</span>
            <span className="text-3xl font-bold text-brand-orange tabular-nums">
              {displayedConfidence}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/72 shadow-inner">
            <div
              className="ai-confidence-bar h-full rounded-full bg-gradient-to-r from-brand-orange via-orange-400 to-brand-orange shadow-[0_0_24px_rgba(255,90,0,0.36)] transition-[width] duration-700 ease-out"
              style={{ width: `${displayedConfidence}%` }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ai-understanding-enter {
          from { opacity: 0; transform: translateY(-8px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes ai-brain-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes ai-confidence-glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.16); }
        }

        .ai-understanding-enter {
          animation: ai-understanding-enter 460ms ease-out both;
        }

        .ai-brain-orbit::before,
        .ai-brain-orbit::after {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 20px;
          border: 1px solid rgba(255, 90, 0, 0.22);
          animation: ai-brain-orbit 16s linear infinite;
        }

        .ai-brain-orbit::after {
          inset: 6px;
          border-style: dashed;
          opacity: 0.72;
          animation-duration: 22s;
          animation-direction: reverse;
        }

        .ai-confidence-bar {
          animation: ai-confidence-glow 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .ai-understanding-enter,
          .ai-brain-orbit::before,
          .ai-brain-orbit::after,
          .ai-confidence-bar {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default AIUnderstandingIndicator;
