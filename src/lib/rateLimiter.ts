/**
 * Rate Limiter for Database Operations
 * Prevents API abuse and excessive database calls
 */

interface RateLimitConfig {
  maxRequests: number;    // Maximum requests allowed
  windowMs: number;       // Time window in milliseconds
  keyGenerator?: () => string; // Custom key generator (defaults to operation name)
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  
  /**
   * Check if operation is allowed under rate limit
   */
  public isAllowed(operation: string, config: RateLimitConfig): boolean {
    const key = config.keyGenerator ? config.keyGenerator() : operation;
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanup();
    
    const entry = this.limits.get(key);
    
    if (!entry) {
      // First request for this key
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }
    
    if (now >= entry.resetTime) {
      // Window has expired, reset
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }
    
    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      console.warn(`Rate limit exceeded for operation: ${operation}. Limit: ${config.maxRequests}/${config.windowMs}ms`);
      return false;
    }
    
    // Increment count
    entry.count += 1;
    return true;
  }
  
  /**
   * Execute operation with rate limiting
   */
  public async execute<T>(
    operation: string,
    config: RateLimitConfig,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.isAllowed(operation, config)) {
      throw new Error(`Rate limit exceeded for ${operation}. Try again later.`);
    }
    
    return await fn();
  }
  
  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
  
  /**
   * Get current usage for debugging
   */
  public getUsage(operation: string): { count: number; remainingMs: number } | null {
    const entry = this.limits.get(operation);
    if (!entry) return null;
    
    const now = Date.now();
    return {
      count: entry.count,
      remainingMs: Math.max(0, entry.resetTime - now)
    };
  }
  
  /**
   * Clear specific rate limit entry (for testing/debugging)
   */
  public clearLimit(operation: string): void {
    this.limits.delete(operation);
  }
  
  /**
   * Clear all rate limits (for testing/debugging)
   */
  public clearAll(): void {
    this.limits.clear();
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Make rate limiter available in dev mode for debugging
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).rateLimiter = rateLimiter;
  console.log('Rate limiter available as window.rateLimiter in dev mode');
  console.log('Use rateLimiter.clearAll() to reset all limits');
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // ShareService operations - Increased limits for normal usage
  SHARE_CREATE: { maxRequests: 10, windowMs: 60000 },       // 10 creates per minute
  SHARE_GET: { maxRequests: 100, windowMs: 60000 },         // 100 gets per minute
  SHARE_VALIDATE: { maxRequests: 200, windowMs: 60000 },    // 200 validations per minute
  
  // General database operations
  DB_READ: { maxRequests: 200, windowMs: 60000 },           // 200 reads per minute
  DB_WRITE: { maxRequests: 50, windowMs: 60000 },           // 50 writes per minute
  
  // User-specific operations (using user ID as key)
  USER_SHARES: { 
    maxRequests: 20, 
    windowMs: 60000,
    keyGenerator: () => {
      // In a real app, this would get the current user ID
      // For now, use a simple session-based approach
      return `user_${Date.now().toString().slice(-6)}`;
    }
  }
} as const;

/**
 * Wrapper for database operations with rate limiting
 */
export function withRateLimit<T>(
  operation: string,
  config: RateLimitConfig,
  fn: () => Promise<T>
): Promise<T> {
  return rateLimiter.execute(operation, config, fn);
}