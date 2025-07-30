import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AnalyticsDataPoint, Site, DashboardState } from '@/types/analytics';

interface DashboardActions {
  addDataPoint: (dataPoint: AnalyticsDataPoint) => void;
  setSelectedSite: (siteId: string | null) => void;
  setConnectionStatus: (status: DashboardState['connectionStatus']) => void;
  updatePerformanceMetrics: (metrics: Partial<DashboardState['performanceMetrics']>) => void;
  pruneOldData: (maxAge: number) => void;
}

type DashboardStore = DashboardState & DashboardActions;

const MAX_DATA_POINTS_PER_SITE = 1000; // Prevent memory leaks

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

      // Actions
      addDataPoint: (dataPoint: AnalyticsDataPoint) => {
        set((state) => {
          // Throttle updates to prevent excessive re-renders
          const now = Date.now();
          const lastUpdate = state.performanceMetrics.lastUpdateTime || 0;
          
          // Limit updates to max 5 per second to reduce memory pressure
          if (now - lastUpdate < 200) {
            return state; // Skip this update
          }

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

          // Update performance metrics
          const totalDataPoints = updatedSites.reduce(
            (total, site) => total + site.data.length,
            0
          );

          return {
            sites: updatedSites,
            isConnected: true,
            performanceMetrics: {
              ...state.performanceMetrics,
              dataPointsCount: totalDataPoints,
              lastUpdateTime: now
            }
          };
        });
      },

      setSelectedSite: (siteId: string | null) => {
        set({ selectedSiteId: siteId });
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
      }
    }),
    {
      name: 'dashboard-store'
    }
  )
);