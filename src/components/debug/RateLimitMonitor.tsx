'use client';

import React, { useState } from 'react';
import { rateLimiter } from '@/lib/rateLimiter';
import { requestCache } from '@/lib/requestCache';

/**
 * Debug component to monitor rate limiting and caching
 * Only visible in development mode
 */
export const RateLimitMonitor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm shadow-lg hover:bg-blue-700"
      >
        {isVisible ? 'Hide' : 'Show'} Rate Limits
      </button>
      
      {isVisible && (
        <div className="mt-2 bg-black/90 text-white p-4 rounded-lg shadow-xl max-w-md text-xs">
          <h3 className="font-bold mb-2">Rate Limiting Status</h3>
          <div className="space-y-1">
            <div>Share Create: {getUsageInfo('share_create')}</div>
            <div>Share Get: {getUsageInfo('share_get')}</div>
            <div>Share Validate: {getUsageInfo('share_validate')}</div>
          </div>
          
          <h3 className="font-bold mb-2 mt-4">Cache Status</h3>
          <div>
            Cache entries: {requestCache.getStats().size}
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400">
            <div>✅ Prevents API abuse</div>
            <div>⚡ Caches duplicate requests</div>
            <div>🛡️ Protects database resources</div>
          </div>
        </div>
      )}
    </div>
  );
};

function getUsageInfo(operation: string): string {
  const usage = rateLimiter.getUsage(operation);
  if (!usage) return 'No usage';
  
  return `${usage.count} requests (${Math.ceil(usage.remainingMs / 1000)}s remaining)`;
}