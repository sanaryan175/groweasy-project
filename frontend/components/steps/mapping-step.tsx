'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { CRM_FIELDS, CRM_FIELD_NAMES, DO_NOT_IMPORT } from '@/lib/crm-fields';

interface ColumnMapping {
  csvColumn: string;
  crmField: string;
  confidence: number;
}

interface MappingStepProps {
  headers: string[];
  autoMappings: ColumnMapping[];
  analysisError?: string | null;
  onConfirm: (mappings: ColumnMapping[]) => void;
  onBack: () => void;
}

function normalizeConfidence(c: number): number {
  return c > 1 ? c / 100 : c;
}

function getConfidenceLabel(confidence: number): string {
  const c = normalizeConfidence(confidence);
  if (c >= 0.8) return 'High';
  if (c >= 0.5) return 'Medium';
  return 'Low';
}

function getConfidenceColor(confidence: number): string {
  const c = normalizeConfidence(confidence);
  if (c >= 0.8) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
  if (c >= 0.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
}

function displayConfidence(confidence: number): string {
  const c = normalizeConfidence(confidence);
  return `${Math.round(c * 100)}%`;
}

export function MappingStep({ headers, autoMappings, analysisError, onConfirm, onBack }: MappingStepProps) {
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const autoMap = new Map(autoMappings.map(m => [m.csvColumn, m.crmField]));
    for (const h of headers) {
      initial[h] = autoMap.get(h) || DO_NOT_IMPORT;
    }
    return initial;
  });

  const requiredFields = CRM_FIELDS.filter(f => f.required).map(f => f.field);

  const missingRequired = requiredFields.filter(
    (rf) => !Object.values(mappings).includes(rf)
  );

  const handleChange = (header: string, value: string) => {
    setMappings(prev => ({ ...prev, [header]: value }));
  };

  const handleConfirm = () => {
    const result: ColumnMapping[] = headers
      .filter(h => mappings[h] !== DO_NOT_IMPORT)
      .map(h => ({
        csvColumn: h,
        crmField: mappings[h],
        confidence: autoMappings.find(m => m.csvColumn === h)?.confidence ?? 0,
      }));
    onConfirm(result);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Column Mapping</h2>
        <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 dark:bg-slate-800">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Columns:</span>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{headers.length}</span>
        </div>
      </div>

      {analysisError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{analysisError} You can still map columns manually.</span>
        </div>
      )}

      {missingRequired.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <span className="font-semibold">Required fields not mapped:</span>{' '}
          {missingRequired.map(f => CRM_FIELDS.find(cf => cf.field === f)?.description || f).join(', ')}.
          Map at least one column to each required field.
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 w-[30%]">CSV Column</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">CRM Field</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 w-[20%]">AI Confidence</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((header) => {
              const auto = autoMappings.find(m => m.csvColumn === header);
              return (
                <tr
                  key={header}
                  className="border-b border-slate-200 transition-colors hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-blue-950"
                >
                  <td className="px-6 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {header}
                  </td>
                  <td className="px-6 py-3">
                    <select
                      value={mappings[header]}
                      onChange={(e) => handleChange(header, e.target.value)}
                      className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:focus:border-blue-400 dark:focus:ring-blue-800"
                    >
                      <option value={DO_NOT_IMPORT}>— Do not import —</option>
                      {CRM_FIELDS.map((cf) => (
                        <option key={cf.field} value={cf.field}>
                          {cf.field} {cf.required ? '(required)' : ''} — {cf.description}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    {auto ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getConfidenceColor(auto.confidence)}`}
                      >
                        {getConfidenceLabel(auto.confidence)} ({displayConfidence(auto.confidence)})
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={16} />
          Back to Preview
        </button>
        <button
          onClick={handleConfirm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Start Import
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
