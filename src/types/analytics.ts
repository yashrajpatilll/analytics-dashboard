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

export interface DashboardState {
  sites: Site[];
  selectedSiteId: string | null;
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
}