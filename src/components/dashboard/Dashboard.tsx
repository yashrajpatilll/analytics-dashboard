'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { AnalyticsDataPoint } from '@/types/analytics';
import { LineChartComponent } from '@/components/charts/LineChartComponent';
import { BarChartComponent } from '@/components/charts/BarChartComponent';
import { HeatMapComponent } from '@/components/charts/HeatMapComponent';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Activity, Wifi, WifiOff } from 'lucide-react';

const WEBSOCKET_URL = 'ws://localhost:8080';

export const Dashboard: React.FC = () => {
  const {
    sites,
    selectedSiteId,
    connectionStatus,
    performanceMetrics,
    addDataPoint,
    setSelectedSite,
    setConnectionStatus,
    updatePerformanceMetrics,
    pruneOldData
  } = useDashboardStore();

  // Memoize WebSocket callbacks to prevent unnecessary reconnections
  const handleMessage = useCallback((data: AnalyticsDataPoint) => {
    addDataPoint(data);
  }, [addDataPoint]);

  const handleError = useCallback((error: Event) => {
    console.error('WebSocket connection error:', error);
    setConnectionStatus('error');
  }, [setConnectionStatus]);

  const handleConnectionChange = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    setConnectionStatus(status);
  }, [setConnectionStatus]);

  // Setup WebSocket connection
  const { reconnect } = useWebSocket({
    url: WEBSOCKET_URL,
    onMessage: handleMessage,
    onError: handleError,
    onConnectionChange: handleConnectionChange
  });

  // Setup performance monitoring
  const performanceData = usePerformanceMonitor();

  // Update performance metrics in store (only fps and memory, not dataPointsCount)
  useEffect(() => {
    updatePerformanceMetrics({
      memoryUsage: performanceData.memoryUsage,
      fps: performanceData.fps
    });
  }, [performanceData, updatePerformanceMetrics]);

  // Prune old data periodically (keep last 30 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      pruneOldData(30 * 60 * 1000); // 30 minutes in milliseconds
    }, 60000); // Run every minute

    return () => clearInterval(interval);
  }, [pruneOldData]);

  // Get selected site data
  const selectedSite = useMemo(() => {
    return sites.find(site => site.siteId === selectedSiteId) || null;
  }, [sites, selectedSiteId]);

  // Prepare chart data with more aggressive memoization
  const chartData = useMemo(() => {
    if (!selectedSite || !selectedSite.data.length) return [];
    
    // Only take the last 30 data points for better performance
    const recentData = selectedSite.data.slice(-30);
    
    return recentData.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString(),
      pageViews: point.pageViews,
      uniqueVisitors: point.uniqueVisitors,
      bounceRate: Math.round(point.bounceRate * 100),
      loadTime: Math.round(point.performanceMetrics.loadTime * 100) / 100
    }));
  }, [selectedSite]);

  const ConnectionStatus = () => (
    <div className="flex items-center gap-2">
      {connectionStatus === 'connected' ? (
        <Wifi className="w-4 h-4 text-primary" />
      ) : (
        <WifiOff className="w-4 h-4 text-destructive" />
      )}
      <span className={`text-sm font-medium ${
        connectionStatus === 'connected' 
          ? ' text-primary' 
          : ' text-destructive'
      }`}>
        {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
      </span>
      {connectionStatus !== 'connected' && (
        <Button
          onClick={reconnect}
          size="sm"
          variant="outline"
          className="ml-2"
        >
          Reconnect
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="">
            <h1 className="text-2xl sm:text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Real-time website performance monitoring</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4" />
                <span className="font-medium">{performanceMetrics.dataPointsCount} data points</span>
              </div>
            </div>
            <ConnectionStatus />
          </div>
        </div>

        {/* Site Selector */}
        <Card className="p-4 border-0 bg-card/50 shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Select Site</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {sites.map((site) => (
              <Button
                key={site.siteId}
                onClick={() => setSelectedSite(site.siteId)}
                variant={selectedSiteId === site.siteId ? 'default' : 'outline'}
                className={`justify-start h-auto p-3 transition-all duration-200 border-0 ${
                  selectedSiteId === site.siteId 
                    ? 'ring-1 ring-ring/20 shadow-sm bg-primary text-primary-foreground' 
                    : 'hover:shadow-sm bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex flex-col items-start w-full">
                  <span className="font-semibold text-sm">{site.siteName}</span>
                  <span className={`text-xs mt-1 ${
                    selectedSiteId === site.siteId 
                      ? 'text-primary-foreground/80' 
                      : 'text-muted-foreground'
                  }`}>
                    {site.data.length} data points
                  </span>
                </div>
              </Button>
            ))}
          </div>
          {sites.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No sites connected. Waiting for data...
            </p>
          )}
        </Card>

        {/* Charts */}
        {selectedSite && (
          <div className="space-y-6">
            {/* Top Row - Line Chart Full Width */}
            <Card className="p-4 sm:p-6 border-0 bg-card/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Page Views Trend</h3>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                  Last 30 points
                </span>
              </div>
              <div className="h-64 sm:h-80">
                <LineChartComponent 
                  data={chartData}
                  dataKey="pageViews"
                />
              </div>
            </Card>

            {/* Bottom Row - Bar Chart and Heatmap Side by Side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="p-4 sm:p-6 border-0 bg-card/50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Performance Metrics</h3>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    Load Time (ms)
                  </span>
                </div>
                <div className="h-64 sm:h-80">
                  <BarChartComponent 
                    data={chartData.slice(-10)}
                    xAxisKey="time"
                    yAxisKey="loadTime"
                  />
                </div>
              </Card>

              <Card className="p-4 sm:p-6 border-0 bg-card/50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">User Behavior Heatmap</h3>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    Recent 20 points
                  </span>
                </div>
                <div className="h-64 sm:h-80">
                  <HeatMapComponent 
                    data={selectedSite.data.slice(-20)}
                    height={320}
                  />
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Performance Monitor */}
        <Card className="p-4 sm:p-6 border-0 bg-card/50 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-foreground">System Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1 p-3 bg-muted/30 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Memory Usage</span>
              <span className="text-xl font-bold font-mono text-foreground">
                {Math.round(performanceMetrics.memoryUsage)}<span className="text-sm text-muted-foreground ml-1">MB</span>
              </span>
            </div>
            <div className="flex flex-col space-y-1 p-3 bg-muted/30 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Frame Rate</span>
              <span className="text-xl font-bold font-mono text-foreground">
                {Math.round(performanceMetrics.fps)}<span className="text-sm text-muted-foreground ml-1">FPS</span>
              </span>
            </div>
            <div className="flex flex-col space-y-1 p-3 bg-muted/30 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Data Points</span>
              <span className="text-xl font-bold font-mono text-primary">
                {performanceMetrics.dataPointsCount.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};