'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDashboardStore } from '@/stores/dashboardStore';
import { FilterState } from '@/types/analytics';

interface URLStateParams {
  selectedSite?: string;
  searchQuery?: string;
  sortBy?: 'name' | 'lastUpdated' | 'dataCount';
  sortOrder?: 'asc' | 'desc';
  dateStart?: string;
  dateEnd?: string;
  sessionId?: string;
}

export const useURLState = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    filters, 
    selectedSiteId, 
    sessionId,
    updateFilters, 
    setSelectedSite,
    setSharedSession,
    clearSharedSession
  } = useDashboardStore();

  // Update URL when state changes
  const updateURL = useCallback((updates: Partial<URLStateParams>) => {
    const params = new URLSearchParams(searchParams);
    
    // Update or remove parameters
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    // Create new URL
    const newURL = `${window.location.pathname}?${params.toString()}`;
    router.replace(newURL, { scroll: false });
  }, [router, searchParams]);

  // Parse URL parameters and update state
  const syncFromURL = useCallback(() => {
    const urlSelectedSite = searchParams.get('selectedSite');
    const urlSearchQuery = searchParams.get('searchQuery') || '';
    const urlSortBy = searchParams.get('sortBy') as 'name' | 'lastUpdated' | 'dataCount' || 'name';
    const urlSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc';
    const urlDateStart = searchParams.get('dateStart') || undefined;
    const urlDateEnd = searchParams.get('dateEnd') || undefined;
    const urlSessionId = searchParams.get('sessionId');

    // Update selected site if different
    if (urlSelectedSite !== selectedSiteId) {
      setSelectedSite(urlSelectedSite);
    }

    // Update filters if different
    const newFilters: Partial<FilterState> = {
      searchQuery: urlSearchQuery,
      sortBy: urlSortBy,
      sortOrder: urlSortOrder
    };

    if (urlDateStart && urlDateEnd) {
      newFilters.dateRange = {
        start: urlDateStart,
        end: urlDateEnd
      };
    } else if (filters.dateRange) {
      newFilters.dateRange = undefined;
    }

    // Check if filters actually changed
    const filtersChanged = 
      filters.searchQuery !== newFilters.searchQuery ||
      filters.sortBy !== newFilters.sortBy ||
      filters.sortOrder !== newFilters.sortOrder ||
      JSON.stringify(filters.dateRange) !== JSON.stringify(newFilters.dateRange);

    if (filtersChanged) {
      updateFilters(newFilters);
    }

    // Handle session ID
    if (urlSessionId && urlSessionId !== sessionId) {
      setSharedSession(urlSessionId);
    } else if (!urlSessionId && sessionId) {
      clearSharedSession();
    }
  }, [
    searchParams, 
    selectedSiteId, 
    filters, 
    sessionId,
    setSelectedSite, 
    updateFilters, 
    setSharedSession, 
    clearSharedSession
  ]);

  // Update URL when store state changes
  useEffect(() => {
    const updates: Partial<URLStateParams> = {
      selectedSite: selectedSiteId || undefined,
      searchQuery: filters.searchQuery || undefined,
      sortBy: filters.sortBy !== 'name' ? filters.sortBy : undefined,
      sortOrder: filters.sortOrder !== 'asc' ? filters.sortOrder : undefined,
      dateStart: filters.dateRange?.start,
      dateEnd: filters.dateRange?.end,
      sessionId: sessionId || undefined
    };

    updateURL(updates);
  }, [selectedSiteId, filters, sessionId, updateURL]);

  // Sync from URL on mount and URL changes
  useEffect(() => {
    syncFromURL();
  }, [syncFromURL]);

  // Generate shareable URL
  const generateShareableURL = useCallback(() => {
    const baseURL = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();

    if (selectedSiteId) params.set('selectedSite', selectedSiteId);
    if (filters.searchQuery) params.set('searchQuery', filters.searchQuery);
    if (filters.sortBy !== 'name') params.set('sortBy', filters.sortBy);
    if (filters.sortOrder !== 'asc') params.set('sortOrder', filters.sortOrder);
    if (filters.dateRange) {
      params.set('dateStart', filters.dateRange.start);
      params.set('dateEnd', filters.dateRange.end);
    }
    if (sessionId) params.set('sessionId', sessionId);

    return `${baseURL}?${params.toString()}`;
  }, [selectedSiteId, filters, sessionId]);

  // Start collaborative session
  const startCollaborativeSession = useCallback(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSharedSession(newSessionId);
    return generateShareableURL();
  }, [setSharedSession, generateShareableURL]);

  return {
    generateShareableURL,
    startCollaborativeSession,
    isSharedSession: !!sessionId
  };
};