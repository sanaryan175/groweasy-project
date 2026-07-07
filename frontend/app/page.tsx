'use client';

import { useState, useCallback } from 'react';
import { UploadStep } from '@/components/steps/upload-step';
import { PreviewStep } from '@/components/steps/preview-step';
import { ProcessingStep } from '@/components/steps/processing-step';
import { ResultsStep } from '@/components/steps/results-step';
import { Stepper } from '@/components/stepper';
import { uploadCSV, processCSV, type ProcessResponse } from '@/lib/api';

type Step = 'upload' | 'preview' | 'processing' | 'results';

interface CSVData {
  file: File | null;
  rows: Array<Record<string, string>>;
  headers: string[];
}

export default function Page() {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [csvData, setCSVData] = useState<CSVData>({
    file: null,
    rows: [],
    headers: [],
  });
  const [results, setResults] = useState<ProcessResponse | null>(null);
  const [progress, setProgress] = useState({ imported: 0, total: 0, skipped: 0 });
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (file: File, rows: Array<Record<string, string>>, headers: string[]) => {
    setCSVData({ file, rows, headers });
    setError(null);
    setCurrentStep('preview');
  };

  const handleConfirmImport = useCallback(async () => {
    setCurrentStep('processing');
    setError(null);
    setProgress({ imported: 0, total: csvData.rows.length, skipped: 0 });

    try {
      const result = await processCSV(csvData.rows, (imported, skipped, total) => {
        setProgress({ imported, total, skipped });
      });
      setResults(result);
      setCurrentStep('results');
    } catch (err) {
      setError((err as Error).message);
      setCurrentStep('upload');
    }
  }, [csvData.rows]);

  const handleUploadDifferent = () => {
    setCurrentStep('upload');
    setCSVData({ file: null, rows: [], headers: [] });
    setError(null);
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setCSVData({ file: null, rows: [], headers: [] });
    setResults(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-balance text-4xl font-bold text-slate-900 sm:text-5xl">
            CSV Import
          </h1>
          <p className="mt-4 text-balance text-lg text-slate-600">
            Upload customer data and let AI extract CRM records.
          </p>
        </div>

        {/* Stepper */}
        <Stepper currentStep={currentStep} />

        {/* Content */}
        <div className="mt-12">
          {currentStep === 'upload' && (
            <UploadStep onFileUpload={handleFileUpload} />
          )}
          {currentStep === 'preview' && (
            <PreviewStep
              csvData={csvData}
              onConfirm={handleConfirmImport}
              onUploadDifferent={handleUploadDifferent}
            />
          )}
          {currentStep === 'processing' && (
            <ProcessingStep
              imported={progress.imported}
              total={progress.total}
              skipped={progress.skipped}
            />
          )}
          {currentStep === 'results' && results && (
            <ResultsStep
              results={results}
              onReset={handleReset}
            />
          )}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
