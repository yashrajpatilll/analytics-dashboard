"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StreamingText } from "./StreamingText";
import { useAISummary } from "@/hooks/useAISummary";
import { useDashboardStore } from "@/stores/dashboardStore";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  Target,
  Brain,
} from "lucide-react";

interface AISummaryProps {
  className?: string;
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case "performance":
      return <Zap className="w-4 h-4" />;
    case "traffic":
      return <TrendingUp className="w-4 h-4" />;
    case "user_behavior":
      return <Users className="w-4 h-4" />;
    case "recommendation":
      return <Target className="w-4 h-4" />;
    case "alert":
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Brain className="w-4 h-4" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "high":
      return "rgb(var(--ai-insight-high))";
    case "medium":
      return "rgb(var(--ai-insight-medium))";
    case "low":
      return "rgb(var(--ai-insight-low))";
    default:
      return "rgb(var(--ai-insight-info))";
  }
};

export const AISummary: React.FC<AISummaryProps> = ({ className = "" }) => {
  const { isEnabled } = useDashboardStore();
  const { currentInsight, isGenerating, error, refresh, hasData } =
    useAISummary();

  if (!isEnabled) {
    return null;
  }

  return (
    <Card
      className={`hidden lg:block border-0 gap-4 py-2 bg-card/50 shadow-sm ${className}`}
    >
      <CardHeader className="pb-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Insights
            <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full">
              Beta
            </span>
          </CardTitle>
          <CardAction>
            <Button
              onClick={refresh}
              variant="ghost"
              size="sm"
              disabled={isGenerating || !hasData}
              className="flex items-center gap-1"
            >
              <RefreshCw
                className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="pt-0 p-4">
        {error ? (
          // Error State
          <div className="flex items-center gap-3 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Analysis Failed
              </p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : !hasData ? (
          // No Data State
          <div className="flex items-center gap-3 p-4 border border-dashed border-muted rounded-lg bg-muted/60">
            <Brain className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Waiting for Data
              </p>
              <p className="text-xs text-muted-foreground">
                Select a site to receive AI insights.
              </p>
            </div>
          </div>
        ) : isGenerating ? (
          // Loading State
          <div className="flex items-center gap-3 p-4 border border-primary/20 rounded-lg bg-primary/5">
            <RefreshCw className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Analyzing data...
              </p>
              <div className="h-1 w-24 bg-muted/50 rounded-full overflow-hidden">
                <div className="h-full bg-primary/60 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        ) : currentInsight ? (
          // Insight Display
          <div
            className="p-4 rounded-lg border-l-2 bg-muted/40 border border-muted"
            style={{
              borderLeftColor: getSeverityColor(currentInsight.severity),
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 mt-0.5 w-4 h-4 opacity-90"
                style={{ color: getSeverityColor(currentInsight.severity) }}
              >
                {getInsightIcon(currentInsight.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {currentInsight.title}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground uppercase font-medium">
                    {currentInsight.type.replace("_", " ")}
                  </span>
                </div>
                <div className="text-sm text-foreground/90 leading-relaxed mb-3">
                  <StreamingText
                    text={currentInsight.description}
                    isActive={!isGenerating}
                    speed={2}
                    showCursor={true}
                  />
                </div>
                <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>
                      Confidence: {Math.round(currentInsight.confidence * 100)}%
                    </span>
                    {currentInsight.actionable && (
                      <span className="flex items-center gap-1 opacity-80">
                        <Target className="w-3 h-3" />
                        Actionable
                      </span>
                    )}
                  </div>
                  <span>
                    {new Date(currentInsight.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Beta Notice */}
        <div className="pt-3">
          <p className="text-xs text-muted-foreground/60 text-center">
            Experimental feature for demonstration
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
