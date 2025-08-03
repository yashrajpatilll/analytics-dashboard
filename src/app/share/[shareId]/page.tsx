'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShareService, type SharedDashboard } from '@/lib/shareService';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Eye, Home, Clock, Users, Globe } from 'lucide-react';

interface SharedDashboardState {
  shared: SharedDashboard;
  accessValidation: {
    hasAccess: boolean;
    requiresAuth: boolean;
    shareType: 'public' | 'member' | null;
    error?: string;
  };
}

function SharedDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.shareId as string;
  const { user } = useAuth();
  
  const [sharedData, setSharedData] = useState<SharedDashboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Circuit breaker to prevent infinite API calls
  const requestCountRef = useRef(0);
  const lastRequestTimeRef = useRef(0);
  const CIRCUIT_BREAKER_LIMIT = 5;
  const CIRCUIT_BREAKER_WINDOW = 60000; // 1 minute
  
  // Create stable references for store actions to prevent useEffect loops
  const storeActions = useMemo(() => {
    const store = useDashboardStore.getState();
    return {
      setSelectedSite: store.setSelectedSite,
      setPendingSelectedSite: store.setPendingSelectedSite,
      setFilters: store.setFilters,
      setDateRange: store.setDateRange,
      setIsSharedView: store.setIsSharedView
    };
  }, []);

  useEffect(() => {
    const loadSharedDashboard = async () => {
      if (!shareId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      // Circuit breaker: check if we're making too many requests
      const now = Date.now();
      if (now - lastRequestTimeRef.current > CIRCUIT_BREAKER_WINDOW) {
        requestCountRef.current = 0; // Reset counter after window
      }
      
      if (requestCountRef.current >= CIRCUIT_BREAKER_LIMIT) {
        setError('Too many requests. Please wait a moment and try again.');
        setLoading(false);
        return;
      }
      
      requestCountRef.current += 1;
      lastRequestTimeRef.current = now;

      try {
        // First validate access
        const accessValidation = await ShareService.validateShareAccess(shareId);
        
        if (!accessValidation.hasAccess) {
          
          // If it's a member share requiring auth and user is not logged in
          if (accessValidation.requiresAuth && !user) {
            setError('Please sign in to access this shared dashboard');
            setLoading(false);
            return;
          }
          
          // For "share not found" errors when not authenticated, assume it might be a member share
          if (accessValidation.error === 'Share not found or invalid' && !user) {
            setError('Please sign in to access this shared dashboard');
            setLoading(false);
            return;
          }
          
          setError(accessValidation.error || 'Access denied');
          setLoading(false);
          return;
        }

        // Get the shared dashboard data
        const shared = await ShareService.getSharedDashboard(shareId);
        
        if (!shared) {
          setError('Shared dashboard not found or has expired');
          setLoading(false);
          return;
        }

        if (shared.isExpired) {
          setError('This shared dashboard link has expired');
          setLoading(false);
          return;
        }

        setSharedData({
          shared,
          accessValidation
        });

        // Apply shared dashboard state to the store
        const { dashboardState } = shared;
        
        // Set shared view mode FIRST
        storeActions.setIsSharedView(true, shared.shareType);
        
        // Apply shared state immediately and also set it as pending
        if (dashboardState.selectedSiteId) {
          // Use force=true to bypass permission checks for initial restoration
          storeActions.setSelectedSite(dashboardState.selectedSiteId, true);
          
          // Also store in localStorage as backup and set as pending
          localStorage.setItem('pendingSharedSite', dashboardState.selectedSiteId);
          
          // Also set as pending in store for when sites load
          storeActions.setPendingSelectedSite(dashboardState.selectedSiteId);
        }
        
        if (dashboardState.activeFilters) {
          // Use the activeFilters directly since they're already FilterState
          storeActions.setFilters(dashboardState.activeFilters);
        }
        
        if (dashboardState.dateRange) {
          storeActions.setDateRange({
            start: new Date(dashboardState.dateRange.start),
            end: new Date(dashboardState.dateRange.end)
          });
        }

      } catch (error) {
        console.error('Failed to load shared dashboard:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load shared dashboard';
        
        // Handle rate limit errors specially
        if (errorMessage.includes('Rate limit exceeded')) {
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSharedDashboard();
  }, [shareId, user?.id]); // Only depend on shareId and user.id - storeActions is stable

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold text-foreground">Loading shared dashboard...</h2>
          <p className="text-muted-foreground">Please wait while we load the analytics data.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md mx-4">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Unable to Load Dashboard</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {error.includes('sign in') ? (
              <Button onClick={() => {
                // Redirect to login with the current shared URL as callback
                const currentUrl = window.location.href;
                const encodedCallback = encodeURIComponent(currentUrl);
                router.push(`/login?redirect=${encodedCallback}`);
              }}>
                Sign In
              </Button>
            ) : (
              <Button onClick={() => router.push('/')} variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Go to Main Dashboard
              </Button>
            )}
            
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - render shared dashboard
  if (!sharedData) return null;

  const { shared } = sharedData;

  return (
    <div className="min-h-screen bg-background">
      {/* Shared Dashboard Header */}
      <div className="bg-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Shared Analytics Dashboard
                </h1>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 px-2 py-1 bg-accent border border-border rounded-md">
                    {shared.shareType === 'public' ? (
                      <Globe className="w-3 h-3 text-primary" />
                    ) : (
                      <Users className="w-3 h-3 text-primary" />
                    )}
                    <span className="text-accent-foreground font-medium">
                      {shared.shareType === 'public' ? 'Public view-only access' : 'Team member access'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Shared {new Date(shared.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="hidden sm:block text-muted-foreground">
                    <span>{shared.accessCount} views</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
                size="sm"
              >
                <Home className="w-4 h-4 mr-2" />
                Create Your Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <Dashboard 
        isSharedView={true} 
        shareType={shared.shareType}
        sharedState={shared.dashboardState}
      />

      {/* Footer for shared view */}
      <div className="border-t border-border bg-accent/30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              This is a shared view of an analytics dashboard. 
              {shared.shareType === 'public' ? ' Some features are limited in public view.' : ''}
            </p>
            <p>
              Powered by Analytics Dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with conditional auth wrapper
export default function SharedDashboardPage() {
  // Always wrap in AuthProvider to handle all cases
  // The SharedDashboardContent component will handle the logic internally
  return (
    <AuthProvider>
      <SharedDashboardContent />
    </AuthProvider>
  );
}