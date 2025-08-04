'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AIInsight, AIAnalysisContext } from '@/types/ai';
import { aiSummaryService } from '@/lib/aiSummaryService';
import { useDashboardStore } from '@/stores/dashboardStore';

interface UseAISummaryOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export function useAISummary(options: UseAISummaryOptions = {}) {
  const { autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isGeneratingRef = useRef(false);

  // Get data from dashboard store
  const { selectedSiteId, sites, selectedSite } = useDashboardStore();

  const generateAnalysisContext = useCallback((): AIAnalysisContext | null => {
    // If we have a selectedSiteId but no selectedSite, create mock context for demo
    if (selectedSiteId && !selectedSite && sites.length > 0) {
      const mockSite = sites[0]; // Use first available site as template
      return {
        selectedSiteId,
        recentData: mockSite.data.slice(-30),
        timeWindow: 30,
        currentMetrics: {
          pageViews: mockSite.data[mockSite.data.length - 1]?.pageViews || 150,
          uniqueVisitors: mockSite.data[mockSite.data.length - 1]?.uniqueVisitors || 45,
          bounceRate: mockSite.data[mockSite.data.length - 1]?.bounceRate || 0.3,
          avgLoadTime: mockSite.data[mockSite.data.length - 1]?.performanceMetrics?.loadTime || 2.1
        }
      };
    }
    
    if (!selectedSiteId || !selectedSite || !selectedSite.data.length) {
      return null;
    }

    const recentData = selectedSite.data.slice(-30); // Last 30 data points
    const latestData = recentData[recentData.length - 1];

    if (!latestData) return null;

    return {
      selectedSiteId,
      recentData,
      timeWindow: 30, // 30 minutes
      currentMetrics: {
        pageViews: latestData.pageViews,
        uniqueVisitors: latestData.uniqueVisitors,
        bounceRate: latestData.bounceRate,
        avgLoadTime: latestData.performanceMetrics.loadTime
      }
    };
  }, [selectedSiteId, selectedSite]);

  const generateInsight = useCallback(async (force: boolean = false) => {
    // Prevent concurrent generations
    if (isGeneratingRef.current && !force) {
      return;
    }

    const context = generateAnalysisContext();
    
    if (!context) {
      setCurrentInsight(null);
      setError(null);
      return;
    }

    try {
      isGeneratingRef.current = true;
      setIsGenerating(true);
      setError(null);

      const insight = await aiSummaryService.getStreamingInsight(context);
      
      setCurrentInsight(insight);
      setLastGenerated(new Date());
    } catch (err) {
      console.error('Failed to generate AI insight:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insight');
      setCurrentInsight(null);
    } finally {
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [generateAnalysisContext]);

  const scheduleNextRefresh = useCallback(() => {
    if (!autoRefresh) return;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      if (!isGeneratingRef.current) {
        generateInsight();
      }
    }, refreshInterval);
  }, [autoRefresh, refreshInterval, generateInsight]);

  // Generate initial insight when site selection changes
  useEffect(() => {
    generateInsight();
  }, [selectedSiteId, generateInsight]);

  // Schedule periodic refreshes
  useEffect(() => {
    if (autoRefresh && currentInsight) {
      scheduleNextRefresh();
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [currentInsight, scheduleNextRefresh, autoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const refresh = useCallback(() => {
    generateInsight(true);
  }, [generateInsight]);

  return {
    currentInsight,
    isGenerating,
    error,
    lastGenerated,
    refresh,
    hasData: selectedSiteId !== null && sites.length > 0 // Has data if we have a selected site and available sites
  };
}