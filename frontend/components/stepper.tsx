import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: 'upload' | 'preview' | 'processing' | 'results';
}

const steps = [
  { id: 'upload', label: 'Upload CSV' },
  { id: 'preview', label: 'Preview' },
  { id: 'processing', label: 'Confirm Import' },
  { id: 'results', label: 'Results' },
];

export function Stepper({ currentStep }: StepperProps) {
  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-0 flex-wrap">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step Circle */}
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all flex-shrink-0 ${
              index <= stepIndex
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {index < stepIndex ? (
              <Check size={20} />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>

          {/* Step Label */}
          <div className="ml-3">
            <p
              className={`text-sm font-medium whitespace-nowrap ${
                index <= stepIndex
                  ? 'text-slate-900'
                  : 'text-slate-500'
              }`}
            >
              {step.label}
            </p>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`h-1 w-8 sm:w-12 ml-3 transition-all flex-shrink-0 ${
                index < stepIndex
                  ? 'bg-blue-600'
                  : 'bg-slate-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
