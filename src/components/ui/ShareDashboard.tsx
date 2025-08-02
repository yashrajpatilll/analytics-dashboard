'use client';

import React, { useState } from 'react';
import { useURLState } from '@/hooks/useURLState';
import { Button } from './Button';

interface ShareDashboardProps {
  onClose?: () => void;
}

export const ShareDashboard: React.FC<ShareDashboardProps> = ({ onClose }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const { generateShareableURL } = useURLState();

  const handleCopyURL = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };


  const currentURL = generateShareableURL();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Share Dashboard
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Current URL Sharing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Share Current View
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentURL}
              readOnly
              className="
                flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm
              "
            />
            <Button
              onClick={() => handleCopyURL(currentURL)}
              variant="outline"
              size="sm"
            >
              {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Error' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This URL includes your current filters and selected site
          </p>
        </div>


        {/* Export Options */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Dashboard
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
            <Button variant="outline" size="sm">
              Export PDF
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Export current data with applied filters
          </p>
        </div>
      </div>
    </div>
  );
};