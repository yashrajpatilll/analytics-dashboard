import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AnalyticsDataPoint, Site, DashboardState, FilterState } from '@/types/analytics';

interface DashboardActions {
  addDataPoint: (dataPoint: AnalyticsDataPoint) => void;
  setSelectedSite: (siteId: string | null) => void;
  setConnectionStatus: (status: DashboardState['connectionStatus']) => void;
  updatePerformanceMetrics: (metrics: Partial<DashboardState['performanceMetrics']>) => void;
  pruneOldData: (maxAge: number) => void;
  // Filter actions
  updateFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

type DashboardStore = DashboardState & DashboardActions;

const MAX_DATA_POINTS_PER_SITE = 1000; // Prevent memory leaks

const defaultFilters: FilterState = {
  searchQuery: '',
  sortBy: 'name' as const,
  sortOrder: 'asc' as const
};

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set) => ({
      // Initial state
      sites: [],
      selectedSiteId: null,
      isConnected: false,
      connectionStatus: 'disconnected',
      performanceMetrics: {
        memoryUsage: 0,
        fps: 0,
        dataPointsCount: 0
      },
      // Filter state
      filters: defaultFilters,

      // Actions
      addDataPoint: (dataPoint: AnalyticsDataPoint) => {
        set((state) => {
          const existingSiteIndex = state.sites.findIndex(
            site => site.siteId === dataPoint.siteId
          );

          let updatedSites: Site[];

          if (existingSiteIndex >= 0) {
            // Update existing site
            const existingSite = state.sites[existingSiteIndex];
            const updatedData = [...existingSite.data, dataPoint];
            
            // Prune old data if we exceed max data points
            const prunedData = updatedData.length > MAX_DATA_POINTS_PER_SITE
              ? updatedData.slice(-MAX_DATA_POINTS_PER_SITE)
              : updatedData;

            updatedSites = state.sites.map((site, index) =>
              index === existingSiteIndex
                ? {
                    ...site,
                    data: prunedData,
                    lastUpdated: dataPoint.timestamp
                  }
                : site
            );
          } else {
            // Add new site
            const newSite: Site = {
              siteId: dataPoint.siteId,
              siteName: dataPoint.siteName,
              data: [dataPoint],
              lastUpdated: dataPoint.timestamp
            };
            updatedSites = [...state.sites, newSite];
          }

          // Calculate total data points
          const totalDataPoints = updatedSites.reduce(
            (total, site) => total + site.data.length,
            0
          );

          return {
            sites: updatedSites,
            isConnected: true,
            performanceMetrics: {
              ...state.performanceMetrics,
              dataPointsCount: totalDataPoints
            }
          };
        });
      },

      setSelectedSite: (siteId: string | null) => {
        set((state) => {
          console.log('🏪 Store setSelectedSite called:', {
            oldSiteId: state.selectedSiteId,
            newSiteId: siteId
          });
          return { selectedSiteId: siteId };
        });
      },

      setConnectionStatus: (status: DashboardState['connectionStatus']) => {
        set({ 
          connectionStatus: status,
          isConnected: status === 'connected'
        });
      },

      updatePerformanceMetrics: (metrics: Partial<DashboardState['performanceMetrics']>) => {
        set((state) => ({
          performanceMetrics: {
            ...state.performanceMetrics,
            ...metrics
          }
        }));
      },

      pruneOldData: (maxAge: number) => {
        const cutoffTime = Date.now() - maxAge;
        
        set((state) => ({
          sites: state.sites.map(site => ({
            ...site,
            data: site.data.filter(
              dataPoint => new Date(dataPoint.timestamp).getTime() > cutoffTime
            )
          }))
        }));
      },

      // Filter actions
      updateFilters: (filters: Partial<FilterState>) => {
        set((state) => {
          const newFilters = { ...state.filters, ...filters };
          console.log('🏪 Store updateFilters called:', {
            oldFilters: state.filters,
            updates: filters,
            newFilters
          });
          return {
            filters: newFilters
          };
        });
      },

      resetFilters: () => {
        set({ filters: defaultFilters });
      }
    }),
    {
      name: 'dashboard-store'
    }
  )
);