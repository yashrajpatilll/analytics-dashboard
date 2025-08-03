'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { useDashboardStore } from '@/stores/dashboardStore';
import { ShareService, type ShareConfig } from '@/lib/shareService';
// Uncomment the line below and comment the line above to use mock service for testing
// import { MockShareService as ShareService, type ShareConfig } from '@/lib/mockShareService';
import { Globe, Users, Copy, Check, X, AlertCircle, Clock, Link2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const dashboardStore = useDashboardStore();
  const { selectedSite, selectedSiteId, sites, filters, dateRange } = dashboardStore;
  
  // Debug store state when modal opens (FIXED: removed dashboardStore from dependencies)
  React.useEffect(() => {
    if (isOpen) {
      console.log('🔍 ShareModal opened - extracted values:', {
        selectedSiteId,
        sitesCount: sites.length
      });
    }
  }, [isOpen, selectedSiteId, sites.length]);
  const [shareType, setShareType] = useState<'public' | 'member'>('member');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [expiryDays, setExpiryDays] = useState(7);

  const handleGenerateShare = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Fix: Read fresh state from store instead of using stale closure variables
      const freshState = useDashboardStore.getState();
      const freshSelectedSite = freshState.sites.find(site => site.siteId === freshState.selectedSiteId) || null;
      
      const dashboardState = ShareService.extractCurrentDashboardState({
        selectedSite: freshSelectedSite,
        filters: freshState.filters,
        dateRange: freshState.dateRange
      });
      
      console.log('🔍 Extracted dashboard state:', dashboardState);

      const config: ShareConfig = {
        shareType,
        expiryDays
      };

      const shareId = await ShareService.createShare(dashboardState, config);
      const shareUrl = ShareService.generateShareUrl(shareId);
      setGeneratedLink(shareUrl);
    } catch (error) {
      console.error('Failed to create share:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create share link';
      
      // User-friendly rate limit message
      if (errorMessage.includes('Rate limit exceeded')) {
        setError('Too many share requests. Please wait a moment and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [shareType, expiryDays, selectedSite, filters, dateRange]);

  const handleCopyLink = useCallback(async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      setError('Failed to copy link to clipboard');
    }
  }, [generatedLink]);

  const handleClose = useCallback(() => {
    setGeneratedLink(null);
    setError(null);
    setCopyStatus('idle');
    onClose();
  }, [onClose]);

  const resetToCreate = useCallback(() => {
    setGeneratedLink(null);
    setError(null);
    setCopyStatus('idle');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Share Dashboard
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {/* Generated Link View */}
          {generatedLink ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-1">
                  Share Link Created!
                </h4>
                <p className="text-sm text-muted-foreground">
                  {shareType === 'public' 
                    ? 'Anyone with this link can view the dashboard'
                    : 'Team members can access and interact with this dashboard'
                  }
                </p>
              </div>

              {/* Link Display and Copy */}
              <div className="space-y-3">
                <div className="p-3 bg-accent/30 rounded-md">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md font-mono"
                    />
                    <Button
                      onClick={handleCopyLink}
                      size="sm"
                      variant="outline"
                      className="px-3"
                    >
                      {copyStatus === 'copied' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Share Info */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Expires in {expiryDays} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {shareType === 'public' ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <Users className="w-3 h-3" />
                    )}
                    <span>
                      {shareType === 'public' 
                        ? 'Public access (view-only)'
                        : 'Team members only'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={resetToCreate} variant="outline" className="flex-1">
                  Create Another
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* Share Creation View */
            <div className="space-y-6">
              {/* Share Type Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  Choose sharing option
                </label>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setShareType('public')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      shareType === 'public' 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                        : 'border-border hover:bg-accent hover:border-accent-foreground/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-foreground">Anyone with link</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          View-only access, no sign-in required. Perfect for sharing insights with external stakeholders.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setShareType('member')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      shareType === 'member' 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                        : 'border-border hover:bg-accent hover:border-accent-foreground/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-foreground">Team members</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Full access for authenticated users. They can filter data, export, and interact with the dashboard.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Expiry Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  Link expires in
                </label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>1 week</option>
                  <option value={14}>2 weeks</option>
                  <option value={30}>1 month</option>
                </select>
              </div>

              {/* Current State Preview */}
              <div className="bg-accent/50 p-4 rounded-md space-y-3">
                <h5 className="text-sm font-medium text-foreground">Dashboard state to share:</h5>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• Site: {selectedSite?.siteName || 'All sites'}</div>
                  <div>• Active filters: {Object.keys(filters || {}).length} applied</div>
                  <div>• Date range: {dateRange ? 'Custom range selected' : 'Default range'}</div>
                  <div>• Charts: Current visualization settings</div>
                </div>
                <p className="text-xs text-muted-foreground/80 italic">
                  The shared dashboard will show this exact state when accessed.
                </p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateShare}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </div>
                ) : (
                  'Generate Share Link'
                )}
              </Button>

              {/* Info Footer */}
              <div className="text-xs text-muted-foreground bg-accent/30 p-3 rounded-md">
                <p className="font-medium mb-1">💡 How sharing works:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• Share links preserve your current dashboard state</li>
                  <li>• Public links are view-only and don't require login</li>
                  <li>• Member links require authentication for full access</li>
                  <li>• You can always deactivate shared links later</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;