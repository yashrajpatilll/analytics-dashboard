"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserProfile } from "@/components/ui/UserProfile";
import { ShareModal } from "@/components/sharing/ShareModal";
import { ExportModal } from "@/components/export/ExportModal";
import { AISummaryToggle } from "@/components/ai/AISummaryToggle";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Share2, Download, Eye, Activity, Wifi, WifiOff } from "lucide-react";

interface HeaderProps {
  actualIsSharedView: boolean;
  shareType?: "public" | "member";
  checkPermission: (action: "canSelectSites" | "canApplyFilters" | "canExport" | "canShare" | "canModifySettings") => boolean;
  showShareModal: boolean;
  setShowShareModal: (show: boolean) => void;
  showExportModal: boolean;
  setShowExportModal: (show: boolean) => void;
  userProfileRole?: string;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  performanceMetrics: {
    dataPointsCount: number;
  };
  reconnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  actualIsSharedView,
  shareType,
  checkPermission,
  showShareModal,
  setShowShareModal,
  showExportModal,
  setShowExportModal,
  userProfileRole,
  connectionStatus,
  performanceMetrics,
  reconnect,
}) => {
  const { isEnabled: aiSummaryEnabled, setAISummaryEnabled } = useDashboardStore();
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
    <div className="space-y-4 px-1">
      {/* Mobile: Two rows layout, Desktop: Single row */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {/* Title section */}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Real-time website performance monitoring
          </p>
        </div>

        {/* Controls section - second row on mobile, same row on desktop */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
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

          {/* AI Summary Toggle */}
          <AISummaryToggle
            isEnabled={aiSummaryEnabled}
            onToggle={setAISummaryEnabled}
          />

          {/* Shared View Indicator */}
          {actualIsSharedView && (
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
        userRole={(userProfileRole as "Admin" | "Analyst" | "Viewer") || "Admin"}
      />

      {/* Third row: Connection Status and Data Points */}
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
  );
};