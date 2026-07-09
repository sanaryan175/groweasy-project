'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { UploadStep } from '@/components/steps/upload-step';
import { PreviewStep } from '@/components/steps/preview-step';
import { MappingStep } from '@/components/steps/mapping-step';
import { ProcessingStep } from '@/components/steps/processing-step';
import { ResultsStep } from '@/components/steps/results-step';
import { Stepper } from '@/components/stepper';
import { processCSVStream, analyzeCSV, type ProcessResponse, type CSVAnalysis } from '@/lib/api';
import { saveState, loadState, clearState } from '@/lib/persistence';

type Step = 'upload' | 'preview' | 'mapping' | 'processing' | 'results';

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
  const [error, setError] = useState<string | null>(null);

  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingImported, setProcessingImported] = useState(0);
  const [processingSkipped, setProcessingSkipped] = useState(0);

  const [columnAnalysis, setColumnAnalysis] = useState<CSVAnalysis | null>(null);
  const [columnMappings, setColumnMappings] = useState<import('@/lib/api').ColumnMapping[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    const saved = loadState();
    if (!saved) return;

    setCurrentStep(saved.currentStep as Step);
    setCSVData({ file: null, rows: saved.csvData.rows, headers: saved.csvData.headers });
    setColumnMappings(saved.columnMappings);
    setColumnAnalysis(saved.columnAnalysis as CSVAnalysis | null);
    setAnalysisError(saved.analysisError);
    setError(saved.error);
    if (saved.results) setResults(saved.results as ProcessResponse);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      saveState({
        currentStep,
        csvData: { rows: csvData.rows, headers: csvData.headers },
        results,
        columnMappings,
        columnAnalysis,
        analysisError,
        error,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [currentStep, csvData.rows, csvData.headers, results, columnMappings, columnAnalysis, analysisError, error]);

  const handleFileUpload = async (file: File, rows: Array<Record<string, string>>, headers: string[]) => {
    setCSVData({ file, rows, headers });
    setError(null);
    setColumnAnalysis(null);
    setColumnMappings([]);
    setAnalysisError(null);
    setCurrentStep('preview');
    setIsAnalyzing(true);

    try {
      const analysis = await analyzeCSV(headers, rows.slice(0, 20));
      setColumnAnalysis(analysis);
      setColumnMappings(analysis.mappings);
    } catch (err) {
      setAnalysisError('AI auto-detection unavailable — map columns manually below.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmImport = useCallback(async (mappings?: import('@/lib/api').ColumnMapping[]) => {
    setCurrentStep('processing');
    setError(null);
    setProcessingProgress(0);
    setProcessingImported(0);
    setProcessingSkipped(0);

    try {
      const result = await processCSVStream(
        csvData.rows,
        (imported, skipped, total) => {
          setProcessingImported(imported);
          setProcessingSkipped(skipped);
          setProcessingProgress(Math.round(((imported + skipped) / total) * 100));
        },
        mappings,
        undefined,
        undefined
      );
      setProcessingProgress(100);
      setResults(result);
      setCurrentStep('results');
    } catch (err) {
      setError((err as Error).message);
      setCurrentStep('preview');
    }
  }, [csvData.rows]);

  const handleContinueToMapping = () => {
    setCurrentStep('mapping');
  };

  const handleMappingBack = () => {
    setCurrentStep('preview');
  };

  const handleConfirmMapping = (mappings: import('@/lib/api').ColumnMapping[]) => {
    setColumnMappings(mappings);
    handleConfirmImport(mappings);
  };

  const resetAll = () => {
    setCurrentStep('upload');
    setCSVData({ file: null, rows: [], headers: [] });
    setResults(null);
    setError(null);
    setColumnAnalysis(null);
    setColumnMappings([]);
    setAnalysisError(null);
    clearState();
  };

  const handleUploadDifferent = resetAll;
  const handleReset = resetAll;

  const steps: Step[] = ['upload', 'preview', 'mapping', 'processing', 'results'];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-balance text-4xl font-bold text-slate-900 sm:text-5xl dark:text-slate-100">
            AI CSV Importer
          </h1>
          <p className="mt-4 text-balance text-lg text-slate-600 dark:text-slate-400">
            Upload any CSV format — AI automatically detects and extracts CRM records.
          </p>
        </div>

        <Stepper currentStep={currentStep} steps={steps} />

        <div className="mt-12">
          {currentStep === 'upload' && (
            <UploadStep onFileUpload={handleFileUpload} />
          )}
          {currentStep === 'preview' && (
            <PreviewStep
              csvData={csvData}
              onContinue={handleContinueToMapping}
              onUploadDifferent={handleUploadDifferent}
            />
          )}
          {currentStep === 'mapping' && (
            <MappingStep
              headers={csvData.headers}
              autoMappings={columnMappings}
              analysisError={analysisError}
              isAnalyzing={isAnalyzing}
              onConfirm={handleConfirmMapping}
              onBack={handleMappingBack}
            />
          )}
          {currentStep === 'processing' && (
            <ProcessingStep
              progress={processingProgress}
              imported={processingImported}
              skipped={processingSkipped}
              total={csvData.rows.length}
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
