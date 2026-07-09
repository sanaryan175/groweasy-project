'use client';

import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

interface ProcessingStepProps {
  progress: number;
  imported?: number;
  skipped?: number;
  total?: number;
}

const checklist = [
  { id: '1', label: 'Reading CSV' },
  { id: '2', label: 'Understanding columns' },
  { id: '3', label: 'Extracting CRM records' },
  { id: '4', label: 'Validating data' },
  { id: '5', label: 'Preparing import' },
];

function useSmoothProgress(target: number): number {
  const displayedRef = useRef(0);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (target >= 100) {
      displayedRef.current = 100;
      setDisplayed(100);
      return;
    }

    let rafId: number;
    const animate = () => {
      const diff = target - displayedRef.current;
      if (Math.abs(diff) < 0.3) {
        displayedRef.current = target;
        setDisplayed(target);
        return;
      }
      const step = Math.max(0.3, Math.abs(diff) * 0.06);
      displayedRef.current += diff > 0 ? step : -step;
      setDisplayed(Math.min(displayedRef.current, 95));
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target]);

  return displayed;
}

export function ProcessingStep({ progress, imported = 0, skipped = 0, total = 0 }: ProcessingStepProps) {
  const smoothProgress = useSmoothProgress(progress);
  const effectiveProgress = total === 0 ? smoothProgress : Math.min(smoothProgress, 95);

  const currentIdx = Math.min(
    Math.floor((effectiveProgress / 100) * checklist.length),
    checklist.length - 1
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700" />
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"
              style={{ animationDuration: '1s' }}
            />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {progress >= 100 ? 'Complete!' : total > 0 ? `Processing ${total} rows...` : 'Connecting to AI...'}
        </h3>
        {progress >= 100 && (
          <p className="mt-1 text-sm text-green-600 dark:text-green-400 font-medium">
            All done — loading results...
          </p>
        )}
      </div>

      <div className="mx-auto max-w-md">
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden dark:bg-slate-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(effectiveProgress, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          {Math.round(Math.min(effectiveProgress, 100))}% complete
        </p>
        {total > 0 && (
          <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-500">
            {imported} imported, {skipped} skipped of {total} rows
          </p>
        )}
      </div>

      <div className="mx-auto max-w-md space-y-3">
        {checklist.map((item, idx) => {
          const status = idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : 'pending';
          return (
            <div key={item.id} className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 transition-all ${
                  status === 'completed'
                    ? 'bg-green-500 text-white'
                    : status === 'current'
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                }`}
              >
                {status === 'completed' && <Check size={16} />}
                {status === 'current' && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
              </div>
              <span
                className={`text-sm font-medium ${
                  status === 'completed'
                    ? 'text-slate-900 dark:text-slate-100'
                    : status === 'current'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {status === 'completed' && '✔ '}
                {status === 'current' && '⏳ '}
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
