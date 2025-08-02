'use client';

import { useEffect, useCallback, useRef } from 'react';
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
}

export const useURLState = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    filters, 
    selectedSiteId, 
    updateFilters, 
    setSelectedSite
  } = useDashboardStore();

  // Track if we're currently syncing to prevent infinite loops
  const isSyncingRef = useRef(false);
  const lastUrlStateRef = useRef<string>('');
  const lastStoreStateRef = useRef<string>('');

  // Update URL when state changes (debounced)
  const updateURL = useCallback((updates: Partial<URLStateParams>) => {
    if (isSyncingRef.current) return;
    
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

  // Sync from URL parameters ONLY on mount and when URL actually changes
  useEffect(() => {
    const currentUrlState = searchParams.toString();
    
    // Skip if this is the same URL state we just processed
    if (currentUrlState === lastUrlStateRef.current) {
      return;
    }
    
    // Skip if we're currently syncing
    if (isSyncingRef.current) {
      return;
    }

    console.log('🔄 URL state changed, syncing FROM URL to store');
    isSyncingRef.current = true;
    lastUrlStateRef.current = currentUrlState;

    const urlSelectedSite = searchParams.get('selectedSite');
    const urlSearchQuery = searchParams.get('searchQuery') || '';
    const urlSortBy = searchParams.get('sortBy') as 'name' | 'lastUpdated' | 'dataCount' || 'name';
    const urlSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc';
    const urlDateStart = searchParams.get('dateStart') || undefined;
    const urlDateEnd = searchParams.get('dateEnd') || undefined;

    // Only update if URL has explicit values and they differ from current state
    if (urlSelectedSite && urlSelectedSite !== selectedSiteId) {
      console.log('🎯 Syncing selectedSite from URL:', urlSelectedSite);
      setSelectedSite(urlSelectedSite);
    }

    // Update filters if they're different from URL
    const newFilters: Partial<FilterState> = {};
    let hasChanges = false;

    if (filters.searchQuery !== urlSearchQuery) {
      console.log('🔍 Syncing searchQuery from URL:', urlSearchQuery);
      newFilters.searchQuery = urlSearchQuery;
      hasChanges = true;
    }

    if (filters.sortBy !== urlSortBy) {
      console.log('🔧 Syncing sortBy from URL:', urlSortBy);
      newFilters.sortBy = urlSortBy;
      hasChanges = true;
    }

    if (filters.sortOrder !== urlSortOrder) {
      console.log('🔧 Syncing sortOrder from URL:', urlSortOrder);
      newFilters.sortOrder = urlSortOrder;
      hasChanges = true;
    }

    if (urlDateStart && urlDateEnd) {
      const urlDateRange = { start: urlDateStart, end: urlDateEnd };
      if (JSON.stringify(filters.dateRange) !== JSON.stringify(urlDateRange)) {
        console.log('📅 Syncing dateRange from URL:', urlDateRange);
        newFilters.dateRange = urlDateRange;
        hasChanges = true;
      }
    } else if (filters.dateRange) {
      console.log('📅 Clearing dateRange from URL');
      newFilters.dateRange = undefined;
      hasChanges = true;
    }

    if (hasChanges) {
      updateFilters(newFilters);
    }

    // Reset sync flag after a short delay to allow state to settle
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 50);
  }, [searchParams]); // Only depend on searchParams, not store state

  // Update URL when store state changes (with sync guard)
  useEffect(() => {
    const currentStoreState = JSON.stringify({ selectedSiteId, filters });
    
    // Skip if this is the same store state we just processed
    if (currentStoreState === lastStoreStateRef.current) {
      return;
    }
    
    // Skip if we're currently syncing from URL
    if (isSyncingRef.current) {
      return;
    }

    console.log('🔄 Store state changed, syncing FROM store to URL');
    lastStoreStateRef.current = currentStoreState;

    const updates: Partial<URLStateParams> = {
      selectedSite: selectedSiteId || undefined,
      searchQuery: filters.searchQuery || undefined,
      sortBy: filters.sortBy !== 'name' ? filters.sortBy : undefined,
      sortOrder: filters.sortOrder !== 'asc' ? filters.sortOrder : undefined,
      dateStart: filters.dateRange?.start,
      dateEnd: filters.dateRange?.end
    };

    updateURL(updates);
  }, [selectedSiteId, filters, updateURL]);

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

    return `${baseURL}?${params.toString()}`;
  }, [selectedSiteId, filters]);

  return {
    generateShareableURL
  };
};