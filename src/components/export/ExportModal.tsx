'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { ExportOptions } from '@/types/analytics';
import { useExport } from '@/hooks/useExport';
import { ExportOptions as ExportOptionsComponent } from './ExportOptions';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'Admin' | 'Analyst' | 'Viewer';
}

export const ExportModal: React.FC<ExportModalProps> = ({ 
  isOpen, 
  onClose, 
  userRole = 'Viewer' 
}) => {
  const { exportState, exportToCsv, exportToPdf, resetExportState } = useExport(userRole);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    scope: 'current-site',
    dataTypes: ['summary', 'timeseries', 'pages'], // All options checked by default
    includeCharts: true // Charts included by default for PDF
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setShowSuccess(false);
    
    try {
      if (exportOptions.format === 'csv') {
        await exportToCsv(exportOptions);
      } else {
        // For PDF with charts, we'll collect chart elements
        const chartElements: HTMLElement[] = [];
        if (exportOptions.includeCharts) {
          // Find chart containers in the DOM
          const charts = document.querySelectorAll('[data-chart]');
          console.log('📊 Found charts for PDF export:', charts.length);
          
          charts.forEach((chart, index) => {
            console.log(`📊 Chart ${index + 1}:`, chart);
            chartElements.push(chart as HTMLElement);
          });
          
          // If no charts found with data-chart attribute, try alternative selectors
          if (charts.length === 0) {
            console.log('📊 No data-chart elements found, trying alternative selectors...');
            const rechartContainers = document.querySelectorAll('.recharts-wrapper');
            const canvasElements = document.querySelectorAll('canvas');
            
            console.log('📊 Found recharts containers:', rechartContainers.length);
            console.log('📊 Found canvas elements:', canvasElements.length);
            
            rechartContainers.forEach(container => {
              chartElements.push(container as HTMLElement);
            });
          }
          
          // Log final count
          console.log('📊 Final chart elements for export:', chartElements.length);
          chartElements.forEach((el, idx) => {
            console.log(`📊 Chart ${idx + 1} element:`, el, 'Visible:', el.offsetWidth > 0 && el.offsetHeight > 0);
          });
        }
        await exportToPdf(exportOptions, chartElements);
      }
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isExporting) { // Don't allow closing while exporting
      resetExportState();
      onClose();
    }
  }, [isExporting, resetExportState, onClose]);

  // Handle ESC key and click outside
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isExporting) {
        handleClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && !isExporting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isExporting, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-background border border-border rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Export Analytics Data
          </h3>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100/50 dark:bg-green-900/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-foreground mb-2">
              Export Successful!
            </h4>
            <p className="text-sm text-muted-foreground">
              Your {exportOptions.format.toUpperCase()} file has been downloaded.
            </p>
          </div>
        ) : (
          <>
            <ExportOptionsComponent
              options={exportOptions}
              onChange={setExportOptions}
              userRole={userRole}
            />

            <div className="flex space-x-2 mt-6">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                disabled={isExporting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                className="flex-1"
                disabled={isExporting}
              >
                {isExporting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Exporting...
                  </div>
                ) : (
                  `Export ${exportOptions.format.toUpperCase()}`
                )}
              </Button>
            </div>
          </>
        )}

        {exportState.error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              {exportState.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};