import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: string;
  steps: string[];
}

const stepLabels: Record<string, string> = {
  upload: 'Upload CSV',
  preview: 'Preview',
  processing: 'Importing',
  results: 'Results',
};

export function Stepper({ currentStep, steps }: StepperProps) {
  const stepIndex = steps.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-0 flex-wrap">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all flex-shrink-0 ${
              index <= stepIndex
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
            }`}
          >
            {index < stepIndex ? (
              <Check size={20} />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
          <div className="ml-3">
            <p
              className={`text-sm font-medium whitespace-nowrap ${
                index <= stepIndex
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {stepLabels[step] || step}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-1 w-8 sm:w-12 ml-3 transition-all flex-shrink-0 ${
                index < stepIndex
                  ? 'bg-blue-600'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
