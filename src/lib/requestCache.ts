/**
 * Simple request cache to prevent duplicate API calls
 * Useful for preventing multiple identical requests in rapid succession
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  
  /**
   * Get cached result if available and not expired
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Set cache entry with TTL
   */
  public set<T>(key: string, data: T, ttlMs: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttlMs
    });
  }
  
  /**
   * Execute function with caching and circuit breaker
   */
  public async withCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttlMs: number = 30000
  ): Promise<T> {
    // Circuit breaker: prevent infinite loops
    const requestCount = this.getRequestCount(key);
    if (requestCount > 5) {
      console.warn(`Circuit breaker triggered for key: ${key}. Too many requests.`);
      throw new Error(`Too many requests for ${key}. Circuit breaker activated.`);
    }
    
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      console.log(`Cache hit for key: ${key}`);
      return cached;
    }
    
    // Increment request count
    this.incrementRequestCount(key);
    
    try {
      // Execute function and cache result
      const result = await fn();
      this.set(key, result, ttlMs);
      console.log(`Cache miss for key: ${key}, result cached`);
      
      // Reset request count on success
      this.resetRequestCount(key);
      return result;
    } catch (error) {
      // Don't reset request count on error to prevent retry loops
      throw error;
    }
  }
  
  // Circuit breaker methods
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  private getRequestCount(key: string): number {
    const entry = this.requestCounts.get(key);
    if (!entry) return 0;
    
    // Reset if window expired (1 minute)
    if (Date.now() > entry.resetTime) {
      this.requestCounts.delete(key);
      return 0;
    }
    
    return entry.count;
  }
  
  private incrementRequestCount(key: string): void {
    const existing = this.requestCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      this.requestCounts.set(key, {
        count: 1,
        resetTime: Date.now() + 60000 // 1 minute
      });
    }
  }
  
  private resetRequestCount(key: string): void {
    this.requestCounts.delete(key);
  }
  
  /**
   * Clear specific cache entry
   */
  public clear(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cache entries
   */
  public clearAll(): void {
    this.cache.clear();
  }
  
  /**
   * Clean up expired entries
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get cache stats for debugging
   */
  public getStats(): { size: number; entries: Array<{ key: string; age: number; ttl: number }> } {
    const now = Date.now();
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: now - entry.timestamp,
        ttl: Math.max(0, entry.expiry - now)
      }))
    };
  }
}

// Global cache instance
export const requestCache = new RequestCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  requestCache.cleanup();
}, 5 * 60 * 1000);

export default requestCache;