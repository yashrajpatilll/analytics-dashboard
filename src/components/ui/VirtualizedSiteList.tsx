'use client';

import React, { useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Site } from '@/types/analytics';
import { useDashboardStore } from '@/stores/dashboardStore';

interface VirtualizedSiteListProps {
  sites: Site[];
  selectedSiteId: string | null;
  onSiteSelect: (siteId: string) => void;
  height?: number;
  itemHeight?: number;
  searchQuery?: string;
  sortBy?: 'name' | 'lastUpdated' | 'dataCount';
  sortOrder?: 'asc' | 'desc';
}

interface SiteItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    sites: Site[];
    selectedSiteId: string | null;
    onSiteSelect: (siteId: string) => void;
  };
}

const SiteItem: React.FC<SiteItemProps> = ({ index, style, data }) => {
  const { sites, selectedSiteId, onSiteSelect } = data;
  const site = sites[index];
  
  if (!site) return null;

  const isSelected = selectedSiteId === site.siteId;
  const lastDataPoint = site.data[site.data.length - 1];
  const dataCount = site.data.length;

  return (
    <div
      style={style}
      className={`
        flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700
        hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
      `}
      onClick={() => onSiteSelect(site.siteId)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              dataCount > 0 ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {site.siteName}
          </h3>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
          <span>{dataCount} data points</span>
          {lastDataPoint && (
            <>
              <span>•</span>
              <span>{lastDataPoint.pageViews.toLocaleString()} views</span>
              <span>•</span>
              <span>Updated {new Date(site.lastUpdated).toLocaleTimeString()}</span>
            </>
          )}
        </div>
      </div>
      
      {lastDataPoint && (
        <div className="flex flex-col items-end text-sm">
          <div className="text-gray-900 dark:text-gray-100 font-medium">
            {lastDataPoint.uniqueVisitors.toLocaleString()}
          </div>
          <div className="text-gray-500 dark:text-gray-400">visitors</div>
        </div>
      )}
    </div>
  );
};

export const VirtualizedSiteList: React.FC<VirtualizedSiteListProps> = ({
  sites,
  selectedSiteId,
  onSiteSelect,
  height = 400,
  itemHeight = 80,
  searchQuery = '',
  sortBy = 'name',
  sortOrder = 'asc'
}) => {
  const filteredAndSortedSites = useMemo(() => {
    let filtered = sites;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = sites.filter(site => 
        site.siteName.toLowerCase().includes(query) ||
        site.siteId.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.siteName.toLowerCase();
          bValue = b.siteName.toLowerCase();
          break;
        case 'lastUpdated':
          aValue = new Date(a.lastUpdated).getTime();
          bValue = new Date(b.lastUpdated).getTime();
          break;
        case 'dataCount':
          aValue = a.data.length;
          bValue = b.data.length;
          break;
        default:
          aValue = a.siteName.toLowerCase();
          bValue = b.siteName.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [sites, searchQuery, sortBy, sortOrder]);

  const itemData = {
    sites: filteredAndSortedSites,
    selectedSiteId,
    onSiteSelect
  };

  if (filteredAndSortedSites.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
        {searchQuery ? 'No sites match your search' : 'No sites available'}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <List
        height={height}
        width="100%"
        itemCount={filteredAndSortedSites.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5}
      >
        {SiteItem}
      </List>
    </div>
  );
};