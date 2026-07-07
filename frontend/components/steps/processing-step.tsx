'use client';

import { Check } from 'lucide-react';

interface ProcessingStepProps {
  imported?: number;
  total?: number;
  skipped?: number;
}

export function ProcessingStep({ imported = 0, total = 0, skipped = 0 }: ProcessingStepProps) {
  const processed = imported + skipped;
  const progress = total > 0 ? Math.min(Math.round((processed / total) * 100), 100) : 0;
  const isDone = progress >= 100;

  const checklist = [
    { id: '1', label: 'Reading CSV', status: 'completed' as const },
    { id: '2', label: 'Understanding columns', status: 'completed' as const },
    { id: '3', label: 'Extracting CRM records', status: isDone ? 'completed' as const : 'current' as const },
    { id: '4', label: 'Validating data', status: isDone ? 'completed' as const : 'pending' as const },
    { id: '5', label: 'Preparing import', status: isDone ? 'completed' as const : 'pending' as const },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Loading Message */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"
              style={{ animationDuration: '1s' }}
            />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-slate-900">AI is analyzing your CSV...</h3>
      </div>

      {/* Progress Bar */}
      <div className="mx-auto max-w-md">
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-center text-sm text-slate-600">
          {Math.round(Math.min(progress, 100))}% complete
        </p>
      </div>

      {/* Checklist */}
      <div className="mx-auto max-w-md space-y-3">
        {checklist.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 transition-all ${
                item.status === 'completed'
                  ? 'bg-green-500 text-white'
                  : item.status === 'current'
                  ? 'bg-blue-500 text-white animate-pulse'
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              {item.status === 'completed' && <Check size={16} />}
              {item.status === 'current' && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
            </div>
            <span
              className={`text-sm font-medium ${
                item.status === 'completed'
                  ? 'text-slate-900'
                  : item.status === 'current'
                  ? 'text-blue-600'
                  : 'text-slate-500'
              }`}
            >
              {item.status === 'completed' && '✔ '}
              {item.status === 'current' && '⏳ '}
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
