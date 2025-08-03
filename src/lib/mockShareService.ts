// Mock ShareService for testing without database
import { DashboardState, ShareConfig, SharedDashboard } from './shareService';

export class MockShareService {
  static async createShare(
    dashboardState: DashboardState,
    config: ShareConfig
  ): Promise<string> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock share ID
    const shareId = Math.random().toString(36).substring(2, 15);
    
    // Store in localStorage for demo purposes
    localStorage.setItem(`share_${shareId}`, JSON.stringify({
      dashboardState,
      config,
      createdAt: new Date().toISOString(),
      accessCount: 0
    }));
    
    return shareId;
  }

  static async getSharedDashboard(shareId: string): Promise<SharedDashboard | null> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stored = localStorage.getItem(`share_${shareId}`);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    
    return {
      id: shareId,
      dashboardState: data.dashboardState,
      shareType: data.config.shareType,
      isExpired: false, // For demo, never expired
      createdAt: data.createdAt,
      accessCount: data.accessCount
    };
  }

  static async validateShareAccess(shareId: string) {
    const shared = await this.getSharedDashboard(shareId);
    
    if (!shared) {
      return {
        hasAccess: false,
        requiresAuth: false,
        shareType: null,
        error: 'Share not found'
      };
    }

    return {
      hasAccess: true,
      requiresAuth: shared.shareType === 'member',
      shareType: shared.shareType,
    };
  }

  static generateShareUrl(shareId: string): string {
    return `${window.location.origin}/share/${shareId}`;
  }

  static extractCurrentDashboardState = (store: any) => ({
    selectedSiteId: store.selectedSite?.siteId || null,
    dateRange: store.dateRange ? {
      start: store.dateRange.start.toISOString(),
      end: store.dateRange.end.toISOString()
    } : null,
    activeFilters: store.filters || {
      searchQuery: '',
      sortBy: 'name',
      sortOrder: 'asc'
    },
    chartSettings: {},
    timestamp: new Date().toISOString()
  });
}