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

  // Setup WebSocket connection
  const { reconnect } = useWebSocket({
    url: WEBSOCKET_URL,
    onMessage: handleMessage,
    onError: handleError
  });

  // Setup performance monitoring
  const performanceData = usePerformanceMonitor();

  // Update performance metrics in store
  useEffect(() => {
    updatePerformanceMetrics(performanceData);
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
        <Wifi className="w-4 h-4 text-green-500" />
      ) : (
        <WifiOff className="w-4 h-4 text-red-500" />
      )}
      <span className={`text-sm font-medium ${
        connectionStatus === 'connected' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Real-time website performance monitoring</p>
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <ThemeToggle />
            <ConnectionStatus />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span>{performanceMetrics.dataPointsCount} data points</span>
            </div>
          </div>
        </div>

        {/* Site Selector */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Select Site</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {sites.map((site) => (
              <Button
                key={site.siteId}
                onClick={() => setSelectedSite(site.siteId)}
                variant={selectedSiteId === site.siteId ? 'default' : 'outline'}
                className="justify-start"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{site.siteName}</span>
                  <span className="text-xs opacity-75">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Page Views Trend</h3>
              <LineChartComponent 
                data={chartData}
                dataKey="pageViews"
                stroke="#3b82f6"
              />
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Performance Metrics</h3>
              <BarChartComponent 
                data={chartData.slice(-10)}
                xAxisKey="time"
                yAxisKey="loadTime"
                fill="#10b981"
              />
            </Card>

            <Card className="p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 text-foreground">User Behavior Heatmap</h3>
              <HeatMapComponent 
                data={selectedSite.data.slice(-20)}
              />
            </Card>
          </div>
        )}

        {/* Performance Monitor */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3 text-foreground">Performance Monitor</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Memory Usage:</span>
              <span className="ml-2 font-mono text-foreground">
                {Math.round(performanceMetrics.memoryUsage)}MB
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">FPS:</span>
              <span className="ml-2 font-mono text-foreground">
                {Math.round(performanceMetrics.fps)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Data Points:</span>
              <span className="ml-2 font-mono text-foreground">
                {performanceMetrics.dataPointsCount}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};