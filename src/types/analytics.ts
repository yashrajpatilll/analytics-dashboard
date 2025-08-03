export interface AnalyticsDataPoint {
  timestamp: string;
  siteId: string;
  siteName: string;
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{
    path: string;
    views: number;
  }>;
  performanceMetrics: {
    loadTime: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
  };
  userFlow: Array<{
    from: string;
    to: string;
    count: number;
  }>;
}

export interface Site {
  siteId: string;
  siteName: string;
  data: AnalyticsDataPoint[];
  lastUpdated: string;
}


export interface FilterState {
  searchQuery: string;
  sortBy: 'name' | 'lastUpdated' | 'dataCount';
  sortOrder: 'asc' | 'desc';
  dateRange?: {
    start: string;
    end: string;
  };
  performanceFilter?: {
    minPageViews?: number;
    maxBounceRate?: number;
    minLoadTime?: number;
  };
}

export interface ExportOptions {
  format: 'csv' | 'pdf';
  scope: 'current-site' | 'all-sites' | 'filtered';
  dataTypes: ('summary' | 'timeseries' | 'performance' | 'pages')[];
  dateRange?: {
    start: string;
    end: string;
  };
  includeCharts?: boolean; // PDF only
}

export interface ExportData {
  sites: Site[];
  filters: FilterState;
  selectedSiteId: string | null;
  exportOptions: ExportOptions;
  userRole: 'Admin' | 'Analyst' | 'Viewer';
}

export interface ExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
  downloadUrl: string | null;
}

export interface DashboardState {
  sites: Site[];
  selectedSiteId: string | null;
  selectedSite?: Site | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  performanceMetrics: {
    memoryUsage: number;
    fps: number;
    dataPointsCount: number;
    lastUpdateTime?: number;
  };
  // Filtering and URL state
  filters: FilterState;
  dateRange: { start: Date; end: Date } | null;
  // Export functionality
  exportState: ExportState;
}