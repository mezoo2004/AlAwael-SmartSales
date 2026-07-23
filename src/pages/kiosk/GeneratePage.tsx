import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { KioskLayout } from '../../components/layout';
import { WelcomeAtmosphere } from '../../components/welcome/WelcomeAtmosphere';
import { useSession } from '../../context/SessionContext';
import { aiProvider } from '../../providers';

const generationSteps = [
  'تحليل بيانات العميل',
  'اختيار المنتجات المناسبة',
  'إنشاء التصاميم',
  'تحسين الجودة',
  'تجهيز النتائج النهائية',
];

const GeneratePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, setGeneratedDesigns } = useSession();
  const [progress, setProgress] = useState({ step: 0, total: 5, message: '' });
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    const generate = async () => {
      if (!session) return;
      if (hasGeneratedRef.current) return;
      hasGeneratedRef.current = true;

      try {
        const designs = await aiProvider.generateDesigns(session, (p) => {
          setProgress(p);
        });
        console.log('AI generated designs before Supabase persistence', designs);
        await setGeneratedDesigns(designs);
        navigate('/kiosk/designs');
      } catch (error) {
        hasGeneratedRef.current = false;
        console.error('Generation failed:', error);
      }
    };

    generate();
  }, [session, setGeneratedDesigns, navigate]);

  const progressPercent = (progress.step / progress.total) * 100;
  const displayPercent = Math.max(0, Math.min(100, Math.round(progressPercent)));
  const activeStepIndex = Math.max(0, Math.min(generationSteps.length - 1, Math.max(progress.step, 1) - 1));
  const estimatedSeconds = Math.max(5, (generationSteps.length - activeStepIndex) * 7);

  return (
    <KioskLayout currentStep={3} showProgress={false}>
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <WelcomeAtmosphere />

        <div className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
          <div className="w-full max-w-3xl text-center generation-content-in">
            <div className="bg-white/82 backdrop-blur-xl rounded-[2rem] border border-white/70 shadow-[0_30px_90px_rgba(41,45,50,0.16)] px-6 py-8 md:px-12 md:py-11">
              <div className="relative mx-auto mb-9 h-36 w-36 md:h-40 md:w-40">
                <svg className="absolute inset-0 h-full w-full generation-architecture-ai" viewBox="0 0 160 160" aria-hidden>
                  <defs>
                    <filter id="aiDoorGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FF5A00" floodOpacity="0.65" />
                    </filter>
                    <pattern id="aiBlueprintGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M10 0H0V10" fill="none" stroke="#FF5A00" strokeWidth="0.35" opacity="0.28" />
                    </pattern>
                  </defs>

                  <rect className="ai-blueprint-grid" x="11" y="11" width="138" height="138" rx="28" fill="url(#aiBlueprintGrid)" />
                  <path className="ai-blueprint-guide" d="M34 126H126M46 36V126M114 36V126M46 36H114" />

                  <path className="ai-frame-line ai-frame-line-1" d="M47 126V36H113V126" />
                  <path className="ai-frame-line ai-frame-line-2" d="M57 126V48H103V126" />
                  <path className="ai-frame-line ai-frame-line-3" d="M80 48V126" />

                  <path className="ai-glass-panel ai-glass-panel-1" d="M61 54H77V120H61Z" />
                  <path className="ai-glass-panel ai-glass-panel-2" d="M83 54H99V120H83Z" />

                  <path className="ai-marble-cladding ai-marble-left" d="M31 126V54H43V126Z" />
                  <path className="ai-marble-cladding ai-marble-right" d="M117 126V54H129V126Z" />
                  <path className="ai-marble-vein ai-marble-vein-1" d="M34 116C42 100 31 88 41 70" />
                  <path className="ai-marble-vein ai-marble-vein-2" d="M126 62C116 80 130 94 120 116" />

                  <path className="ai-light ai-light-top" d="M51 30H109" />
                  <path className="ai-light ai-light-left" d="M39 48V124" />
                  <path className="ai-light ai-light-right" d="M121 48V124" />
                  <path className="ai-complete-glow" d="M31 126V30H129V126Z" />

                  <path className="ai-neural-link ai-neural-link-1" d="M30 42L58 54L80 35L102 54L130 42" />
                  <path className="ai-neural-link ai-neural-link-2" d="M34 120L61 92L80 126L99 92L126 120" />

                  <circle className="ai-particle ai-particle-1" r="2.4" />
                  <circle className="ai-particle ai-particle-2" r="2" />
                  <circle className="ai-particle ai-particle-3" r="2.2" />
                  <circle className="ai-particle ai-particle-4" r="1.8" />
                </svg>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-brand-dark mb-4 leading-tight">
                يقوم الذكاء الاصطناعي بتحليل طلبك
              </h1>
              <p className="text-lg md:text-2xl text-brand-gray max-w-2xl mx-auto leading-relaxed mb-8">
                نحلل اختياراتك وننشئ تصاميم واقعية مخصصة لك.
              </p>

              <div className="max-w-xl mx-auto mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm md:text-base font-bold text-brand-dark">
                    {displayPercent}%
                  </span>
                  <span className="text-sm md:text-base text-brand-gray">
                    الوقت المتبقي: حوالي {estimatedSeconds} ثانية
                  </span>
                </div>
                <div className="h-4 rounded-full bg-white/55 border border-white/70 shadow-inner overflow-hidden backdrop-blur">
                  <div
                    className="h-full rounded-full bg-brand-orange-gradient shadow-[0_0_24px_rgba(255,90,0,0.35)] transition-all duration-700 ease-out"
                    style={{ width: `${displayPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-3 max-w-xl mx-auto text-right">
                {generationSteps.map((step, index) => {
                  const isComplete = index < activeStepIndex;
                  const isActive = index === activeStepIndex;

                  return (
                    <div
                      key={step}
                      className={`
                        flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300
                        ${isActive
                          ? 'bg-brand-orange/10 text-brand-dark shadow-[0_12px_34px_rgba(255,90,0,0.12)] scale-[1.01]'
                          : isComplete
                            ? 'bg-white/60 text-brand-dark'
                            : 'bg-white/35 text-brand-gray'
                        }
                      `}
                    >
                      <span
                        className={`
                          flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold
                          ${isComplete
                            ? 'bg-brand-orange text-white'
                            : isActive
                              ? 'bg-white text-brand-orange shadow-[0_0_18px_rgba(255,90,0,0.22)] generation-step-pulse'
                              : 'bg-brand-light text-brand-gray'
                          }
                        `}
                      >
                        {isComplete ? '✓' : isActive ? '⏳' : '⏳'}
                      </span>
                      <span className="text-base md:text-lg font-bold">{step}</span>
                    </div>
                  );
                })}
              </div>

              {progress.message && (
                <p className="text-brand-orange font-bold mt-7 min-h-[28px] generation-message-fade">
                  {progress.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes generation-content-in {
            from { opacity: 0; transform: translateY(14px) scale(0.985); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes ai-blueprint-grid {
            0%, 8% { opacity: 0; transform: scale(0.96); }
            14%, 82% { opacity: 1; transform: scale(1); }
            92%, 100% { opacity: 0; transform: scale(0.98); }
          }
          @keyframes ai-line-draw {
            0%, 12% { opacity: 0; stroke-dashoffset: 240; filter: none; }
            28%, 78% { opacity: 1; stroke-dashoffset: 0; filter: drop-shadow(0 0 5px rgba(255, 90, 0, 0.45)); }
            92%, 100% { opacity: 0.18; stroke-dashoffset: -240; filter: none; }
          }
          @keyframes ai-panel-build {
            0%, 31% { opacity: 0; transform: scaleY(0.1); }
            43%, 78% { opacity: 0.42; transform: scaleY(1); }
            92%, 100% { opacity: 0; transform: scaleY(0.75); }
          }
          @keyframes ai-marble-build {
            0%, 44% { opacity: 0; stroke-dashoffset: 160; }
            56%, 80% { opacity: 0.9; stroke-dashoffset: 0; }
            92%, 100% { opacity: 0; stroke-dashoffset: -160; }
          }
          @keyframes ai-light-on {
            0%, 57% { opacity: 0; stroke-dashoffset: 110; }
            68%, 84% { opacity: 1; stroke-dashoffset: 0; filter: drop-shadow(0 0 9px rgba(255, 90, 0, 0.75)); }
            94%, 100% { opacity: 0; stroke-dashoffset: -110; filter: none; }
          }
          @keyframes ai-complete-glow {
            0%, 66% { opacity: 0; }
            74%, 84% { opacity: 0.34; }
            94%, 100% { opacity: 0; }
          }
          @keyframes ai-neural-flash {
            0%, 18%, 100% { opacity: 0; stroke-dashoffset: 140; }
            25%, 31% { opacity: 0.8; stroke-dashoffset: 0; }
            38% { opacity: 0; stroke-dashoffset: -140; }
            58%, 64% { opacity: 0.7; stroke-dashoffset: 0; }
            72% { opacity: 0; stroke-dashoffset: -140; }
          }
          @keyframes ai-particle-1 {
            0%, 100% { opacity: 0; transform: translate(30px, 42px); }
            16% { opacity: 1; transform: translate(58px, 54px); }
            32% { opacity: 0.8; transform: translate(80px, 35px); }
            48% { opacity: 0; transform: translate(102px, 54px); }
          }
          @keyframes ai-particle-2 {
            0%, 22%, 100% { opacity: 0; transform: translate(130px, 42px); }
            38% { opacity: 1; transform: translate(102px, 54px); }
            54% { opacity: 0.85; transform: translate(99px, 92px); }
            70% { opacity: 0; transform: translate(126px, 120px); }
          }
          @keyframes ai-particle-3 {
            0%, 36%, 100% { opacity: 0; transform: translate(34px, 120px); }
            50% { opacity: 1; transform: translate(61px, 92px); }
            66% { opacity: 0.9; transform: translate(80px, 126px); }
            82% { opacity: 0; transform: translate(99px, 92px); }
          }
          @keyframes ai-particle-4 {
            0%, 48%, 100% { opacity: 0; transform: translate(80px, 35px); }
            62% { opacity: 1; transform: translate(80px, 54px); }
            78% { opacity: 0.85; transform: translate(80px, 92px); }
            90% { opacity: 0; transform: translate(80px, 126px); }
          }
          @keyframes generation-step-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
          .generation-content-in {
            animation: generation-content-in 520ms ease-out both;
          }
          .generation-architecture-ai {
            overflow: visible;
          }
          .ai-blueprint-grid {
            animation: ai-blueprint-grid 7.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
            transform-origin: 80px 80px;
          }
          .ai-blueprint-guide {
            fill: none;
            stroke: #FF5A00;
            stroke-width: 0.7;
            stroke-dasharray: 3 5;
            opacity: 0.24;
            animation: ai-blueprint-grid 7.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
          }
          .ai-frame-line,
          .ai-marble-vein,
          .ai-light,
          .ai-neural-link {
            fill: none;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .ai-frame-line {
            stroke: #FF5A00;
            stroke-width: 3;
            stroke-dasharray: 240;
            stroke-dashoffset: 240;
            animation: ai-line-draw 7.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          }
          .ai-frame-line-2 { animation-delay: 0.22s; stroke-width: 2.1; opacity: 0.9; }
          .ai-frame-line-3 { animation-delay: 0.42s; stroke-width: 1.8; opacity: 0.82; }
          .ai-glass-panel {
            fill: #FFFFFF;
            stroke: #FF5A00;
            stroke-width: 1.2;
            opacity: 0;
            transform-origin: 80px 126px;
            animation: ai-panel-build 7.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
          }
          .ai-glass-panel-2 { animation-delay: 0.18s; }
          .ai-marble-cladding {
            fill: #FFFFFF;
            stroke: #FF5A00;
            stroke-width: 1.3;
            stroke-dasharray: 160;
            stroke-dashoffset: 160;
            animation: ai-marble-build 7.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          }
          .ai-marble-right { animation-delay: 0.14s; }
          .ai-marble-vein {
            stroke: #FF5A00;
            stroke-width: 0.95;
            stroke-dasharray: 80;
            stroke-dashoffset: 80;
            opacity: 0;
            animation: ai-marble-build 7.8s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          }
          .ai-marble-vein-2 { animation-delay: 0.16s; }
          .ai-light {
            stroke: #FFFFFF;
            stroke-width: 3.2;
            stroke-dasharray: 110;
            stroke-dashoffset: 110;
            animation: ai-light-on 7.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
          }
          .ai-complete-glow {
            fill: none;
            stroke: #FF5A00;
            stroke-width: 5;
            opacity: 0;
            filter: url(#aiDoorGlow);
            animation: ai-complete-glow 7.8s ease-in-out infinite;
          }
          .ai-neural-link {
            stroke: #FF5A00;
            stroke-width: 1.1;
            stroke-dasharray: 140;
            stroke-dashoffset: 140;
            animation: ai-neural-flash 7.8s ease-in-out infinite;
          }
          .ai-neural-link-2 { animation-delay: 0.34s; }
          .ai-particle {
            fill: #FF5A00;
            filter: url(#aiDoorGlow);
            opacity: 0;
          }
          .ai-particle-1 { animation: ai-particle-1 7.8s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
          .ai-particle-2 { animation: ai-particle-2 7.8s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
          .ai-particle-3 { animation: ai-particle-3 7.8s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
          .ai-particle-4 { animation: ai-particle-4 7.8s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
          .ai-light-top,
          .ai-light-left,
          .ai-light-right {
            filter: drop-shadow(0 0 8px rgba(255, 90, 0, 0.45));
          }
          .generation-step-pulse {
            animation: generation-step-pulse 1.6s ease-in-out infinite;
          }
          .generation-message-fade {
            animation: generation-content-in 420ms ease-out both;
          }
          @media (prefers-reduced-motion: reduce) {
            .generation-content-in,
            .ai-blueprint-grid,
            .ai-blueprint-guide,
            .ai-frame-line,
            .ai-glass-panel,
            .ai-marble-cladding,
            .ai-marble-vein,
            .ai-light,
            .ai-complete-glow,
            .ai-neural-link,
            .ai-particle,
            .generation-step-pulse,
            .generation-message-fade {
              animation: none !important;
            }
          }
        `}</style>
      </div>
    </KioskLayout>
  );
};

export default GeneratePage;
