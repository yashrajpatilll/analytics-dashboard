import Papa from 'papaparse';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ExportOptions, ExportData, AnalyticsDataPoint } from '@/types/analytics';

interface ExportRow {
  timestamp: string;
  siteId: string;
  siteName: string;
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  topPage: string;
  topPageViews: number;
}

export class ExportService {
  static validatePermissions(userRole: string, options: ExportOptions): boolean {
    // Viewers can only export current site data
    if (userRole === 'Viewer' && options.scope !== 'current-site') {
      return false;
    }
    
    // All roles can export basic data types
    const allowedDataTypes = ['summary', 'timeseries', 'pages'];
    if (userRole === 'Viewer') {
      // Viewers cannot export performance metrics
      return options.dataTypes.every(type => allowedDataTypes.includes(type));
    }
    
    return true;
  }

  static filterDataByOptions(exportData: ExportData): AnalyticsDataPoint[] {
    const { sites, selectedSiteId, exportOptions, filters } = exportData;
    let dataToExport: AnalyticsDataPoint[] = [];

    switch (exportOptions.scope) {
      case 'current-site':
        if (selectedSiteId) {
          const site = sites.find(s => s.siteId === selectedSiteId);
          dataToExport = site?.data || [];
        }
        break;
      case 'all-sites':
        dataToExport = sites.flatMap(site => site.data);
        break;
      case 'filtered':
        dataToExport = sites.flatMap(site => site.data);
        // Apply search filter
        if (filters.searchQuery) {
          dataToExport = dataToExport.filter(point => 
            point.siteName.toLowerCase().includes(filters.searchQuery.toLowerCase())
          );
        }
        break;
    }

    // Apply date range filter
    const dateRange = exportOptions.dateRange || filters.dateRange;
    if (dateRange) {
      dataToExport = dataToExport.filter(point => {
        const pointDate = new Date(point.timestamp);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return pointDate >= startDate && pointDate <= endDate;
      });
    }

    // Apply performance filters
    if (filters.performanceFilter) {
      const { minPageViews, maxBounceRate, minLoadTime } = filters.performanceFilter;
      dataToExport = dataToExport.filter(point => {
        if (minPageViews && point.pageViews < minPageViews) return false;
        if (maxBounceRate && point.bounceRate > maxBounceRate) return false;
        if (minLoadTime && point.performanceMetrics.loadTime < minLoadTime) return false;
        return true;
      });
    }

    return dataToExport;
  }

  static transformDataForExport(data: AnalyticsDataPoint[], dataTypes: string[]): ExportRow[] {
    return data.map(point => {
      const row: Partial<ExportRow> = {
        timestamp: point.timestamp,
        siteId: point.siteId,
        siteName: point.siteName,
      };

      if (dataTypes.includes('summary')) {
        row.pageViews = point.pageViews;
        row.uniqueVisitors = point.uniqueVisitors;
        row.bounceRate = point.bounceRate;
        row.avgSessionDuration = point.avgSessionDuration;
      }

      if (dataTypes.includes('performance')) {
        row.loadTime = point.performanceMetrics.loadTime;
        row.firstContentfulPaint = point.performanceMetrics.firstContentfulPaint;
        row.largestContentfulPaint = point.performanceMetrics.largestContentfulPaint;
      }

      if (dataTypes.includes('pages') && point.topPages.length > 0) {
        row.topPage = point.topPages[0].path;
        row.topPageViews = point.topPages[0].views;
      }

      return row as ExportRow;
    });
  }

  static async generateCSV(exportData: ExportData): Promise<string> {
    if (!this.validatePermissions(exportData.userRole, exportData.exportOptions)) {
      throw new Error('Insufficient permissions for this export operation');
    }

    const filteredData = this.filterDataByOptions(exportData);
    const transformedData = this.transformDataForExport(filteredData, exportData.exportOptions.dataTypes);

    const csv = Papa.unparse(transformedData, {
      header: true,
      delimiter: ',',
      newline: '\n'
    });

    return csv;
  }

  static async generatePDF(exportData: ExportData, chartElements?: HTMLElement[]): Promise<Uint8Array> {
    if (!this.validatePermissions(exportData.userRole, exportData.exportOptions)) {
      throw new Error('Insufficient permissions for this export operation');
    }

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Theme colors (matching the app)
    const themeColors = {
      primary: '#a67c52',
      primaryLight: '#c0a080',
      background: '#fffcf5',
      text: '#3a322c',
      muted: '#7d6b56'
    };
    
    // Add themed header background
    doc.setFillColor(themeColors.primary);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    // Add title in header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Analytics Dashboard Export', pageWidth / 2, 20, { align: 'center' });
    
    // Reset text color for body
    doc.setTextColor(themeColors.text);
    
    // Get selected site info
    const selectedSite = exportData.selectedSiteId 
      ? exportData.sites.find(s => s.siteId === exportData.selectedSiteId)
      : null;
    
    // Add export metadata section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Export Details', 20, 45);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const exportDate = new Date().toLocaleDateString();
    const exportTime = new Date().toLocaleTimeString();
    
    let metadataY = 52;
    doc.text(`Export Date: ${exportDate} at ${exportTime}`, 20, metadataY);
    metadataY += 6;
    
    if (selectedSite) {
      doc.text(`Site: ${selectedSite.siteName} (${selectedSite.siteId})`, 20, metadataY);
      metadataY += 6;
    }
    

    let yPosition = metadataY + 15;

    // Add charts if requested and provided
    if (exportData.exportOptions.includeCharts && chartElements && chartElements.length > 0) {
      console.log('📊 Processing', chartElements.length, 'chart elements for PDF');
      
      // Chart descriptions mapped by data-chart attribute
      const chartDescriptionsMap: { [key: string]: { title: string; description: string } } = {
        'page-views-chart': {
          title: 'Page Views Trend',
          description: 'Shows the trend of page views over time. Higher values indicate increased website traffic and user engagement.'
        },
        'performance-chart': {
          title: 'Performance Metrics',
          description: 'Displays load times across different time periods. Lower values indicate better website performance and user experience.'
        },
        'heatmap-chart': {
          title: 'Page Performance Heatmap',
          description: 'Visual representation of page performance metrics. Colors indicate relative performance levels across different pages.'
        }
      };
      
      // Fallback descriptions for unknown charts
      const chartDescriptions = [
        chartDescriptionsMap['page-views-chart'],
        chartDescriptionsMap['performance-chart'],
        chartDescriptionsMap['heatmap-chart']
      ];
      
      for (let i = 0; i < chartElements.length; i++) {
        const element = chartElements[i];
        
        // Check if this is a heatmap component (CSS-based)
        const isHeatmap = element.dataset.chart === 'heatmap-chart' || 
                         element.querySelector('.group.relative.bg-background') !== null;
        let originalStyles: Record<string, string> = {};
        
        try {
          console.log(`📊 Processing chart ${i + 1}:`, element);
          
          // Make sure the element is visible
          const rect = element.getBoundingClientRect();
          console.log(`📊 Chart ${i + 1} dimensions:`, rect);
          
          if (rect.width === 0 || rect.height === 0) {
            console.warn(`📊 Chart ${i + 1} has zero dimensions, skipping`);
            
            // Still add description for missing chart
            if (chartDescriptions[i]) {
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text(`${i + 1}. ${chartDescriptions[i].title}`, 20, yPosition);
              yPosition += 8;
              
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              doc.text(`Chart not available: ${chartDescriptions[i].description}`, 20, yPosition);
              yPosition += 15;
            }
            continue;
          }
          
          // Add some delay to ensure chart is fully rendered
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // For heatmap, temporarily add a class to make it more export-friendly
          if (isHeatmap) {
            element.classList.add('exporting-chart');
            // Add temporary inline styles to ensure visibility
            originalStyles = {
              position: element.style.position,
              zIndex: element.style.zIndex,
              transform: element.style.transform
            };
            element.style.position = 'relative';
            element.style.zIndex = '1000';
            element.style.transform = 'none';
            
            // Small delay after style changes
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          const canvas = await html2canvas(element, {
            scale: isHeatmap ? 1.5 : 2, // Reduced scale for heatmap to prevent cutting off
            backgroundColor: '#ffffff',
            allowTaint: true,
            useCORS: true,
            logging: false,
            width: rect.width,
            height: rect.height,
            scrollX: 0,
            scrollY: 0,
            ignoreElements: (element) => {
              // Skip elements that might cause issues
              return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
            },
            onclone: (clonedDoc) => {
              // Add CSS override to handle unsupported color functions
              const style = clonedDoc.createElement('style');
              style.textContent = `
                * {
                  /* Override any problematic color functions with safe fallbacks */
                  color: inherit !important;
                  background-color: inherit !important;
                  border-color: inherit !important;
                }
                /* Apply safe theme colors for the export */
                .bg-background { background-color: #fffcf5 !important; }
                .bg-primary { background-color: #a67c52 !important; }
                .bg-muted { background-color: #f5f5f4 !important; }
                .text-foreground { color: #3a322c !important; }
                .text-primary { color: #a67c52 !important; }
                .text-muted-foreground { color: #7d6b56 !important; }
                .border-border { border-color: #e5e5e5 !important; }
                .border-primary { border-color: #a67c52 !important; }
                .border-muted { border-color: #e5e5e5 !important; }
                /* Specific overrides for heatmap elements */
                .group.relative.bg-background { background-color: #f8f9fa !important; }
                .bg-primary\\/10 { background-color: rgba(166, 124, 82, 0.1) !important; }
                .hover\\:border-primary\\/50:hover { border-color: rgba(166, 124, 82, 0.5) !important; }
              `;
              clonedDoc.head.appendChild(style);
              
              // Ensure the target element is properly styled
              const clonedElement = clonedDoc.querySelector(`[data-chart="${element.dataset.chart}"]`) as HTMLElement;
              if (clonedElement) {
                clonedElement.style.display = 'flex';
                clonedElement.style.flexDirection = 'column';
                clonedElement.style.height = rect.height + 'px';
                clonedElement.style.width = rect.width + 'px';
                clonedElement.style.position = 'relative';
              }
            }
          });
          
          const imgData = canvas.toDataURL('image/png');
          const aspectRatio = canvas.height / canvas.width;
          const imgWidth = Math.min(pageWidth - 40, isHeatmap ? 280 : 250); // Larger width for heatmap
          const imgHeight = imgWidth * aspectRatio;
          
          // For chart 1, ensure it fits on page 1, for others put on separate pages
          if (i === 0) {
            // Chart 1: Check if it fits on current page, if not make it smaller
            const availableHeight = pageHeight - yPosition - 40;
            if (imgHeight > availableHeight) {
              // Make chart smaller to fit on page 1
              const maxHeight = availableHeight - 60; // Leave room for title and description
              const adjustedWidth = (maxHeight / aspectRatio);
              const finalWidth = Math.min(adjustedWidth, imgWidth);
              const finalHeight = finalWidth * aspectRatio;
              
              // Add chart title and description
              const chartKey = element.dataset.chart || '';
              const chartInfo = chartDescriptionsMap[chartKey] || chartDescriptions[i] || { title: `Chart ${i + 1}`, description: 'Analytics visualization' };
              
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text(`${i + 1}. ${chartInfo.title}`, 20, yPosition);
              yPosition += 8;
              
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              const descLines = doc.splitTextToSize(chartInfo.description, pageWidth - 40);
              doc.text(descLines, 20, yPosition);
              yPosition += (descLines.length * 4) + 5;
              
              doc.addImage(imgData, 'PNG', 20, yPosition, finalWidth, finalHeight);
              yPosition += finalHeight + 15;
            } else {
              // Normal rendering for chart 1 if it fits
              const chartKey = element.dataset.chart || '';
              const chartInfo = chartDescriptionsMap[chartKey] || chartDescriptions[i] || { title: `Chart ${i + 1}`, description: 'Analytics visualization' };
              
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text(`${i + 1}. ${chartInfo.title}`, 20, yPosition);
              yPosition += 8;
              
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              const descLines = doc.splitTextToSize(chartInfo.description, pageWidth - 40);
              doc.text(descLines, 20, yPosition);
              yPosition += (descLines.length * 4) + 5;
              
              doc.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 20;
            }
          } else {
            // Charts 2+ go on separate pages
            doc.addPage();
            yPosition = 30;
            
            // Add chart title and description
            const chartKey = element.dataset.chart || '';
            const chartInfo = chartDescriptionsMap[chartKey] || chartDescriptions[i] || { title: `Chart ${i + 1}`, description: 'Analytics visualization' };
            
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(`${i + 1}. ${chartInfo.title}`, 20, yPosition);
            yPosition += 12;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(chartInfo.description, pageWidth - 40);
            doc.text(descLines, 20, yPosition);
            yPosition += (descLines.length * 5) + 10;
            
            // Center the chart on the page
            const chartX = (pageWidth - imgWidth) / 2;
            doc.addImage(imgData, 'PNG', chartX, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 20;
          }
          
          // Cleanup: restore original styles for heatmap
          if (isHeatmap) {
            element.classList.remove('exporting-chart');
            element.style.position = originalStyles.position || '';
            element.style.zIndex = originalStyles.zIndex || '';
            element.style.transform = originalStyles.transform || '';
          }
          
          console.log(`📊 Successfully added chart ${i + 1} to PDF`);
        } catch (error) {
          console.error(`📊 Failed to add chart ${i + 1} to PDF:`, error);
          
          // Cleanup: restore original styles even on error
          if (isHeatmap && element.classList.contains('exporting-chart')) {
            element.classList.remove('exporting-chart');
            if (originalStyles.position !== undefined) element.style.position = originalStyles.position || '';
            if (originalStyles.zIndex !== undefined) element.style.zIndex = originalStyles.zIndex || '';
            if (originalStyles.transform !== undefined) element.style.transform = originalStyles.transform || '';
          }
          
          // If it's a color parsing error, try a simplified approach
          if (error instanceof Error && error.message.includes('oklab')) {
            console.log(`📊 Retrying chart ${i + 1} with simplified rendering...`);
            try {
              // Try again with more restrictive options
              const simpleCanvas = await html2canvas(element, {
                scale: 1,
                backgroundColor: '#ffffff',
                allowTaint: false,
                useCORS: false,
                logging: false,
                foreignObjectRendering: false,
                onclone: (clonedDoc) => {
                  // Add very basic CSS reset
                  const style = clonedDoc.createElement('style');
                  style.textContent = `
                    * { 
                      color: #333 !important; 
                      background-color: transparent !important; 
                      border-color: #ccc !important; 
                    }
                  `;
                  clonedDoc.head.appendChild(style);
                }
              });
              
              const imgData = simpleCanvas.toDataURL('image/png');
              const aspectRatio = simpleCanvas.height / simpleCanvas.width;
              const imgWidth = Math.min(pageWidth - 40, 250);
              const imgHeight = imgWidth * aspectRatio;
              
              if (yPosition + imgHeight + 40 > pageHeight - 20) {
                doc.addPage();
                yPosition = 30;
              }
              
              const chartKey = element.dataset.chart || '';
              const chartInfo = chartDescriptionsMap[chartKey] || chartDescriptions[i] || { title: `Chart ${i + 1}`, description: 'Analytics visualization' };
              
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text(`${i + 1}. ${chartInfo.title}`, 20, yPosition);
              yPosition += 8;
              
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');
              const descLines = doc.splitTextToSize(chartInfo.description, pageWidth - 40);
              doc.text(descLines, 20, yPosition);
              yPosition += (descLines.length * 4) + 5;
              
              doc.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 20;
              
              console.log(`📊 Successfully added chart ${i + 1} to PDF on retry`);
              continue;
            } catch (retryError) {
              console.error(`📊 Retry also failed for chart ${i + 1}:`, retryError);
            }
          }
          
          // Add error placeholder with description
          const chartKey = element.dataset.chart || '';
          const chartInfo = chartDescriptionsMap[chartKey] || chartDescriptions[i] || { title: `Chart ${i + 1}`, description: 'Analytics visualization' };
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`${i + 1}. ${chartInfo.title}`, 20, yPosition);
          yPosition += 8;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Chart render failed: ${chartInfo.description}`, 20, yPosition);
          yPosition += 15;
        }
      }
    } else if (exportData.exportOptions.includeCharts) {
      console.warn('📊 Charts requested but no chart elements found');
      
      // Add a note about missing charts
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Charts Section', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Note: Charts were requested but could not be found or rendered at export time.', 20, yPosition);
      yPosition += 15;
    }

    // Add data table
    const filteredData = this.filterDataByOptions(exportData);
    const transformedData = this.transformDataForExport(filteredData, exportData.exportOptions.dataTypes);

    if (transformedData.length > 0) {
      // Check if we need a new page for the table
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 30;
      }

      // Add data section header
      doc.setFillColor(themeColors.primaryLight);
      doc.rect(15, yPosition - 5, pageWidth - 30, 15, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Data Summary', 20, yPosition + 5);
      doc.setTextColor(themeColors.text);
      yPosition += 20;

      // Add summary stats
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total data points: ${transformedData.length}`, 20, yPosition);
      if (selectedSite && selectedSite.data.length > 0) {
        const startDate = new Date(selectedSite.data[0]?.timestamp).toLocaleDateString();
        const endDate = new Date(selectedSite.data[selectedSite.data.length - 1]?.timestamp).toLocaleDateString();
        doc.text(`Date range: ${startDate} to ${endDate}`, 150, yPosition);
      }
      yPosition += 12;

      // Create enhanced table
      const headers = Object.keys(transformedData[0]);
      const colWidth = Math.min((pageWidth - 40) / headers.length, 35);
      
      // Table header background
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPosition - 3, colWidth * headers.length, 10, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(themeColors.text);
      
      // Header row
      headers.forEach((header, index) => {
        const headerText = header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        doc.text(headerText.substring(0, 12), 22 + (index * colWidth), yPosition + 4);
      });
      yPosition += 12;
      
      // Data rows (limit to fit on page)
      const maxRows = Math.floor((pageHeight - yPosition - 20) / 8);
      const rowsToShow = transformedData.slice(0, maxRows);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      
      rowsToShow.forEach((row, rowIndex) => {
        // Alternate row background
        if (rowIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(20, yPosition - 2, colWidth * headers.length, 8, 'F');
        }
        
        headers.forEach((header, index) => {
          const value = String(row[header as keyof ExportRow] || '');
          let displayValue = value;
          
          // Format specific fields
          if (header.includes('timestamp')) {
            // Parse and format timestamps properly
            try {
              const date = new Date(value);
              displayValue = date.toLocaleDateString() + ' ' + date.toLocaleTimeString().substring(0, 5);
            } catch {
              displayValue = value.substring(0, 12);
            }
          } else if (header.includes('time') || header.includes('Time')) {
            displayValue = value.substring(0, 10); // Truncate other time fields
          } else if (header.includes('Rate') || header.includes('rate')) {
            displayValue = parseFloat(value).toFixed(2);
          } else if (header.includes('Views') || header.includes('Visitors')) {
            // Format numbers with commas if large
            const num = parseInt(value);
            displayValue = num > 999 ? num.toLocaleString() : value;
          } else {
            displayValue = value.substring(0, 12);
          }
          
          doc.text(displayValue, 22 + (index * colWidth), yPosition + 2);
        });
        yPosition += 8;
      });

      if (transformedData.length > maxRows) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`... and ${transformedData.length - maxRows} more rows. Complete data available in CSV export.`, 20, yPosition + 8);
      }
    } else {
      // No data available message
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Data Summary', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('No data available for the selected filters and date range.', 20, yPosition);
    }

    return new Uint8Array(doc.output('arraybuffer') as ArrayBuffer);
  }

  static downloadFile(content: string | Uint8Array, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  static generateFilename(exportOptions: ExportOptions, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const scope = exportOptions.scope.replace('-', '_');
    return `analytics_${scope}_${timestamp}.${format}`;
  }
}