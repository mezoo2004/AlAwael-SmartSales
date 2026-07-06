import React from 'react';
import { Check } from 'lucide-react';

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
  steps,
  currentStep,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300 font-bold text-lg
                    ${isCompleted
                      ? 'bg-brand-orange text-white'
                      : isActive
                        ? 'bg-brand-orange-gradient text-white shadow-lg ring-4 ring-brand-orange/20'
                        : 'bg-brand-gray/20 text-brand-gray'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-sm font-medium text-center max-w-[100px]
                    transition-colors duration-300
                    ${isCompleted
                      ? 'text-brand-orange'
                      : isActive
                        ? 'text-brand-dark font-bold'
                        : 'text-brand-gray'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 rounded-full transition-all duration-500
                    ${index < currentStep
                      ? 'bg-brand-orange-gradient'
                      : 'bg-brand-gray/20'
                    }
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressStepper;
