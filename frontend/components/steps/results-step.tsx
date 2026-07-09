'use client';

import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckCircle, AlertCircle, Download, Search, Filter, X } from 'lucide-react';
import { AnimatedCounter } from '@/components/animated-counter';

const CRM_FIELDS = [
  { key: 'created_at', label: 'Created At' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'country_code', label: 'Country Code' },
  { key: 'mobile_without_country_code', label: 'Mobile' },
  { key: 'company', label: 'Company' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'lead_owner', label: 'Lead Owner' },
  { key: 'crm_status', label: 'CRM Status' },
  { key: 'crm_note', label: 'CRM Note' },
  { key: 'data_source', label: 'Data Source' },
  { key: 'possession_time', label: 'Possession Time' },
  { key: 'description', label: 'Description' },
];

const STATUSES = ['', 'GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'] as const;

const COLUMN_WIDTHS: Record<string, string> = {
  created_at: '160px',
  name: '150px',
  email: '200px',
  country_code: '90px',
  mobile_without_country_code: '140px',
  company: '160px',
  city: '120px',
  state: '120px',
  country: '120px',
  lead_owner: '140px',
  crm_status: '170px',
  crm_note: '200px',
  data_source: '150px',
  possession_time: '150px',
  description: '200px',
};

interface ProcessResult {
  imported: Record<string, string>[];
  skipped: { rowNumber: number; rawData: string; reason: string }[];
  totalImported: number;
  totalSkipped: number;
  totalRows: number;
}

interface ResultsStepProps {
  results: ProcessResult;
  onReset: () => void;
}

function csvEscape(val: string): string {
  const str = val ?? '';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCSV(filename: string, headers: string[], rows: Record<string, string>[]) {
  const csv = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h] || '')).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultsStep({
  results,
  onReset,
}: ResultsStepProps) {
  const [activeTab, setActiveTab] = useState<'parsed' | 'skipped'>('parsed');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);

  const successRate = results.totalRows > 0
    ? Math.round((results.totalImported / results.totalRows) * 100)
    : 0;

  const filteredImported = useMemo(() => {
    let data = results.imported;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter((row) =>
        Object.values(row).some((v) => v?.toLowerCase().includes(term))
      );
    }
    if (statusFilter) {
      data = data.filter((row) => row.crm_status === statusFilter);
    }
    return data;
  }, [results.imported, searchTerm, statusFilter]);

  const filteredSkipped = useMemo(() => {
    if (!searchTerm) return results.skipped;
    const term = searchTerm.toLowerCase();
    return results.skipped.filter(
      (row) =>
        String(row.rowNumber).includes(term) ||
        row.rawData?.toLowerCase().includes(term) ||
        row.reason?.toLowerCase().includes(term)
    );
  }, [results.skipped, searchTerm]);

  const exportHeaders = CRM_FIELDS.map((f) => f.key);

  const tableRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredImported.length,
    getScrollElement: () => tableRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of results.imported) {
      const s = row.crm_status || '(blank)';
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [results.imported]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Imported Records',
            value: results.totalImported,
            icon: CheckCircle,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-950',
          },
          {
            title: 'Skipped Records',
            value: results.totalSkipped,
            icon: AlertCircle,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-50 dark:bg-orange-950',
          },
          {
            title: 'Success Rate',
            value: `${successRate}%`,
            icon: CheckCircle,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-950',
          },
          {
            title: 'Total Rows',
            value: results.totalRows,
            icon: CheckCircle,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-950',
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`rounded-lg ${card.bgColor} p-6 border border-slate-200 dark:border-slate-700`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {typeof card.value === 'number' ? (
                      <AnimatedCounter value={card.value} />
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
                <Icon className={`${card.color} h-6 w-6 flex-shrink-0`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-8">
          <button
            onClick={() => { setActiveTab('parsed'); setSearchTerm(''); setStatusFilter(''); }}
            className={`pb-3 font-medium text-sm transition-colors ${
              activeTab === 'parsed'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Parsed Records ({results.totalImported})
          </button>
          <button
            onClick={() => { setActiveTab('skipped'); setSearchTerm(''); setStatusFilter(''); }}
            className={`pb-3 font-medium text-sm transition-colors ${
              activeTab === 'skipped'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            Skipped Records ({results.totalSkipped})
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="space-y-4">
        {activeTab === 'parsed' && (
          <div>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search across all fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filter Button + Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    statusFilter
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950 dark:text-blue-300'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Filter size={16} />
                  Filter
                  {statusFilter && <span className="ml-1 rounded-full bg-blue-200 px-1.5 py-0.5 text-xs dark:bg-blue-800 dark:text-blue-200">1</span>}
                </button>
                {showFilter && (
                  <>
                    <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-200 bg-white shadow-lg z-20 p-3 dark:border-slate-700 dark:bg-slate-800">
                      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide dark:text-slate-400">CRM Status</p>
                      <div className="space-y-1">
                        <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-sm dark:hover:bg-slate-700">
                          <input
                            type="radio"
                            name="statusFilter"
                            checked={statusFilter === ''}
                            onChange={() => { setStatusFilter(''); setShowFilter(false); }}
                            className="accent-blue-600"
                          />
                          All ({results.totalImported})
                        </label>
                        {STATUSES.filter(Boolean).map((s) => (
                          <label key={s} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-sm dark:hover:bg-slate-700">
                            <input
                              type="radio"
                              name="statusFilter"
                              checked={statusFilter === s}
                              onChange={() => { setStatusFilter(s); setShowFilter(false); }}
                              className="accent-blue-600"
                            />
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              s === 'SALE_DONE' ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                                : s === 'BAD_LEAD' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                : s === 'DID_NOT_CONNECT' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            }`}>{s}</span>
                            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{statusCounts[s] || 0}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                  </>
                )}
              </div>

              {/* Export Button */}
                <button
                  onClick={() => downloadCSV('imported-records.csv', exportHeaders, filteredImported)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                <Download size={16} />
                Export
              </button>
            </div>

            {/* Parsed Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <div ref={tableRef} className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '600px' }}>
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 flex border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  {CRM_FIELDS.map((field) => (
                    <div
                      key={field.key}
                      className="flex-shrink-0 px-4 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-100"
                      style={{ width: COLUMN_WIDTHS[field.key], minWidth: COLUMN_WIDTHS[field.key] }}
                    >
                      {field.label}
                    </div>
                  ))}
                </div>
                {/* Virtualized Body */}
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = filteredImported[virtualRow.index];
                    return (
                      <div
                        key={virtualRow.key}
                        className={`flex border-b border-slate-200 transition-colors ${
                          virtualRow.index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'
                        } hover:bg-blue-50 dark:hover:bg-blue-950`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {CRM_FIELDS.map((field) => (
                          <div
                            key={field.key}
                            className="flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300"
                            style={{ width: COLUMN_WIDTHS[field.key], minWidth: COLUMN_WIDTHS[field.key] }}
                            title={row[field.key] || ''}
                          >
                            {field.key === 'crm_status' ? (
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                row[field.key] === 'SALE_DONE'
                                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                                  : row[field.key] === 'BAD_LEAD'
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  : row[field.key] === 'DID_NOT_CONNECT'
                                  ? 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                {row[field.key] || '—'}
                              </span>
                            ) : (
                              row[field.key] || '—'
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              {filteredImported.length === 0 && (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  {results.imported.length === 0
                    ? 'No imported records found.'
                    : 'No records match your search or filter.'}
                </div>
              )}
              {filteredImported.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                  Showing {filteredImported.length} of {results.imported.length} records
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'skipped' && (
          <div>
            {/* Search for Skipped */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search skipped records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-blue-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => downloadCSV('skipped-records.csv', ['Row Number', 'Raw Data', 'Reason'], filteredSkipped.map((r) => ({ 'Row Number': String(r.rowNumber), 'Raw Data': r.rawData, 'Reason': r.reason })))}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Download size={16} />
                Export
              </button>
            </div>

            {/* Skipped Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 dark:bg-slate-800 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 w-24 dark:text-slate-100">Row #</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">Raw Data</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 w-40 dark:text-slate-100">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSkipped.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-slate-200 transition-colors ${
                          idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'
                        } hover:bg-red-50 dark:hover:bg-red-950`}
                      >
                        <td className="px-6 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{row.rowNumber}</td>
                        <td className="px-6 py-3 text-sm text-slate-600 truncate max-w-[400px] dark:text-slate-300" title={row.rawData}>{row.rawData}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                            {row.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredSkipped.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-500 dark:text-slate-400">
                          {results.skipped.length === 0
                            ? 'No skipped records.'
                            : 'No records match your search.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {filteredSkipped.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                  Showing {filteredSkipped.length} of {results.skipped.length} records
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={onReset}
          className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Import Another File
        </button>
      </div>
    </div>
  );
}
