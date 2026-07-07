'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Download, Search, Filter } from 'lucide-react';
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

export function ResultsStep({
  results,
  onReset,
}: ResultsStepProps) {
  const [activeTab, setActiveTab] = useState<'parsed' | 'skipped'>('parsed');
  const [searchTerm, setSearchTerm] = useState('');

  const successRate = results.totalRows > 0
    ? Math.round((results.totalImported / results.totalRows) * 100)
    : 0;

  const filteredImported = results.imported.filter((row) =>
    searchTerm
      ? Object.values(row).some((v) =>
          v?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : true
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Imported Records',
            value: results.totalImported,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
          },
          {
            title: 'Skipped Records',
            value: results.totalSkipped,
            icon: AlertCircle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
          },
          {
            title: 'Success Rate',
            value: `${successRate}%`,
            icon: CheckCircle,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
          },
          {
            title: 'Total Rows',
            value: results.totalRows,
            icon: CheckCircle,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`rounded-lg ${card.bgColor} p-6 border border-slate-200`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
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
      <div className="border-b border-slate-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('parsed')}
            className={`pb-3 font-medium text-sm transition-colors ${
              activeTab === 'parsed'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parsed Records
          </button>
          <button
            onClick={() => setActiveTab('skipped')}
            className={`pb-3 font-medium text-sm transition-colors ${
              activeTab === 'skipped'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Skipped Records ({results.skipped.length})
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
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <Filter size={16} />
                Filter
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <Download size={16} />
                Export
              </button>
            </div>

            {/* Parsed Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                    <tr>
                      {CRM_FIELDS.map((field) => (
                        <th
                          key={field.key}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-900 whitespace-nowrap"
                        >
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredImported.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-slate-200 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        } hover:bg-blue-50`}
                      >
                        {CRM_FIELDS.map((field) => (
                          <td
                            key={field.key}
                            className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap max-w-[200px] truncate"
                            title={row[field.key] || ''}
                          >
                            {field.key === 'crm_status' ? (
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                row[field.key] === 'SALE_DONE'
                                  ? 'bg-green-50 text-green-700'
                                  : row[field.key] === 'BAD_LEAD'
                                  ? 'bg-red-50 text-red-700'
                                  : row[field.key] === 'DID_NOT_CONNECT'
                                  ? 'bg-orange-50 text-orange-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}>
                                {row[field.key] || '—'}
                              </span>
                            ) : (
                              row[field.key] || '—'
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {results.imported.length === 0 && (
                <div className="p-8 text-center text-slate-500">No imported records found.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'skipped' && (
          <div>
            {/* Skipped Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 w-24">Row #</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Raw Data</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 w-40">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.skipped.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-slate-200 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        } hover:bg-red-50`}
                      >
                        <td className="px-6 py-3 text-sm font-semibold text-slate-900">{row.rowNumber}</td>
                        <td className="px-6 py-3 text-sm text-slate-600 truncate max-w-[400px]" title={row.rawData}>{row.rawData}</td>
                        <td className="px-6 py-3 text-sm">
                          <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                            {row.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {results.skipped.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-500">No skipped records.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-6">
        <button
          onClick={onReset}
          className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Import Another File
        </button>
      </div>
    </div>
  );
}
