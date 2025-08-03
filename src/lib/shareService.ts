import { createClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rateLimiter';
import { requestCache } from '@/lib/requestCache';
import { FilterState } from '@/types/analytics';

export interface DashboardState {
  selectedSiteId: string | null;
  dateRange: { start: string; end: string } | null;
  activeFilters: FilterState;
  chartSettings: Record<string, unknown>;
  timestamp: string;
}

export interface ShareConfig {
  shareType: 'public' | 'member';
  expiryDays?: number;
}

export interface SharedDashboard {
  id: string;
  dashboardState: DashboardState;
  shareType: 'public' | 'member';
  isExpired: boolean;
  createdAt: string;
  accessCount: number;
}

export class ShareService {
  private static getSupabase() {
    return createClient();
  }

  /**
   * Create a new dashboard share
   */
  static async createShare(
    dashboardState: DashboardState, 
    config: ShareConfig
  ): Promise<string> {
    return withRateLimit('share_create', RATE_LIMITS.SHARE_CREATE, async () => {
      // Get current user
      const { data: { user }, error: authError } = await this.getSupabase().auth.getUser();
      if (authError || !user) {
        throw new Error('User must be authenticated to create shares');
      }

      // Generate share ID
      const shareId = this.generateRandomId();
      
      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (config.expiryDays || 7));

      // Add timestamp to dashboard state
      const stateWithTimestamp: DashboardState = {
        ...dashboardState,
        timestamp: new Date().toISOString()
      };

      // Insert share record
      const { error } = await this.getSupabase()
        .from('dashboard_shares')
        .insert({
          id: shareId,
          created_by: user.id,
          share_type: config.shareType,
          dashboard_state: stateWithTimestamp,
          expires_at: expiryDate.toISOString()
        });

      if (error) {
        console.error('Database error creating share:', error);
        throw new Error(`Failed to create share: ${error.message}`);
      }

      return shareId;
    });
  }

  /**
   * Get shared dashboard by ID
   */
  static async getSharedDashboard(shareId: string): Promise<SharedDashboard | null> {
    return withRateLimit('share_get', RATE_LIMITS.SHARE_GET, async () => {
      const { data, error } = await this.getSupabase()
        .from('dashboard_shares')
        .select('*')
        .eq('id', shareId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Database error fetching share:', error);
        throw new Error(`Failed to fetch share: ${error.message}`);
      }

      if (!data) return null;

      // Check if expired
      const isExpired = data.expires_at ? new Date(data.expires_at) < new Date() : false;
      
      // If not expired, increment access count
      let accessCount = data.access_count;
      if (!isExpired) {
        try {
          await this.incrementAccessCount(shareId, data.access_count);
          accessCount = data.access_count + 1; // Return incremented count
        } catch (error) {
          console.warn('Failed to increment access count:', error);
        }
      }

      return {
        id: data.id,
        dashboardState: data.dashboard_state,
        shareType: data.share_type,
        isExpired,
        createdAt: data.created_at,
        accessCount: accessCount
      };
    });
  }

  /**
   * Validate share access for current user
   */
  static async validateShareAccess(shareId: string): Promise<{
    hasAccess: boolean;
    requiresAuth: boolean;
    shareType: 'public' | 'member' | null;
    error?: string;
  }> {
    return withRateLimit('share_validate', RATE_LIMITS.SHARE_VALIDATE, async () => {
      return requestCache.withCache(`validate_${shareId}`, async () => {
        // First try to get share without RLS to check if it exists at all
        const { data: adminData, error: adminError } = await this.getSupabase()
          .from('dashboard_shares')
          .select('share_type, expires_at, is_active')
          .eq('id', shareId)
          .single();

      if (adminError) {
        
        // If it's a row not found error, the share truly doesn't exist
        if (adminError.code === 'PGRST116') {
          return {
            hasAccess: false,
            requiresAuth: false,
            shareType: null,
            error: 'Share not found or invalid'
          };
        }
        
        // For other errors, it might be an access issue with member shares
        // Check if user is authenticated to provide better error message
        const { data: { user } } = await this.getSupabase().auth.getUser();
        
        if (!user) {
          // Not authenticated, assume it might be a member share
          return {
            hasAccess: false,
            requiresAuth: true,
            shareType: 'member',
            error: 'Please sign in to access this shared dashboard'
          };
        } else {
          // User is authenticated but still can't access - truly not found
          return {
            hasAccess: false,
            requiresAuth: false,
            shareType: null,
            error: 'Share not found or has been removed'
          };
        }
      }

      const data = adminData;

      if (!data.is_active) {
        return {
          hasAccess: false,
          requiresAuth: false,
          shareType: data.share_type,
          error: 'Share link has been deactivated'
        };
      }

      // Check if expired
      const isExpired = data.expires_at ? new Date(data.expires_at) < new Date() : false;
      if (isExpired) {
        return {
          hasAccess: false,
          requiresAuth: false,
          shareType: data.share_type,
          error: 'Share link has expired'
        };
      }

      const shareType = data.share_type;

      // For member shares, check if user is authenticated
      if (shareType === 'member') {
        const { data: { user } } = await this.getSupabase().auth.getUser();
        
        if (!user) {
          return {
            hasAccess: false,
            requiresAuth: true,
            shareType: 'member',
            error: 'Please sign in to access this shared dashboard'
          };
        }
        
        // User is authenticated, grant access to member share
        return {
          hasAccess: true,
          requiresAuth: false,
          shareType: 'member'
        };
      }

      // Public shares don't require authentication
      if (shareType === 'public') {
        return {
          hasAccess: true,
          requiresAuth: false,
          shareType: 'public'
        };
      }

      return {
        hasAccess: false,
        requiresAuth: false,
        shareType: shareType,
        error: 'Invalid share type'
      };
      }, 30000); // 30 second cache TTL
    });
  }

  /**
   * Get user's created shares
   */
  static async getUserShares(): Promise<SharedDashboard[]> {
    return withRateLimit('user_shares', RATE_LIMITS.USER_SHARES, async () => {
      const { data: { user } } = await this.getSupabase().auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await this.getSupabase()
        .from('dashboard_shares')
        .select('*')
        .eq('created_by', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching user shares:', error);
        throw new Error(`Failed to fetch shares: ${error.message}`);
      }

      return (data || []).map(share => ({
        id: share.id,
        dashboardState: share.dashboard_state,
        shareType: share.share_type,
        isExpired: share.expires_at ? new Date(share.expires_at) < new Date() : false,
        createdAt: share.created_at,
        accessCount: share.access_count
      }));
    });
  }

  /**
   * Deactivate a share
   */
  static async deactivateShare(shareId: string): Promise<void> {
    try {
      const { data: { user } } = await this.getSupabase().auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await this.getSupabase()
        .from('dashboard_shares')
        .update({ is_active: false })
        .eq('id', shareId)
        .eq('created_by', user.id);

      if (error) {
        console.error('Database error deactivating share:', error);
        throw new Error(`Failed to deactivate share: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deactivating share:', error);
      throw error;
    }
  }

  /**
   * Generate share URL
   */
  static generateShareUrl(shareId: string): string {
    if (typeof window === 'undefined') {
      // Server-side fallback
      return `https://your-domain.com/share/${shareId}`;
    }
    return `${window.location.origin}/share/${shareId}`;
  }

  /**
   * Extract dashboard state from current store
   */
  static extractCurrentDashboardState(store: {
    selectedSite?: { siteId: string; siteName: string } | null;
    filters?: FilterState;
    dateRange?: { start: Date; end: Date } | null;
    chartSettings?: Record<string, unknown>;
  }): DashboardState {
    return {
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
      chartSettings: store.chartSettings || {},
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Private helper methods
   */
  private static async incrementAccessCount(shareId: string, currentCount: number): Promise<void> {
    try {
      await this.getSupabase()
        .from('dashboard_shares')
        .update({ 
          access_count: currentCount + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', shareId);
    } catch (error) {
      // Don't throw error for access count increment failures
      console.warn('Failed to increment access count:', error);
    }
  }

  private static generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Utility method to check if user can create shares
   */
  static async canCreateShares(): Promise<boolean> {
    try {
      const { data: { user } } = await this.getSupabase().auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  }
}

export default ShareService;