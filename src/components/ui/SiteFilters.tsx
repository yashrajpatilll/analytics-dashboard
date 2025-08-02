'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Search, Filter, X } from 'lucide-react';

export const SiteFilters: React.FC = () => {
  const { filters, updateFilters, resetFilters } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    console.log('🔍 Search change handler called:', value);
    updateFilters({ searchQuery: value });
  };

  const handleSortChange = (sortBy: 'name' | 'lastUpdated' | 'dataCount', sortOrder: 'asc' | 'desc') => {
    console.log('🔧 Sort change handler called:', sortBy, sortOrder);
    updateFilters({ sortBy, sortOrder });
  };

  const hasActiveFilters = filters.searchQuery || filters.sortBy !== 'name' || filters.sortOrder !== 'asc';

  return (
    <div className="flex items-center gap-3" style={{ position: 'relative', zIndex: 10 }}>
      {/* Search Input */}
      <div className="relative w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search sites..."
          value={filters.searchQuery || ''}
          onChange={(e) => {
            console.log('🔍 Input onChange triggered:', e.target.value);
            handleSearchChange(e.target.value);
          }}
          onInput={(e) => {
            console.log('🔍 Input onInput triggered:', (e.target as HTMLInputElement).value);
          }}
          onFocus={() => console.log('🔍 Search input focused')}
          onBlur={() => console.log('🔍 Search input blurred')}
          className="block w-full pl-10 pr-10 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          autoComplete="off"
          tabIndex={0}
        />
        {filters.searchQuery && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={() => {
                console.log('🔍 Clear button clicked');
                handleSearchChange('');
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sort Button */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔧 Sort button clicked, current state:', isOpen);
            setIsOpen(!isOpen);
          }}
          className={`inline-flex items-center px-3 py-2 border border-border rounded-md text-sm font-medium bg-background text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary ${
            hasActiveFilters ? 'border-primary bg-primary/5' : ''
          }`}
          tabIndex={0}
        >
          <Filter className="h-4 w-4 mr-2" />
          Sort
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => {
                console.log('🔧 Backdrop clicked, closing dropdown');
                setIsOpen(false);
              }}
            />
            <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-md shadow-lg z-50">
              <div className="py-1">
                <div className="px-3 py-2 text-sm font-medium text-foreground border-b border-border">
                  Sort by
                </div>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔧 Sort by name clicked');
                    handleSortChange('name', filters.sortOrder);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-muted ${
                    filters.sortBy === 'name' ? 'bg-primary/10 text-primary' : 'text-foreground'
                  }`}
                >
                  Site Name
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔧 Sort by lastUpdated clicked');
                    handleSortChange('lastUpdated', filters.sortOrder);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-muted ${
                    filters.sortBy === 'lastUpdated' ? 'bg-primary/10 text-primary' : 'text-foreground'
                  }`}
                >
                  Last Updated
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔧 Sort by dataCount clicked');
                    handleSortChange('dataCount', filters.sortOrder);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-muted ${
                    filters.sortBy === 'dataCount' ? 'bg-primary/10 text-primary' : 'text-foreground'
                  }`}
                >
                  Data Points
                </button>
                <div className="border-t border-border mt-1 pt-1">
                  <div className="px-3 py-2 text-sm font-medium text-foreground">Order</div>
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('🔧 Sort order ASC clicked');
                        handleSortChange(filters.sortBy, 'asc');
                        setIsOpen(false);
                      }}
                      className={`flex-1 px-3 py-2 text-xs hover:bg-muted ${
                        filters.sortOrder === 'asc' ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                    >
                      A-Z
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('🔧 Sort order DESC clicked');
                        handleSortChange(filters.sortBy, 'desc');
                        setIsOpen(false);
                      }}
                      className={`flex-1 px-3 py-2 text-xs hover:bg-muted ${
                        filters.sortOrder === 'desc' ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                    >
                      Z-A
                    </button>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('🔧 Reset filters clicked');
                        resetFilters();
                        setIsOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};