import React, { memo, useMemo } from 'react';
import { AnalyticsDataPoint } from '@/types/analytics';
import { useTheme } from '@/hooks/useTheme';

interface HeatMapComponentProps {
  data: AnalyticsDataPoint[];
  height?: number;
}

interface TopPageData {
  path: string;
  views: number;
  avgLoadTime: number;
  bounceRate: number;
  percentage: number;
}

export const HeatMapComponent = memo(({
  data,
  height = 200
}: HeatMapComponentProps) => {
  const { isDark, mounted } = useTheme();
  const topPagesData = useMemo(() => {
    if (!data.length) return [];

    // Aggregate top pages data across all data points
    const pageMap = new Map<string, { views: number, loadTimes: number[], bounceRates: number[] }>();
    
    data.forEach(point => {
      point.topPages.forEach(page => {
        const existing = pageMap.get(page.path) || { views: 0, loadTimes: [], bounceRates: [] };
        existing.views += page.views;
        existing.loadTimes.push(point.performanceMetrics.loadTime);
        existing.bounceRates.push(point.bounceRate);
        pageMap.set(page.path, existing);
      });
    });

    // Convert to array and calculate averages
    const topPages: TopPageData[] = Array.from(pageMap.entries()).map(([path, data]) => ({
      path,
      views: data.views,
      avgLoadTime: data.loadTimes.reduce((a, b) => a + b, 0) / data.loadTimes.length,
      bounceRate: data.bounceRates.reduce((a, b) => a + b, 0) / data.bounceRates.length,
      percentage: 0 // Will be calculated below
    }));

    // Sort by views and take top 5
    topPages.sort((a, b) => b.views - a.views);
    const topFive = topPages.slice(0, 5);
    
    // Calculate percentages
    const totalViews = topFive.reduce((sum, page) => sum + page.views, 0);
    topFive.forEach(page => {
      page.percentage = totalViews > 0 ? (page.views / totalViews) * 100 : 0;
    });

    return topFive;
  }, [data]);

  // Use theme colors consistent with other charts
  const colors = {
    primary: isDark ? '#c0a080' : '#a67c52',
    background: isDark ? '#3a322c' : '#fffcf5',
    text: isDark ? '#c5bcac' : '#7d6b56',
    muted: isDark ? '#4a4039' : '#dbd0ba',
    success: isDark ? '#10b981' : '#059669',
    warning: isDark ? '#f59e0b' : '#d97706',
    danger: isDark ? '#ef4444' : '#dc2626'
  };

  const getPerformanceColor = (loadTime: number) => {
    // Good: < 1s, Warning: 1-2s, Poor: > 2s
    if (loadTime < 1) return colors.success;
    if (loadTime < 2) return colors.warning;
    return colors.danger;
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ height }}>
        <div className="text-muted-foreground">Loading page performance...</div>
      </div>
    );
  }

  if (!topPagesData.length) {
    return (
      <div 
        className="flex items-center justify-center bg-muted/50 rounded-lg border-2 border-dashed border-muted"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-muted-foreground font-medium">No page data available</p>
          <p className="text-muted-foreground/70 text-sm mt-1">Page performance metrics will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Pages list - compact design to fit without scrolling */}
      <div className="flex-1 p-2 space-y-2 lg:space-y-4">
        {topPagesData.map((page, index) => {
          const maxViews = Math.max(...topPagesData.map(p => p.views));
          const barWidth = (page.views / maxViews) * 100;
          const performanceColor = getPerformanceColor(page.avgLoadTime);
          
          return (
            <div
              key={page.path}
              className="group relative bg-background/50 rounded-lg p-2 border border-muted hover:border-primary/50 transition-all duration-200"
            >
              {/* Compact layout - single row */}
              <div className="flex items-center gap-3">
                {/* Rank */}
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                  {index + 1}
                </span>
                
                {/* Page info and bar */}
                <div className="flex-1 min-w-0">
                  {/* Page path and percentage */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground text-sm truncate">{page.path}</span>
                    <span className="text-xs text-muted-foreground font-medium ml-2">
                      {page.percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-muted/30 rounded-full h-1.5 mb-1 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${barWidth}%`,
                        backgroundColor: colors.primary
                      }}
                    />
                  </div>
                  
                  {/* Metrics - compact row */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-foreground font-medium">
                      {page.views.toLocaleString()}
                    </span>
                    <span 
                      className="font-medium"
                      style={{ color: performanceColor }}
                    >
                      {page.avgLoadTime.toFixed(2)}s
                    </span>
                    <span className="text-muted-foreground">
                      {(page.bounceRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                <div className="font-semibold">{page.path}</div>
                <div>Views: {page.views.toLocaleString()}</div>
                <div>Load Time: {page.avgLoadTime.toFixed(2)}s</div>
                <div>Bounce Rate: {(page.bounceRate * 100).toFixed(1)}%</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend - fixed at bottom */}
      <div className="flex-shrink-0 px-2 py-2 border-t border-muted">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium text-muted-foreground">Performance:</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.success }}></div>
            <span className="text-muted-foreground">Fast</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.warning }}></div>
            <span className="text-muted-foreground">OK</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.danger }}></div>
            <span className="text-muted-foreground">Slow</span>
          </div>
        </div>
      </div>
    </div>
  );
});

HeatMapComponent.displayName = 'HeatMapComponent';