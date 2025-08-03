"use client";

import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { AnalyticsDataPoint } from "@/types/analytics";
import { LineChartComponent } from "@/components/charts/LineChartComponent";
import { BarChartComponent } from "@/components/charts/BarChartComponent";
import { HeatMapComponent } from "@/components/charts/HeatMapComponent";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserProfile } from "@/components/ui/UserProfile";
import { SiteFilters } from "@/components/ui/SiteFilters";
import { ShareModal } from "@/components/sharing/ShareModal";
import { ExportModal } from "@/components/export/ExportModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { Activity, Wifi, WifiOff, Share2, Download, Eye } from "lucide-react";

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080";

interface DashboardProps {
  isSharedView?: boolean;
  shareType?: "public" | "member";
}

export const Dashboard: React.FC<DashboardProps> = ({
  isSharedView = false,
  shareType,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const { userProfile } = useAuth();

  const {
    sites,
    selectedSiteId,
    connectionStatus,
    performanceMetrics,
    filters,
    isSharedView: storeIsSharedView,
    sharedViewRestrictions,
    pendingSelectedSiteId,
    checkPermission,
    addDataPoint,
    setSelectedSite,
    setConnectionStatus,
    updatePerformanceMetrics,
    pruneOldData,
  } = useDashboardStore();

  // Use prop or store state for shared view
  const actualIsSharedView = isSharedView || storeIsSharedView;

  // Debug: Log sharing state changes
  useEffect(() => {
    console.log("🔍 Dashboard sharing state:", {
      isSharedView: actualIsSharedView,
      shareType,
      canSelectSites: checkPermission("canSelectSites"),
      restrictions: sharedViewRestrictions,
      selectedSiteId,
      sitesAvailable: sites.length,
    });
  }, [
    actualIsSharedView,
    shareType,
    sharedViewRestrictions,
    selectedSiteId,
    sites.length,
  ]);

  // Check for pending shared site selection when sites become available
  useEffect(() => {
    // Check both localStorage and store pending site
    const localStoragePending = localStorage.getItem("pendingSharedSite");
    const storePending = pendingSelectedSiteId;
    const pendingSite = storePending || localStoragePending;

    if (
      pendingSite &&
      sites.length > 0 &&
      !selectedSiteId &&
      actualIsSharedView
    ) {
      console.log("🔄 Attempting to restore pending shared site:", pendingSite);
      console.log(
        "📋 Available sites:",
        sites.map((s) => `${s.siteId}:${s.siteName}`)
      );

      const siteExists = sites.some((site) => site.siteId === pendingSite);
      if (siteExists) {
        console.log(
          "✅ Found pending site, restoring selection with force=true"
        );
        // Use force=true to bypass permission checks for shared view restoration
        setSelectedSite(pendingSite, true);
        localStorage.removeItem("pendingSharedSite");
      } else {
        console.log("❌ Pending site not found in available sites");
      }
    } else if (pendingSite && sites.length > 0) {
      console.log("🔍 Pending site check:", {
        pendingSite,
        sitesCount: sites.length,
        selectedSiteId,
        actualIsSharedView,
        hasSelection: !!selectedSiteId,
      });
    }
  }, [
    sites,
    selectedSiteId,
    actualIsSharedView,
    pendingSelectedSiteId,
    setSelectedSite,
  ]);

  // Debug state changes
  useEffect(() => {
    console.log("🏪 Dashboard state changed:", {
      selectedSiteId,
      sitesCount: sites.length,
      filtersSearchQuery: filters.searchQuery,
      pendingSelectedSiteId,
      actualIsSharedView,
    });
  }, [
    selectedSiteId,
    sites.length,
    filters.searchQuery,
    pendingSelectedSiteId,
    actualIsSharedView,
  ]);

  // Debug when sites get loaded
  useEffect(() => {
    if (sites.length > 0) {
      console.log(
        "📊 Sites loaded:",
        sites.map((s) => `${s.siteId}:${s.siteName}`)
      );
      if (actualIsSharedView) {
        console.log("🔍 Shared view - checking for pending selection...");
      }
    }
  }, [sites.length, actualIsSharedView]);

  // Handle site selection
  const handleSiteSelection = useCallback(
    (siteId: string) => {
      if (siteId === selectedSiteId) {
        console.log("🎯 Site already selected:", siteId);
        return;
      }
      console.log("🎯 Switching to site:", siteId, "from:", selectedSiteId);
      setSelectedSite(siteId);

      // Debug: Check if site was actually set
      setTimeout(() => {
        console.log(
          "🎯 After selection, selectedSiteId is now:",
          selectedSiteId
        );
      }, 100);
    },
    [setSelectedSite, selectedSiteId]
  );

  // Memoize WebSocket callbacks to prevent unnecessary reconnections
  const handleMessage = useCallback(
    (data: AnalyticsDataPoint) => {
      addDataPoint(data);
    },
    [addDataPoint]
  );

  const handleError = useCallback(() => {
    // Graceful error handling - don't spam console with empty objects
    console.warn(
      "WebSocket server appears to be unavailable. The dashboard will work once the server is started."
    );
    setConnectionStatus("error");
  }, [setConnectionStatus]);

  const handleConnectionChange = useCallback(
    (status: "connecting" | "connected" | "disconnected" | "error") => {
      setConnectionStatus(status);
    },
    [setConnectionStatus]
  );

  // Setup WebSocket connection
  const { reconnect } = useWebSocket({
    url: WEBSOCKET_URL,
    onMessage: handleMessage,
    onError: handleError,
    onConnectionChange: handleConnectionChange,
    enabled: true,
  });

  // Setup performance monitoring
  const performanceData = usePerformanceMonitor();

  // Update performance metrics in store (only fps and memory, not dataPointsCount)
  useEffect(() => {
    updatePerformanceMetrics({
      memoryUsage: performanceData.memoryUsage,
      fps: performanceData.fps,
    });
  }, [performanceData, updatePerformanceMetrics]);

  // Prune old data periodically (keep last 30 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      pruneOldData(30 * 60 * 1000); // 30 minutes in milliseconds
    }, 60000); // Run every minute

    return () => clearInterval(interval);
  }, [pruneOldData]);

  // Filter and sort sites based on current filters
  const filteredSites = useMemo(() => {
    let filtered = [...sites];

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (site) =>
          site.siteName.toLowerCase().includes(query) ||
          site.siteId.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "name":
          comparison = a.siteName.localeCompare(b.siteName);
          break;
        case "lastUpdated":
          comparison =
            new Date(a.lastUpdated || 0).getTime() -
            new Date(b.lastUpdated || 0).getTime();
          break;
        case "dataCount":
          comparison = a.data.length - b.data.length;
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [sites, filters]);

  // Get selected site data
  const selectedSite = useMemo(() => {
    return sites.find((site) => site.siteId === selectedSiteId) || null;
  }, [sites, selectedSiteId]);

  // Prepare chart data with more aggressive memoization
  const chartData = useMemo(() => {
    if (!selectedSite || !selectedSite.data.length) {
      console.log("📊 No chart data:", {
        selectedSite: !!selectedSite,
        dataLength: selectedSite?.data.length || 0,
      });
      return [];
    }

    // Take the last 50 data points for better real-time visibility
    const recentData = selectedSite.data.slice(-50);

    const chartData = recentData.map((point, index) => ({
      time: new Date(point.timestamp).toLocaleTimeString(),
      pageViews: point.pageViews,
      uniqueVisitors: point.uniqueVisitors,
      bounceRate: Math.round(point.bounceRate * 100),
      loadTime: Math.round(point.performanceMetrics.loadTime * 100) / 100,
      dataIndex: index, // Ensure React detects data changes
    }));

    console.log("📊 Chart data prepared:", {
      siteId: selectedSite.siteId,
      totalPoints: selectedSite.data.length,
      chartPoints: chartData.length,
      sampleData: chartData[0],
    });

    return chartData;
  }, [selectedSite]); // Remove unnecessary data.length dependency

  // Prepare bar chart data (last 20 points, but updates dynamically)
  const barChartData = useMemo(() => {
    const data = chartData.slice(-20);
    console.log("📊 Bar chart data updated:", {
      totalChartPoints: chartData.length,
      barChartPoints: data.length,
      latestLoadTime: data[data.length - 1]?.loadTime,
    });
    return data;
  }, [chartData]);

  const ConnectionStatus = () => {
    const getStatusDisplay = () => {
      switch (connectionStatus) {
        case "connected":
          return {
            icon: <Wifi className="w-4 h-4 text-green-600" />,
            text: "Connected",
            className: "text-green-600",
          };
        case "connecting":
          return {
            icon: <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />,
            text: "Connecting...",
            className: "text-yellow-600",
          };
        case "error":
          return {
            icon: <WifiOff className="w-4 h-4 text-red-500" />,
            text: "Server Unavailable",
            className: "text-red-600",
          };
        default:
          return {
            icon: <WifiOff className="w-4 h-4 text-gray-500" />,
            text: "Disconnected",
            className: "text-gray-600",
          };
      }
    };

    const status = getStatusDisplay();

    return (
      <div className="flex items-center gap-2">
        {status.icon}
        <span className={`text-sm font-medium ${status.className}`}>
          {status.text}
        </span>
        {connectionStatus !== "connected" &&
          connectionStatus !== "connecting" && (
            <Button
              onClick={reconnect}
              size="sm"
              variant="outline"
              className="ml-2 "
            >
              Retry Connection
            </Button>
          )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-2 my-2 sm:my-0 sm:p-3 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header */}
        <div className="space-y-4 px-1">
          {/* First row: Title and Controls */}
          <div className="flex justify-between items-center">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Real-time website performance monitoring
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Share Button - only show if not in shared view and user can share */}
              {!actualIsSharedView && checkPermission("canShare") && (
                <Button
                  onClick={() => setShowShareModal(true)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              )}

              {/* Export Button - only show if user can export */}
              {checkPermission("canExport") && (
                <Button
                  onClick={() => setShowExportModal(true)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              )}

              {/* Shared View Indicator */}
              { (
                <div className="flex items-center gap-2 px-2 py-1 bg-muted border border-border rounded-md">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-accent-foreground text-sm font-medium">
                    {shareType === "public" ? "Public View" : "Shared View"}
                  </span>
                </div>
              )}

              <ThemeToggle />
              <UserProfile />
            </div>

            {/* Share Modal */}
            <ShareModal
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
            />

            {/* Export Modal */}
            <ExportModal
              isOpen={showExportModal}
              onClose={() => setShowExportModal(false)}
              userRole={userProfile?.role || "Admin"}
            />
          </div>

          {/* Second row: Connection Status and Data Points */}
          <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 mt-2">
            <ConnectionStatus />
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium">
                {performanceMetrics.dataPointsCount} data points
              </span>
            </div>
          </div>
        </div>

        {/* Site Selector - Hide for public shares, show only selected site */}
        {actualIsSharedView && shareType === "public" ? (
          // Public view: Show only the selected site as info
          <Card className="p-3 sm:p-4 border-0 bg-card/50 shadow-sm">
            <div className="flex items-center gap-3">
              {selectedSite ? (
                <>
                  <h2 className="text-base sm:text-lg font-semibold text-foreground">
                    Viewing Site: {selectedSite.siteName}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    ({selectedSite.data.length} data points)
                  </span>
                </>
              ) : (
                <>
                  <h2 className="text-base sm:text-lg font-semibold text-foreground">
                    Loading Shared Dashboard...
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    Connecting to data source...
                  </span>
                </>
              )}
            </div>
          </Card>
        ) : (
          // Normal view: Show full site selector
          <Card className="p-3 sm:p-4 border-0 bg-card/50 shadow-sm gap-2 sm:gap-3 md:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Select Site ({filteredSites.length})
              </h2>
              <SiteFilters />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredSites.map((site) => (
                <Button
                  key={site.siteId}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (checkPermission("canSelectSites")) {
                      console.log("🖱️ Site button clicked:", site.siteId);
                      handleSiteSelection(site.siteId);
                    }
                  }}
                  variant={
                    selectedSiteId === site.siteId ? "default" : "outline"
                  }
                  disabled={!checkPermission("canSelectSites")}
                  className={`justify-start h-auto p-2 sm:p-3 transition-all duration-200 border-0 text-left ${
                    checkPermission("canSelectSites")
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-60"
                  } ${
                    selectedSiteId === site.siteId
                      ? "ring-1 ring-ring/20 shadow-sm bg-primary text-primary-foreground"
                      : "hover:shadow-sm bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex flex-col items-start w-full min-w-0">
                    <span className="font-semibold text-xs sm:text-sm truncate w-full">
                      {site.siteName}
                    </span>
                    <span
                      className={`text-xs mt-0.5 sm:mt-1 ${
                        selectedSiteId === site.siteId
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {site.data.length} data points
                    </span>
                  </div>
                </Button>
              ))}
            </div>
            {sites.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm sm:text-base mb-2">
                  {connectionStatus === "connected"
                    ? "No sites connected. Waiting for data..."
                    : "No data available. Start the WebSocket server to see analytics data."}
                </p>
              </div>
            )}
            {sites.length > 0 && filteredSites.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm sm:text-base">
                  No sites match your current filters.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Charts */}
        {selectedSite && (
          <div className="space-y-4 sm:space-y-6">
            {/* Top Row - Line Chart Full Width */}
            <Card className="p-2 pb-24 sm:pb-14 md:pb-8 md:p-6 border-0 bg-card/50 shadow-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
                  Page Views Trend
                </h3>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                  Last 50 points
                </span>
              </div>
              <div
                className="h-48 sm:h-56 md:h-72 lg:h-80"
                data-chart="page-views-chart"
              >
                <LineChartComponent data={chartData} dataKey="pageViews" />
              </div>
            </Card>

            {/* Bottom Row - Bar Chart and Heatmap */}
            <div className="space-y-4 sm:space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
              <Card className="p-2 pb-24 sm:pb-14 md:pb-8 md:p-6 border-0 bg-card/50 shadow-sm">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
                    Performance Metrics
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    Load Time (ms)
                  </span>
                </div>
                <div
                  className="h-48 sm:h-56 md:h-72 lg:h-80"
                  data-chart="performance-chart"
                >
                  <BarChartComponent
                    data={barChartData}
                    xAxisKey="time"
                    yAxisKey="loadTime"
                  />
                </div>
              </Card>

              <Card className="p-2 pb-8  md:p-6 border-0 bg-card/50 shadow-sm">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate">
                    <span className="sm:hidden">Top Pages</span>
                    <span className="hidden sm:inline">
                      Top Pages Performance
                    </span>
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded flex-shrink-0">
                    Recent 20 points
                  </span>
                </div>
                <div className="h-72 lg:h-80" data-chart="heatmap-chart">
                  <HeatMapComponent data={selectedSite.data.slice(-20)} />
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Performance Monitor */}
        <Card className="p-3 sm:p-4 md:p-6 border-0 bg-card/50 shadow-sm">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 text-foreground">
            System Performance
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col space-y-1 p-2 sm:p-3 bg-muted/30 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Memory Usage
              </span>
              <span className="text-base sm:text-lg md:text-xl font-bold font-mono text-foreground">
                {Math.round(performanceMetrics.memoryUsage)}
                <span className="text-xs sm:text-sm text-muted-foreground ml-1">
                  MB
                </span>
              </span>
            </div>
            <div className="flex flex-col space-y-1 p-2 sm:p-3 bg-muted/30 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Frame Rate
              </span>
              <span className="text-base sm:text-lg md:text-xl font-bold font-mono text-foreground">
                {Math.round(performanceMetrics.fps)}
                <span className="text-xs sm:text-sm text-muted-foreground ml-1">
                  FPS
                </span>
              </span>
            </div>
            <div className="flex flex-col space-y-1 p-2 sm:p-3 bg-muted/30 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Data Points
              </span>
              <span className="text-base sm:text-lg md:text-xl font-bold font-mono text-primary">
                {performanceMetrics.dataPointsCount.toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
