'use client';

import React from 'react';

interface ExportProgressProps {
  progress: number;
  error: string | null;
  downloadUrl: string | null;
}

export const ExportProgress: React.FC<ExportProgressProps> = ({
  progress,
  error,
  downloadUrl
}) => {
  if (error) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Export Failed
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {error}
        </p>
      </div>
    );
  }

  if (downloadUrl && progress === 100) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Export Complete!
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Your file has been downloaded successfully.
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          File: {downloadUrl}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 mx-auto mb-4 relative">
        {/* Circular Progress */}
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
            className="text-blue-600 dark:text-blue-400 transition-all duration-300"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Progress Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Exporting Data...
      </h4>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {progress < 30 && 'Preparing export...'}
          {progress >= 30 && progress < 60 && 'Processing data...'}
          {progress >= 60 && progress < 90 && 'Generating file...'}
          {progress >= 90 && 'Finalizing download...'}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};