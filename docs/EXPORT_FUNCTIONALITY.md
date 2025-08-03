# Export Functionality Implementation

## Overview

The analytics dashboard includes a comprehensive data export system that allows users to download their analytics data in both CSV and PDF formats. The implementation provides professional-grade reports with charts, proper formatting, and role-based access control.

## Features

### Export Formats
- **CSV Export**: Raw analytics data with proper formatting and date parsing
- **PDF Export**: Professional reports with charts, themed headers, and structured layouts

### User Experience
- **Separate Share/Export Buttons**: Clear separation between URL sharing and data export
- **Pre-selected Options**: All export options checked by default for immediate use
- **Modal Interactions**: ESC key and click-outside to close functionality
- **Loading States**: Button spinner with "Exporting..." text during processing
- **Success Feedback**: Green checkmark with auto-close after successful export

### Data Export Options
- **Summary Metrics**: Page views, visitors, bounce rate, session duration
- **Time Series Data**: Data points over time for trend analysis
- **Top Pages**: Most visited pages with performance metrics
- **Chart Inclusion**: Visual charts embedded in PDF exports (optional)

### Access Control
- **Role-based Permissions**: Admin, Analyst, and Viewer role support
- **Scope Control**: Current site, all sites, or filtered data export
- **Data Validation**: Permission checks before export processing

## Technical Architecture

### Core Components

#### 1. ExportModal (`src/components/export/ExportModal.tsx`)
- Main export dialog interface
- Handles format selection and export initiation
- Manages loading states and success feedback
- Implements ESC key and click-outside closing

#### 2. ExportOptions (`src/components/export/ExportOptions.tsx`)
- Configurable export parameters interface
- Format selection (CSV/PDF)
- Data scope and type selection
- Chart inclusion toggle for PDF exports

#### 3. ExportService (`src/lib/exportService.ts`)
- Core export logic for CSV and PDF generation
- Chart capture using html2canvas
- Permission validation
- Data transformation and formatting

#### 4. useExport Hook (`src/hooks/useExport.ts`)
- Export state management
- Progress tracking
- Error handling
- Download file management

### Data Flow

```
User clicks Export → ExportModal opens → User selects options → 
Export triggered → Chart elements captured → PDF/CSV generated → 
File downloaded → Success message → Modal auto-closes
```

### Dependencies Added

```json
{
  "papaparse": "^5.5.3",        // CSV generation
  "jspdf": "^3.0.1",            // PDF generation  
  "html2canvas": "^1.4.1",      // Chart capture
  "@types/papaparse": "^5.3.16" // TypeScript support
}
```

## PDF Export Implementation

### Layout Structure
- **Page 1**: Themed header + metadata + Chart 1 (resized to fit)
- **Page 2**: Chart 2 (Performance Metrics) - centered
- **Page 3**: Chart 3 (Page Heatmap) - centered with proper scaling
- **Page 4+**: Data summary table with formatted dates and numbers

### Styling Features
- **Themed Header**: App color scheme (#a67c52) with white text
- **Professional Layout**: Consistent typography and spacing
- **Chart Descriptions**: Explanatory text for each visualization
- **Formatted Data Table**: Alternating row colors, proper column sizing
- **Date Formatting**: Human-readable dates instead of ISO strings

### Chart Capture
- **html2canvas Integration**: Captures DOM elements as images
- **Color Compatibility**: Handles modern CSS functions (oklab, oklch)
- **Scale Optimization**: Different scales for different chart types
- **Error Handling**: Graceful fallbacks for capture failures

## CSV Export Implementation

### Data Transformation
- **Flattened Structure**: Complex nested data converted to flat rows
- **Proper Headers**: Camelcase to human-readable column names
- **Date Formatting**: ISO timestamps converted to readable format
- **Number Formatting**: Large numbers formatted with commas

### Export Structure
```csv
timestamp,siteId,siteName,pageViews,uniqueVisitors,bounceRate,avgSessionDuration,loadTime,topPage,topPageViews
8/3/2025 10:30,site_005,Corporate Website,216,148,0.67,113,256,/,66
```

## Error Handling

### Chart Capture Issues
- **Color Function Errors**: CSS overrides for unsupported functions
- **Visibility Problems**: Temporary style modifications during capture
- **Retry Logic**: Simplified rendering on initial failure

### Permission Validation
- **Role Checking**: Validates user permissions before export
- **Scope Restrictions**: Viewers limited to current site data
- **Data Type Filtering**: Performance metrics restricted by role

### User Feedback
- **Error Messages**: Clear, actionable error descriptions
- **Loading States**: Visual feedback during processing
- **Success Confirmation**: Clear indication of successful export

## File Structure

```
src/
├── components/
│   ├── export/
│   │   ├── ExportModal.tsx           # Main export dialog
│   │   ├── ExportOptions.tsx         # Export configuration
│   │   └── ExportProgress.tsx        # Loading states (legacy)
│   ├── dashboard/
│   │   └── Dashboard.tsx             # Separate Share/Export buttons
│   └── ui/
│       └── ShareDashboard.tsx        # URL sharing only
├── hooks/
│   └── useExport.ts                  # Export state management
├── lib/
│   └── exportService.ts              # Core export logic
├── stores/
│   └── dashboardStore.ts             # Extended with export state
└── types/
    └── analytics.ts                  # Export-related type definitions
```

## Usage Examples

### Basic CSV Export
```typescript
const { exportToCsv } = useExport('Admin');
await exportToCsv({
  format: 'csv',
  scope: 'current-site',
  dataTypes: ['summary', 'timeseries']
});
```

### PDF Export with Charts
```typescript
const { exportToPdf } = useExport('Admin');
const chartElements = document.querySelectorAll('[data-chart]');
await exportToPdf({
  format: 'pdf',
  scope: 'all-sites',
  dataTypes: ['summary', 'pages'],
  includeCharts: true
}, Array.from(chartElements));
```

## Performance Considerations

### Chart Capture Optimization
- **Selective Scaling**: Lower scale for CSS-heavy components
- **Async Processing**: Non-blocking chart capture with delays
- **Memory Management**: Proper cleanup of generated canvases

### Large Dataset Handling
- **Chunked Processing**: Future enhancement for worker threads
- **Progress Tracking**: Real-time feedback for large exports
- **Memory Efficiency**: Streaming for very large datasets

## Future Enhancements

### Planned Features
- **Background Processing**: Web Workers for large datasets
- **Export Scheduling**: Automated periodic exports
- **Custom Templates**: User-defined PDF layouts
- **Email Integration**: Direct email delivery of exports

### Performance Improvements
- **Caching**: Chart image caching for repeated exports
- **Compression**: PDF size optimization
- **Streaming**: Large CSV streaming exports

## Troubleshooting

### Common Issues
1. **Charts not appearing in PDF**: Check data-chart attributes on containers
2. **Color rendering errors**: Modern CSS functions may need fallbacks
3. **Large file sizes**: Consider reducing chart scale or image quality
4. **Permission errors**: Verify user role and scope selection

### Debug Mode
Enable console logging to track export process:
```javascript
// Check chart detection
console.log('📊 Found charts:', document.querySelectorAll('[data-chart]').length);

// Monitor export progress
localStorage.setItem('export-debug', 'true');
```

This implementation provides a robust, user-friendly export system that maintains professional quality while handling edge cases and providing excellent user experience.