'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PreviewStepProps {
  csvData: {
    file: File | null;
    rows: Array<Record<string, string>>;
    headers: string[];
  };
  onConfirm: () => void;
  onUploadDifferent: () => void;
}

export function PreviewStep({
  csvData,
  onConfirm,
  onUploadDifferent,
}: PreviewStepProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (csvData.rows.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-400">No CSV data available. Please upload a file.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(csvData.rows.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const displayedRows = csvData.rows.slice(startIdx, endIdx);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header with Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">CSV Preview</h2>
        <div className="flex gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 dark:bg-slate-800">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Rows:</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {csvData.rows.length.toLocaleString()}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1 dark:bg-slate-800">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Columns:</span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {csvData.headers.length}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 dark:bg-slate-800 dark:border-slate-700">
              <tr>
                {csvData.headers.map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-sm font-semibold text-slate-900 whitespace-nowrap dark:text-slate-100"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((row, rowIdx) => (
                <tr
                  key={startIdx + rowIdx}
                  className={`border-b border-slate-200 transition-colors ${
                    rowIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'
                  } hover:bg-blue-50 dark:hover:bg-blue-950`}
                >
                  {csvData.headers.map((header) => (
                    <td
                      key={`${startIdx + rowIdx}-${header}`}
                      className="px-6 py-3 text-sm text-slate-600 whitespace-nowrap dark:text-slate-300"
                    >
                      {row[header] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Showing {startIdx + 1} to {Math.min(endIdx, csvData.rows.length)} of{' '}
          <span className="font-semibold dark:text-slate-100">{csvData.rows.length.toLocaleString()}</span> rows
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
        <button
          onClick={onUploadDifferent}
          className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 transition-colors text-center dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Upload Different File
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors text-center"
        >
          Confirm Import
        </button>
      </div>
    </div>
  );
}
