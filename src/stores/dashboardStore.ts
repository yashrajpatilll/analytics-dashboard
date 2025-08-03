import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AnalyticsDataPoint, Site, DashboardState, FilterState, ExportState } from '@/types/analytics';

// Sharing state interface
interface SharingState {
  isSharedView: boolean;
  shareType: 'public' | 'member' | null;
  sharedViewRestrictions: {
    canSelectSites: boolean;
    canApplyFilters: boolean;
    canExport: boolean;
    canShare: boolean;
    canModifySettings: boolean;
  };
  originalState?: {
    selectedSiteId: string | null;
    filters: FilterState;
    dateRange: { start: Date; end: Date } | null;
  };
  pendingSelectedSiteId?: string | null; // For deferred site selection
}

interface DashboardActions {
  addDataPoint: (dataPoint: AnalyticsDataPoint) => void;
  setSelectedSite: (siteId: string | null, force?: boolean) => void; // Add force parameter
  setPendingSelectedSite: (siteId: string | null) => void; // Add pending site action
  setConnectionStatus: (status: DashboardState['connectionStatus']) => void;
  updatePerformanceMetrics: (metrics: Partial<DashboardState['performanceMetrics']>) => void;
  pruneOldData: (maxAge: number) => void;
  // Filter actions
  updateFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setFilters: (filters: FilterState) => void;
  setDateRange: (dateRange: { start: Date; end: Date } | null) => void;
  // Export actions
  setExportState: (exportState: Partial<ExportState>) => void;
  resetExportState: () => void;
  // Sharing actions
  setIsSharedView: (isShared: boolean, shareType?: 'public' | 'member') => void;
  exitSharedView: () => void;
  checkPermission: (action: keyof SharingState['sharedViewRestrictions']) => boolean;
}

type DashboardStore = DashboardState & SharingState & DashboardActions;

const MAX_DATA_POINTS_PER_SITE = 1000; // Prevent memory leaks

const defaultFilters: FilterState = {
  searchQuery: '',
  sortBy: 'name' as const,
  sortOrder: 'asc' as const
};

const defaultSharingState: SharingState = {
  isSharedView: false,
  shareType: null,
  sharedViewRestrictions: {
    canSelectSites: true,
    canApplyFilters: true,
    canExport: true,
    canShare: true,
    canModifySettings: true
  },
  originalState: undefined,
  pendingSelectedSiteId: undefined
};

export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set, get) => ({
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
      // Export state
      exportState: {
        isExporting: false,
        progress: 0,
        error: null,
        downloadUrl: null
      },
      // Sharing state
      ...defaultSharingState,
      // Add missing dateRange property
      dateRange: null,
      // Computed selectedSite property
      get selectedSite() {
        const state = get();
        return state.sites.find(site => site.siteId === state.selectedSiteId) || null;
      },

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

          // Check if we have a pending site selection to restore
          let selectedSiteId = state.selectedSiteId;
          if (state.pendingSelectedSiteId && updatedSites.some(site => site.siteId === state.pendingSelectedSiteId)) {
            selectedSiteId = state.pendingSelectedSiteId;
            console.log('✅ Restoring pending site selection:', state.pendingSelectedSiteId);
            console.log('📍 Site found in updated sites:', updatedSites.find(site => site.siteId === state.pendingSelectedSiteId)?.siteName);
          } else if (state.pendingSelectedSiteId) {
            console.log('❌ Pending site not found in updated sites:', state.pendingSelectedSiteId);
            console.log('📋 Available sites:', updatedSites.map(s => s.siteId));
          }

          return {
            sites: updatedSites,
            selectedSiteId,
            pendingSelectedSiteId: selectedSiteId === state.pendingSelectedSiteId ? undefined : state.pendingSelectedSiteId,
            isConnected: true,
            performanceMetrics: {
              ...state.performanceMetrics,
              dataPointsCount: totalDataPoints
            }
          };
        });
      },

      setSelectedSite: (siteId: string | null, force?: boolean) => {
        set((state) => {
          // Check permission for site selection in shared view (unless forced)
          if (!force && state.isSharedView && !state.sharedViewRestrictions.canSelectSites) {
            console.warn('❌ Cannot select sites in shared view-only mode');
            return state; // Return unchanged state
          }
          
          console.log('🏪 Store setSelectedSite called:', {
            oldSiteId: state.selectedSiteId,
            newSiteId: siteId,
            sitesAvailable: state.sites.length,
            force: !!force,
            isSharedView: state.isSharedView,
            canSelectSites: state.sharedViewRestrictions.canSelectSites
          });

          // Check if the site exists in the current sites array
          const siteExists = siteId ? state.sites.some(site => site.siteId === siteId) : true;
          
          if (siteExists || !siteId) {
            // Site exists or we're clearing selection
            console.log('✅ Setting site selection to:', siteId);
            return { 
              selectedSiteId: siteId,
              pendingSelectedSiteId: undefined 
            };
          } else {
            // Site doesn't exist yet, store as pending
            console.log('🔄 Site not found, storing as pending selection:', siteId);
            return { 
              pendingSelectedSiteId: siteId 
            };
          }
        });
      },

      setPendingSelectedSite: (siteId: string | null) => {
        set((state) => {
          console.log('🔄 Setting pending selected site:', siteId);
          return { 
            pendingSelectedSiteId: siteId 
          };
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
      },

      // Export actions
      setExportState: (exportState: Partial<ExportState>) => {
        set((state) => ({
          exportState: {
            ...state.exportState,
            ...exportState
          }
        }));
      },

      resetExportState: () => {
        set({
          exportState: {
            isExporting: false,
            progress: 0,
            error: null,
            downloadUrl: null
          }
        });
      },

      // New filter and date range actions
      setFilters: (filters: FilterState) => {
        const state = get();
        if (state.isSharedView && !state.sharedViewRestrictions.canApplyFilters) {
          console.warn('Cannot update filters in shared view-only mode');
          return;
        }
        set({ filters });
      },

      setDateRange: (dateRange: { start: Date; end: Date } | null) => {
        const state = get();
        if (state.isSharedView && !state.sharedViewRestrictions.canApplyFilters) {
          console.warn('Cannot update date range in shared view-only mode');
          return;
        }
        set({ dateRange });
      },

      // Sharing actions
      setIsSharedView: (isShared: boolean, shareType?: 'public' | 'member') => {
        set((state) => {
          if (isShared) {
            // Store original state when entering shared view
            const originalState = {
              selectedSiteId: state.selectedSiteId,
              filters: state.filters,
              dateRange: state.dateRange
            };

            const restrictions = {
              canSelectSites: shareType === 'member', // Only members can select sites
              canApplyFilters: shareType === 'member', // Only members can filter
              canExport: shareType === 'member', // Only members can export
              canShare: shareType === 'member', // Only members can share
              canModifySettings: shareType === 'member' // Only members can modify
            };

            console.log('🔄 Setting shared view:', { shareType, restrictions });

            return {
              isSharedView: true,
              shareType: shareType || null,
              sharedViewRestrictions: restrictions,
              originalState
            };
          } else {
            // Restore original state when exiting shared view
            return {
              ...defaultSharingState,
              selectedSiteId: state.originalState?.selectedSiteId || state.selectedSiteId,
              filters: state.originalState?.filters || state.filters,
              dateRange: state.originalState?.dateRange || state.dateRange
            };
          }
        });
      },

      exitSharedView: () => {
        set((state) => ({
          ...defaultSharingState,
          selectedSiteId: state.originalState?.selectedSiteId || state.selectedSiteId,
          filters: state.originalState?.filters || state.filters,
          dateRange: state.originalState?.dateRange || state.dateRange
        }));
      },

      checkPermission: (action: keyof SharingState['sharedViewRestrictions']) => {
        const state = get();
        if (!state.isSharedView) return true;
        return state.sharedViewRestrictions[action];
      }
    }),
    {
      name: 'dashboard-store'
    }
  )
);