'use client';

import { useState } from 'react';
import { UploadStep } from '@/components/steps/upload-step';
import { PreviewStep } from '@/components/steps/preview-step';
import { ProcessingStep } from '@/components/steps/processing-step';
import { ResultsStep } from '@/components/steps/results-step';
import { Stepper } from '@/components/stepper';

type Step = 'upload' | 'preview' | 'mapping' | 'processing' | 'results';

interface CSVData {
  file: File | null;
  rows: Array<Record<string, string>>;
  headers: string[];
}

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState<Step>('results');

  const demoCSVData: CSVData = {
    file: new File(['csv data'], 'customers.csv', { type: 'text/csv' }),
    headers: ['Name', 'Email', 'Company', 'Phone', 'Job Title', 'Industry'],
    rows: [
      { Name: 'John Smith', Email: 'john.smith@example.com', Company: 'Acme Corp', Phone: '555-0101', 'Job Title': 'CEO', Industry: 'Technology' },
      { Name: 'Sarah Johnson', Email: 'sarah.j@example.com', Company: 'TechStart Inc', Phone: '555-0102', 'Job Title': 'VP Sales', Industry: 'Software' },
      { Name: 'Michael Chen', Email: 'm.chen@example.com', Company: 'Global Services', Phone: '555-0103', 'Job Title': 'Manager', Industry: 'Consulting' },
      { Name: 'Emily Davis', Email: 'emily.davis@example.com', Company: 'Innovation Labs', Phone: '555-0104', 'Job Title': 'Lead Engineer', Industry: 'R&D' },
      { Name: 'David Wilson', Email: 'd.wilson@example.com', Company: 'Future Systems', Phone: '555-0105', 'Job Title': 'Director', Industry: 'Cloud Services' },
      { Name: 'Jessica Brown', Email: 'j.brown@example.com', Company: 'Data Insights', Phone: '555-0106', 'Job Title': 'Analyst', Industry: 'Analytics' },
      { Name: 'Robert Garcia', Email: 'r.garcia@example.com', Company: 'Smart Solutions', Phone: '555-0107', 'Job Title': 'CTO', Industry: 'Technology' },
      { Name: 'Amanda Martinez', Email: 'a.martinez@example.com', Company: 'Enterprise Plus', Phone: '555-0108', 'Job Title': 'Product Manager', Industry: 'SaaS' },
      { Name: 'Christopher Lee', Email: 'c.lee@example.com', Company: 'Digital Ventures', Phone: '555-0109', 'Job Title': 'Founder', Industry: 'Startup' },
      { Name: 'Michelle Thomas', Email: 'm.thomas@example.com', Company: 'Corporate Tech', Phone: '555-0110', 'Job Title': 'CFO', Industry: 'Finance' },
      { Name: 'Daniel White', Email: 'd.white@example.com', Company: 'Innovation Pro', Phone: '555-0111', 'Job Title': 'Engineer', Industry: 'Tech' },
      { Name: 'Lisa Anderson', Email: 'l.anderson@example.com', Company: 'Global Inc', Phone: '555-0112', 'Job Title': 'Manager', Industry: 'Services' },
    ],
  };

  const demoResults = {
    imported: Array.from({ length: 10 }, (_, i) => ({
      created_at: '2026-05-13 14:20:48',
      name: ['John Doe', 'Sarah Johnson', 'Rajesh Patel'][i % 3],
      email: `user${i + 1}@example.com`,
      country_code: '+91',
      mobile_without_country_code: `9876543${String(i).padStart(4, '0')}`,
      company: 'Acme Corp',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      lead_owner: 'test@gmail.com',
      crm_status: ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'SALE_DONE'][i % 3],
      crm_note: '',
      data_source: 'leads_on_demand',
      possession_time: '',
      description: '',
    })),
    skipped: [
      { rowNumber: 5, rawData: ',,invalid,555-0100', reason: 'Missing email and mobile' },
      { rowNumber: 12, rawData: 'Bob,,Acme,', reason: 'Missing email and mobile' },
    ],
    totalImported: 1240,
    totalSkipped: 13,
    totalRows: 1253,
  };

  const handleFileUpload = () => setCurrentStep('preview');
  const handleConfirmImport = () => setCurrentStep('mapping');
  const handleUploadDifferent = () => setCurrentStep('upload');
  const handleReset = () => setCurrentStep('upload');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-balance text-4xl font-bold text-slate-900 sm:text-5xl">
            CSV Import Demo
          </h1>
          <p className="mt-4 text-balance text-lg text-slate-600">
            Showing the {currentStep === 'results' ? 'Results' : currentStep === 'processing' ? 'Processing' : currentStep === 'preview' ? 'Preview' : 'Upload'} step
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {(['upload', 'preview', 'mapping', 'processing', 'results'] as Step[]).map((step) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentStep === step
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <Stepper currentStep={currentStep} steps={['upload', 'preview', 'mapping', 'processing', 'results']} />

        <div className="mt-12">
          {currentStep === 'upload' && (
            <UploadStep onFileUpload={(file, rows, headers) => {
              setCurrentStep('preview');
            }} />
          )}
          {currentStep === 'preview' && (
            <PreviewStep
              csvData={demoCSVData}
              onConfirm={() => setCurrentStep('mapping')}
              onUploadDifferent={() => setCurrentStep('upload')}
            />
          )}
          {currentStep === 'mapping' && (
            <div className="text-center py-16 text-slate-500">
              (Mapping step preview - not interactive in demo mode)
            </div>
          )}
          {currentStep === 'processing' && <ProcessingStep progress={0} />}
          {currentStep === 'results' && (
            <ResultsStep
              results={demoResults}
              onReset={() => setCurrentStep('upload')}
            />
          )}
        </div>
      </div>
    </main>
  );
}
