'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';

interface DateRange {
  start: string;
  end: string;
}

const DATE_PRESETS = [
  { label: 'Last 24 Hours', value: () => ({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })},
  { label: 'Last 7 Days', value: () => ({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })},
  { label: 'Last 30 Days', value: () => ({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })},
  { label: 'Last 90 Days', value: () => ({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })},
  { label: 'This Month', value: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  }},
  { label: 'Last Month', value: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }}
];

interface DateRangePickerProps {
  onChange?: (dateRange: DateRange | undefined) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { filters, updateFilters } = useDashboardStore();
  const currentDateRange = filters.dateRange;

  // Initialize dates from store
  useEffect(() => {
    if (currentDateRange) {
      setStartDate(currentDateRange.start);
      setEndDate(currentDateRange.end);
    } else {
      setStartDate('');
      setEndDate('');
    }
  }, [currentDateRange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyDateRange = (dateRange: DateRange | undefined) => {
    updateFilters({ dateRange });
    onChange?.(dateRange);
    setIsOpen(false);
  };

  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    const range = preset.value();
    setStartDate(range.start);
    setEndDate(range.end);
    applyDateRange(range);
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      const range = { start: startDate, end: endDate };
      applyDateRange(range);
    }
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    applyDateRange(undefined);
  };

  const formatDisplayDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString();
  };

  const getDisplayText = () => {
    if (!currentDateRange) return 'Select date range';
    
    // Check if current range matches any preset
    for (const preset of DATE_PRESETS) {
      const presetRange = preset.value();
      if (presetRange.start === currentDateRange.start && presetRange.end === currentDateRange.end) {
        return preset.label;
      }
    }
    
    return `${formatDisplayDate(currentDateRange.start)} - ${formatDisplayDate(currentDateRange.end)}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 
          rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
          hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors
          flex items-center justify-between
        "
      >
        <span className={currentDateRange ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
          {getDisplayText()}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="
          absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 
          border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50
        ">
          <div className="p-4 space-y-4">
            {/* Presets */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Select
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    className="
                      px-3 py-2 text-sm text-left rounded-md
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      text-gray-700 dark:text-gray-300
                      transition-colors
                    "
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Range
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || new Date().toISOString().split('T')[0]}
                    className="
                      w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                      rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                      text-sm
                    "
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="
                      w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                      rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                      text-sm
                    "
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClear}
                className="
                  px-3 py-1 text-sm text-gray-600 dark:text-gray-400 
                  hover:text-gray-800 dark:hover:text-gray-200
                  transition-colors
                "
              >
                Clear
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="
                    px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 
                    rounded text-gray-700 dark:text-gray-300
                    hover:bg-gray-50 dark:hover:bg-gray-700
                    transition-colors
                  "
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomApply}
                  disabled={!startDate || !endDate}
                  className="
                    px-3 py-1 text-sm bg-blue-600 text-white rounded
                    hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600
                    disabled:cursor-not-allowed transition-colors
                  "
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};