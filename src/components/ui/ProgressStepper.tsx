import React from 'react';
import { Check } from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { DepartmentId } from '../../types';

interface Step {
  id: string;
  label: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  currentStep,
  className = '',
}) => {
  const { session } = useSession();
  const categoryLabelMap: Record<DepartmentId, string> = {
    washbasins: 'Wash Basins',
    'wpc-doors': 'Doors',
    marble: 'Marble',
    aluminum: 'Aluminum',
    glass: 'Glass',
  };
  const categoryLabel = session?.departmentId
    ? categoryLabelMap[session.departmentId]
    : 'Product';
  const smartSteps = [
    { id: 'customer', label: 'Customer Information' },
    { id: 'category', label: 'Category Selection' },
    { id: 'configuring', label: `Configuring ${categoryLabel}` },
    { id: 'dimensions', label: 'Dimensions' },
    { id: 'review', label: 'Review' },
    { id: 'ai', label: 'AI Design Generation' },
  ];
  const boundedStep = Math.max(0, Math.min(smartSteps.length - 1, currentStep));
  const progressPercent = ((boundedStep + 1) / smartSteps.length) * 100;

  return (
    <div className={`w-full ${className}`}>
      <div className="rounded-[24px] border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_18px_50px_rgba(41,45,50,0.08)] px-4 py-4 md:px-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm md:text-base font-bold text-brand-dark">
            Step {boundedStep + 1} of {smartSteps.length}
          </p>
          <p className="text-xs md:text-sm font-medium text-brand-gray">
            {smartSteps[boundedStep].label}
          </p>
        </div>

        <div className="flex items-start justify-between gap-2">
          {smartSteps.map((step, index) => {
            const isCompleted = index < boundedStep;
            const isActive = index === boundedStep;

            return (
              <React.Fragment key={step.id}>
                <div className="flex min-w-0 flex-1 flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center
                      transition-all duration-500 font-bold text-base
                      ${isCompleted
                        ? 'bg-white text-brand-orange border-2 border-brand-orange shadow-[0_8px_24px_rgba(255,90,0,0.16)]'
                        : isActive
                          ? 'bg-brand-orange text-white shadow-[0_0_28px_rgba(255,90,0,0.34)] ring-4 ring-brand-orange/15 scale-105'
                          : 'bg-brand-light text-brand-gray border-2 border-brand-gray/20'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" strokeWidth={3} />
                    ) : isActive ? (
                      <span className="block h-3 w-3 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.85)]" />
                    ) : (
                      <span className="block h-3 w-3 rounded-full border-2 border-brand-gray/50" />
                    )}
                  </div>
                  <span
                    className={`
                      mt-2 text-[11px] md:text-xs font-bold text-center leading-snug max-w-[112px]
                      transition-colors duration-300
                      ${isCompleted || isActive ? 'text-brand-dark' : 'text-brand-gray'}
                    `}
                  >
                    {step.label}
                  </span>
                </div>

                {index < smartSteps.length - 1 && (
                  <div
                    className={`
                      mt-5 h-0.5 flex-[0.6] rounded-full transition-all duration-500
                      ${index < boundedStep ? 'bg-brand-orange' : 'bg-brand-gray/20'}
                    `}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="mt-5 h-2.5 bg-brand-light rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-brand-orange rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressStepper;
