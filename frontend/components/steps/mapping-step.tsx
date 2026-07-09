'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const CRM_FIELD_OPTIONS = [
  { value: '', label: '— Do not map —' },
  { value: 'name', label: 'Full Name' },
  { value: 'email', label: 'Email' },
  { value: 'mobile_without_country_code', label: 'Mobile Number' },
  { value: 'country_code', label: 'Country Code' },
  { value: 'company', label: 'Company' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'country', label: 'Country' },
  { value: 'lead_owner', label: 'Lead Owner' },
  { value: 'crm_status', label: 'CRM Status' },
  { value: 'crm_note', label: 'CRM Note' },
  { value: 'data_source', label: 'Data Source' },
  { value: 'possession_time', label: 'Possession Time' },
  { value: 'description', label: 'Description' },
  { value: 'created_at', label: 'Created At' },
];

interface ColumnMapping {
  csvColumn: string;
  crmField: string;
  confidence: number;
}

interface CSVAnalysis {
  csvType: string;
  csvTypeDescription: string;
  mappings: ColumnMapping[];
  unmappedColumns: string[];
  missingRequiredFields: string[];
}

interface MappingStepProps {
  headers: string[];
  analysis: CSVAnalysis | null;
  analyzing: boolean;
  onMappingChange: (mappings: ColumnMapping[]) => void;
  onConfirm: () => void;
  onBack: () => void;
  error?: string | null;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-100 text-green-700 border-green-200';
  if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.5) return 'Medium';
  return 'Low';
}

export function MappingStep({
  headers,
  analysis,
  analyzing,
  onMappingChange,
  onConfirm,
  onBack,
  error,
}: MappingStepProps) {
  const localMappings = analysis?.mappings ?? headers.map(h => ({
    csvColumn: h,
    crmField: '',
    confidence: 0,
  }));

  const [mappings, setMappings] = useState<ColumnMapping[]>(localMappings);

  useEffect(() => {
    if (analysis) {
      const merged = analysis.mappings.length > 0
        ? analysis.mappings
        : headers.map(h => ({ csvColumn: h, crmField: '', confidence: 0 }));
      setMappings(merged);
    }
  }, [analysis, headers]);

  const usedFields = mappings.filter(m => m.crmField).map(m => m.crmField);

  const handleFieldChange = (csvColumn: string, crmField: string) => {
    const updated = mappings.map(m =>
      m.csvColumn === csvColumn ? { ...m, crmField, confidence: crmField ? 1 : 0 } : m
    );
    setMappings(updated);
    onMappingChange(updated);
  };

  if (analyzing) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
              <div
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"
                style={{ animationDuration: '1s' }}
              />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">AI is analyzing your CSV structure...</h3>
          <p className="mt-3 text-slate-600 max-w-md mx-auto">
            Detecting column types, suggesting field mappings, and identifying the CSV source format.
          </p>
          <div className="mt-8 mx-auto max-w-md">
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-800">Analysis Failed</h3>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* CSV Type Detection */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-blue-50 p-3">
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">CSV Source Detected</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                {analysis.csvType}
              </span>
              {analysis.missingRequiredFields.length > 0 && (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  Missing {analysis.missingRequiredFields.length} field{analysis.missingRequiredFields.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {analysis.csvTypeDescription && (
              <p className="mt-1 text-sm text-slate-500">{analysis.csvTypeDescription}</p>
            )}
          </div>
        </div>
      </div>

      {/* Missing Required Fields Warning */}
      {analysis.missingRequiredFields.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 text-sm">Missing Recommended Fields</p>
              <p className="mt-1 text-sm text-yellow-700">
                These fields were not found in your CSV: {analysis.missingRequiredFields.join(', ')}.
                The AI will try to infer them from available data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Column Mapping Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Column Mapping</h3>
          <p className="text-sm text-slate-500 mt-1">
            Review how AI mapped your CSV columns to CRM fields. Adjust any incorrect mappings below.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">CSV Column</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">Maps To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping, idx) => {
                const mappingFromAnalysis = analysis.mappings.find(m => m.csvColumn === mapping.csvColumn);
                const confidence = mappingFromAnalysis?.confidence ?? 0;
                const isAutoMapped = mappingFromAnalysis && mappingFromAnalysis.crmField;

                return (
                  <tr
                    key={mapping.csvColumn}
                    className={`border-b border-slate-200 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } hover:bg-blue-50`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-slate-900">{mapping.csvColumn}</span>
                      {!isAutoMapped && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                          Unmapped
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <select
                          value={mapping.crmField}
                          onChange={(e) => handleFieldChange(mapping.csvColumn, e.target.value)}
                          className="w-full min-w-[200px] appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-slate-400"
                        >
                          {CRM_FIELD_OPTIONS.map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              disabled={opt.value !== '' && usedFields.includes(opt.value) && opt.value !== mapping.crmField}
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {mapping.crmField ? (
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getConfidenceColor(confidence)}`}>
                          {getConfidenceLabel(confidence)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Unmapped Columns */}
        {analysis.unmappedColumns.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Note:</span> {analysis.unmappedColumns.length} column{analysis.unmappedColumns.length > 1 ? 's were' : ' was'} not automatically mapped and may require manual assignment above.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
        <button
          onClick={onBack}
          className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 transition-colors text-center"
        >
          Back to Preview
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors text-center"
        >
          Confirm Mapping & Start Import
        </button>
      </div>
    </div>
  );
}
