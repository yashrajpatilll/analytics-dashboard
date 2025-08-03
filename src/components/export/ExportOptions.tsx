'use client';

import React from 'react';
import { ExportOptions as ExportOptionsType } from '@/types/analytics';

interface ExportOptionsProps {
  options: ExportOptionsType;
  onChange: (options: ExportOptionsType) => void;
  userRole: 'Admin' | 'Analyst' | 'Viewer';
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ 
  options, 
  onChange, 
  userRole 
}) => {
  const updateOption = <K extends keyof ExportOptionsType>(
    key: K, 
    value: ExportOptionsType[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  const toggleDataType = (dataType: string) => {
    const typedDataType = dataType as 'summary' | 'timeseries' | 'performance' | 'pages';
    const newDataTypes = options.dataTypes.includes(typedDataType)
      ? options.dataTypes.filter(type => type !== dataType)
      : [...options.dataTypes, typedDataType];
    updateOption('dataTypes', newDataTypes);
  };

  return (
    <div className="space-y-4">
      {/* Format Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Export Format
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateOption('format', 'csv')}
            className={`p-3 rounded-md border text-sm font-medium transition-colors ${
              options.format === 'csv'
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-border text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <div className="flex flex-col items-center">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </div>
          </button>
          <button
            onClick={() => updateOption('format', 'pdf')}
            className={`p-3 rounded-md border text-sm font-medium transition-colors ${
              options.format === 'pdf'
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-border text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <div className="flex flex-col items-center">
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </div>
          </button>
        </div>
      </div>

      {/* Scope Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Data Scope
        </label>
        <select
          value={options.scope}
          onChange={(e) => updateOption('scope', e.target.value as 'current-site' | 'all-sites' | 'filtered')}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
        >
          <option value="current-site">Current Site Only</option>
          {userRole !== 'Viewer' && (
            <>
              <option value="all-sites">All Sites</option>
              <option value="filtered">Filtered Data</option>
            </>
          )}
        </select>
        {userRole === 'Viewer' && (
          <p className="text-xs text-muted-foreground mt-1">
            Viewers can only export current site data
          </p>
        )}
      </div>

      {/* Data Types Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Data Types
        </label>
        <div className="space-y-2">
          {[
            { key: 'summary', label: 'Summary Metrics', desc: 'Page views, visitors, bounce rate' },
            { key: 'timeseries', label: 'Time Series Data', desc: 'Data points over time' },
            { key: 'pages', label: 'Top Pages', desc: 'Most visited pages' }
          ].map(({ key, label, desc }) => {
            const isDisabled = false; // Removed performance metrics restriction
            return (
              <label
                key={key}
                className={`flex items-start space-x-3 cursor-pointer ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.dataTypes.includes(key as 'summary' | 'timeseries' | 'performance' | 'pages')}
                  onChange={() => !isDisabled && toggleDataType(key)}
                  disabled={isDisabled}
                  className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {desc}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* PDF Specific Options */}
      {options.format === 'pdf' && (
        <div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeCharts || false}
              onChange={(e) => updateOption('includeCharts', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">
                Include Charts
              </div>
              <div className="text-xs text-muted-foreground">
                Add visual charts to the PDF export
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};