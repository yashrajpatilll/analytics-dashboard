import { useState, useCallback } from 'react';
import { ExportOptions, ExportData, ExportState } from '@/types/analytics';
import { ExportService } from '@/lib/exportService';
import { useDashboardStore } from '@/stores/dashboardStore';

interface UseExportReturn {
  exportState: ExportState;
  exportToCsv: (options: ExportOptions) => Promise<void>;
  exportToPdf: (options: ExportOptions, chartElements?: HTMLElement[]) => Promise<void>;
  resetExportState: () => void;
}

export const useExport = (userRole: 'Admin' | 'Analyst' | 'Viewer' = 'Viewer'): UseExportReturn => {
  const { sites, selectedSiteId, filters } = useDashboardStore();
  
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    error: null,
    downloadUrl: null
  });

  const resetExportState = useCallback(() => {
    setExportState({
      isExporting: false,
      progress: 0,
      error: null,
      downloadUrl: null
    });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setExportState(prev => ({ ...prev, progress }));
  }, []);

  const setError = useCallback((error: string) => {
    setExportState(prev => ({
      ...prev,
      isExporting: false,
      error
    }));
  }, []);

  const exportToCsv = useCallback(async (options: ExportOptions) => {
    try {
      setExportState({
        isExporting: true,
        progress: 0,
        error: null,
        downloadUrl: null
      });

      updateProgress(20);

      const exportData: ExportData = {
        sites,
        filters,
        selectedSiteId,
        exportOptions: options,
        userRole
      };

      updateProgress(50);

      const csvContent = await ExportService.generateCSV(exportData);
      
      updateProgress(80);

      const filename = ExportService.generateFilename(options, 'csv');
      ExportService.downloadFile(csvContent, filename, 'text/csv');

      updateProgress(100);

      setExportState(prev => ({
        ...prev,
        isExporting: false,
        progress: 100,
        downloadUrl: filename
      }));

      // Auto-reset after 3 seconds
      setTimeout(resetExportState, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setError(errorMessage);
    }
  }, [sites, filters, selectedSiteId, userRole, updateProgress, setError, resetExportState]);

  const exportToPdf = useCallback(async (options: ExportOptions, chartElements?: HTMLElement[]) => {
    try {
      setExportState({
        isExporting: true,
        progress: 0,
        error: null,
        downloadUrl: null
      });

      updateProgress(10);

      const exportData: ExportData = {
        sites,
        filters,
        selectedSiteId,
        exportOptions: options,
        userRole
      };

      updateProgress(30);

      // Generate PDF with optional chart elements
      const pdfContent = await ExportService.generatePDF(exportData, chartElements);
      
      updateProgress(80);

      const filename = ExportService.generateFilename(options, 'pdf');
      ExportService.downloadFile(pdfContent, filename, 'application/pdf');

      updateProgress(100);

      setExportState(prev => ({
        ...prev,
        isExporting: false,
        progress: 100,
        downloadUrl: filename
      }));

      // Auto-reset after 3 seconds
      setTimeout(resetExportState, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      setError(errorMessage);
    }
  }, [sites, filters, selectedSiteId, userRole, updateProgress, setError, resetExportState]);

  return {
    exportState,
    exportToCsv,
    exportToPdf,
    resetExportState
  };
};