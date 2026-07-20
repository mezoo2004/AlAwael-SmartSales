import React from 'react';
import { ArrowLeft, Check, Crown, DollarSign, Scale, Star, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KioskLayout } from '../../components/layout';
import { Button } from '../../components/ui';
import { useSession } from '../../context/SessionContext';

export const BUDGET_INTELLIGENCE_ANSWER_ID = 'budget_intelligence';
export const BUDGET_PRIORITY_ANSWER_ID = 'budgetPriority';

const budgetRanges = [
  { id: 'under-5000', label: 'أقل من 5,000 ريال', value: 'under-5000' },
  { id: '5000-10000', label: '5,000 - 10,000 ريال', value: '5000-10000' },
  { id: '10000-20000', label: '10,000 - 20,000 ريال', value: '10000-20000' },
  { id: '20000-50000', label: '20,000 - 50,000 ريال', value: '20000-50000' },
  { id: 'over-50000', label: 'أكثر من 50,000 ريال', value: 'over-50000' },
];

const investmentPriorities = [
  {
    id: 'luxury',
    title: 'فخامة',
    description: 'أريد أفخم الخيارات الممكنة.',
    icon: Crown,
  },
  {
    id: 'balanced',
    title: 'أفضل قيمة',
    description: 'أفضل توازن بين الجودة والسعر.',
    icon: Scale,
  },
  {
    id: 'quality',
    title: 'جودة عالية',
    description: 'أفضل جودة ضمن حدود ميزانيتي.',
    icon: Star,
  },
  {
    id: 'economy',
    title: 'أقل تكلفة',
    description: 'أبحث عن أفضل نتيجة بأقل تكلفة ممكنة.',
    icon: DollarSign,
  },
];

const BudgetIntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const { session, setAnswer, getAnswer } = useSession();
  const selectedBudget = getAnswer(BUDGET_INTELLIGENCE_ANSWER_ID);
  const selectedPriority = getAnswer(BUDGET_PRIORITY_ANSWER_ID);

  React.useEffect(() => {
    if (!session?.departmentId) {
      navigate('/kiosk/departments', { replace: true });
    }
  }, [session?.departmentId, navigate]);

  const handleContinue = () => {
    if (!selectedBudget || !selectedPriority) return;
    navigate(session?.departmentId ? `/kiosk/configure/${session.departmentId}` : '/kiosk/departments');
  };

  return (
    <KioskLayout currentStep={2}>
      <div className="relative flex-1 overflow-y-auto p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-[8%] top-[10%] h-72 w-72 rounded-full bg-brand-orange/16 blur-[90px]" />
          <div className="absolute left-[10%] top-[38%] h-80 w-80 rounded-full bg-white/70 blur-[110px]" />
          <div className="absolute bottom-[10%] right-[32%] h-64 w-64 rounded-full bg-brand-orange/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-5 h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-brand-orange/70 to-transparent shadow-[0_0_24px_rgba(255,90,0,0.28)]" />
            <h1 className="mb-4 text-4xl font-bold text-brand-dark md:text-5xl">
              الميزانية التقريبية
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-brand-gray md:text-xl">
              تم تخصيص الخيارات المناسبة بناءً على ميزانيتك.
            </p>
          </div>

          <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/35 p-5 shadow-[0_30px_90px_rgba(41,45,50,0.12)] backdrop-blur-[28px] md:p-7">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-orange/14 blur-[58px]" />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 md:gap-6">
              {budgetRanges.map((range) => {
                const isSelected = selectedBudget === range.value;

                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setAnswer(BUDGET_INTELLIGENCE_ANSWER_ID, range.value)}
                    className={`
                      glass-budget-card group relative overflow-hidden rounded-[30px] border text-right
                      bg-white/42 p-5 shadow-[0_18px_54px_rgba(41,45,50,0.10)] backdrop-blur-[28px]
                      transition-all duration-[350ms] ease-out hover:-translate-y-1 hover:bg-white/52
                      hover:shadow-[0_28px_78px_rgba(41,45,50,0.15)] focus:outline-none focus:ring-4 focus:ring-brand-orange/10
                      ${isSelected
                        ? 'scale-[1.03] border-brand-orange/60 bg-white/62 shadow-[0_26px_82px_rgba(255,90,0,0.20)] ring-4 ring-brand-orange/10'
                        : 'border-white/70 hover:border-white/90'
                      }
                    `}
                  >
                    <div className={`glass-sheen absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-0 ${isSelected ? 'glass-sheen-active' : 'group-hover:opacity-80'}`} />
                    <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
                    <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,90,0,0.20),transparent_46%)] transition-opacity duration-[350ms] ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />

                    <div className="relative flex items-center gap-4">
                      <div className={`flex h-[72px] w-[72px] flex-none items-center justify-center rounded-[24px] shadow-inner ring-1 transition-all duration-[350ms] ${isSelected ? 'bg-brand-orange text-white shadow-[0_18px_42px_rgba(255,90,0,0.26)] ring-white/50' : 'bg-white/54 text-brand-orange ring-white/80 group-hover:bg-white/68'}`}>
                        <WalletCards className="h-8 w-8" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`text-xl font-bold transition-colors duration-[350ms] md:text-2xl ${isSelected ? 'text-brand-orange' : 'text-brand-dark'}`}>
                          {range.label}
                        </h3>
                      </div>
                      {isSelected && (
                        <div className="budget-check-pop absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange shadow-[0_12px_28px_rgba(255,90,0,0.32)]">
                          <Check className="h-5 w-5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="relative mt-10 overflow-hidden rounded-[36px] border border-white/70 bg-white/35 p-5 shadow-[0_30px_90px_rgba(41,45,50,0.12)] backdrop-blur-[28px] md:p-7">
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
            <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-brand-orange/12 blur-[70px]" />

            <div className="mb-7 text-right">
              <h2 className="mb-3 text-3xl font-bold text-brand-dark">
                ما هي أولويتك في هذا المشروع؟
              </h2>
              <p className="text-lg text-brand-gray">
                حتى لو كانت الميزانية نفسها، تختلف التوصيات حسب ما يهمك أكثر.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {investmentPriorities.map((priority) => {
                const Icon = priority.icon;
                const isSelected = selectedPriority === priority.id;

                return (
                  <button
                    key={priority.id}
                    type="button"
                    onClick={() => setAnswer(BUDGET_PRIORITY_ANSWER_ID, priority.id)}
                    className={`
                      glass-budget-card group relative overflow-hidden rounded-[30px] border bg-white/42 p-5 text-right
                      shadow-[0_18px_54px_rgba(41,45,50,0.10)] backdrop-blur-[28px]
                      transition-all duration-[350ms] ease-out hover:-translate-y-1 hover:scale-[1.01] hover:bg-white/52
                      hover:shadow-[0_28px_78px_rgba(41,45,50,0.15)]
                      focus:outline-none focus:ring-4 focus:ring-brand-orange/10
                      ${isSelected
                        ? 'scale-[1.03] border-brand-orange/60 bg-white/62 ring-4 ring-brand-orange/10 shadow-[0_26px_82px_rgba(255,90,0,0.20)]'
                        : 'border-white/70 hover:border-white/90'
                      }
                    `}
                  >
                    <div className={`glass-sheen absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-0 ${isSelected ? 'glass-sheen-active' : 'group-hover:opacity-80'}`} />
                    <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
                    <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,90,0,0.18),transparent_48%)] opacity-0 transition-opacity duration-[350ms] ${isSelected ? 'opacity-100' : 'group-hover:opacity-70'}`} />
                    <div className="relative">
                      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner ring-1 transition-all duration-[350ms] ${isSelected ? 'bg-brand-orange text-white shadow-[0_14px_34px_rgba(255,90,0,0.24)] ring-white/50' : 'bg-white/54 text-brand-orange ring-white/80 group-hover:bg-white/68'}`}>
                        <Icon className="h-7 w-7" />
                      </div>

                      <h3 className={`mb-2 text-xl font-bold transition-colors duration-[350ms] ${isSelected ? 'text-brand-orange' : 'text-brand-dark'}`}>
                        {priority.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-brand-gray">
                        {priority.description}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="budget-check-pop absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange shadow-[0_12px_28px_rgba(255,90,0,0.32)]">
                        <Check className="h-5 w-5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mb-8 mt-12 flex justify-center">
            <Button
              size="xl"
              onClick={handleContinue}
              disabled={!selectedBudget || !selectedPriority}
              className="px-16"
            >
              متابعة
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </div>

        <style>{`
          @keyframes budget-glass-sheen {
            from { transform: translateX(-160%) skewX(-16deg); opacity: 0; }
            28% { opacity: 0.85; }
            to { transform: translateX(360%) skewX(-16deg); opacity: 0; }
          }

          @keyframes budget-check-pop {
            from { opacity: 0; transform: scale(0.68) translateY(4px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }

          .glass-budget-card {
            will-change: transform, box-shadow, background-color;
          }

          .glass-budget-card::after {
            content: '';
            position: absolute;
            inset: 1px;
            border-radius: 29px;
            pointer-events: none;
            background: linear-gradient(135deg, rgba(255,255,255,0.56), transparent 34%, rgba(255,255,255,0.22));
            opacity: 0.78;
          }

          .glass-sheen-active,
          .glass-budget-card:hover .glass-sheen {
            animation: budget-glass-sheen 1.15s ease-out both;
          }

          .budget-check-pop {
            animation: budget-check-pop 280ms ease-out both;
          }

          @media (prefers-reduced-motion: reduce) {
            .glass-sheen-active,
            .glass-budget-card:hover .glass-sheen,
            .budget-check-pop {
              animation: none !important;
            }
          }
        `}</style>
      </div>
    </KioskLayout>
  );
};

export default BudgetIntelligencePage;
