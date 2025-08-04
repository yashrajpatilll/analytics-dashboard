export interface AIInsight {
  id: string;
  type: 'performance' | 'traffic' | 'user_behavior' | 'alert' | 'recommendation';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  timestamp: string;
  confidence: number; // 0-1
  relatedMetrics?: string[];
  actionable?: boolean;
}

export interface AISummaryState {
  isEnabled: boolean;
  isGenerating: boolean;
  currentInsight: AIInsight | null;
  insights: AIInsight[];
  lastGenerated: string | null;
  error: string | null;
}

export interface StreamingTextState {
  displayedText: string;
  isStreaming: boolean;
  currentIndex: number;
  speed: number; // characters per interval
}

export interface AIAnalysisContext {
  selectedSiteId: string | null;
  recentData: import('./analytics').AnalyticsDataPoint[];
  timeWindow: number; // minutes
  currentMetrics: {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgLoadTime: number;
  };
}