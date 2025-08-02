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

  // Sync from URL parameters on mount and URL changes
  useEffect(() => {
    const urlSelectedSite = searchParams.get('selectedSite');
    const urlSearchQuery = searchParams.get('searchQuery') || '';
    const urlSortBy = searchParams.get('sortBy') as 'name' | 'lastUpdated' | 'dataCount' || 'name';
    const urlSortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc';
    const urlDateStart = searchParams.get('dateStart') || undefined;
    const urlDateEnd = searchParams.get('dateEnd') || undefined;

    // Only update if URL has explicit values (don't override with null)
    if (urlSelectedSite && urlSelectedSite !== selectedSiteId) {
      setSelectedSite(urlSelectedSite);
    }

    // Update filters if they're different from URL
    const newFilters: Partial<FilterState> = {};
    let hasChanges = false;

    if (filters.searchQuery !== urlSearchQuery) {
      newFilters.searchQuery = urlSearchQuery;
      hasChanges = true;
    }

    if (filters.sortBy !== urlSortBy) {
      newFilters.sortBy = urlSortBy;
      hasChanges = true;
    }

    if (filters.sortOrder !== urlSortOrder) {
      newFilters.sortOrder = urlSortOrder;
      hasChanges = true;
    }

    if (urlDateStart && urlDateEnd) {
      const urlDateRange = { start: urlDateStart, end: urlDateEnd };
      if (JSON.stringify(filters.dateRange) !== JSON.stringify(urlDateRange)) {
        newFilters.dateRange = urlDateRange;
        hasChanges = true;
      }
    } else if (filters.dateRange) {
      newFilters.dateRange = undefined;
      hasChanges = true;
    }

    if (hasChanges) {
      updateFilters(newFilters);
    }
  }, [searchParams, selectedSiteId, filters, setSelectedSite, updateFilters]);

  // Update URL when store state changes
  useEffect(() => {
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