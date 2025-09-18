import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from './log';

const log = createLogger();

// In-memory rate limiting (for development)
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Default key generator using IP + tenant
 */
function defaultKeyGenerator(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const tenantSlug = request.headers.get('x-tenant-slug') || 'unknown';
  return `${ip}:${tenantSlug}`;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return function rateLimitMiddleware(
    handler: (request: NextRequest) => Promise<Response>
  ) {
    return async (request: NextRequest): Promise<Response> => {
      const key = keyGenerator(request);
      const now = Date.now();
      
      // Clean up expired entries
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < now) {
          rateLimitStore.delete(k);
        }
      }

      // Get current rate limit data
      let rateLimitData = rateLimitStore.get(key);
      
      if (!rateLimitData || rateLimitData.resetTime < now) {
        // Create new window
        rateLimitData = {
          count: 0,
          resetTime: now + windowMs,
        };
        rateLimitStore.set(key, rateLimitData);
      }

      // Check if limit exceeded
      if (rateLimitData.count >= maxRequests) {
        const remainingTime = Math.ceil((rateLimitData.resetTime - now) / 1000);
        
        log.logRateLimit(key, maxRequests, 0, request.headers.get('x-tenant-slug') || undefined);
        
        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${remainingTime} seconds.`,
            retryAfter: remainingTime,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': remainingTime.toString(),
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitData.resetTime.toString(),
            },
          }
        );
      }

      // Increment counter
      rateLimitData.count++;
      rateLimitStore.set(key, rateLimitData);

      // Add rate limit headers to response
      const remaining = Math.max(0, maxRequests - rateLimitData.count);
      const resetTime = rateLimitData.resetTime;

      try {
        const response = await handler(request);
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', resetTime.toString());

        // Log successful request
        if (!skipSuccessfulRequests) {
          log.info('Rate limit check passed', {
            key,
            count: rateLimitData.count,
            remaining,
            maxRequests,
            status: response.status,
          });
        }

        return response;
      } catch (error) {
        // Don't count failed requests if configured
        if (skipFailedRequests) {
          rateLimitData.count--;
          rateLimitStore.set(key, rateLimitData);
        }

        // Re-throw error
        throw error;
      }
    };
  };
}

/**
 * Predefined rate limit configurations
 * 
 * TUNING:
 * - SQS long-poll: 20s for better throughput, 0s for immediate response
 * - Rate limits: Adjust based on tenant tier (free: 10/min, pro: 100/min, enterprise: 1000/min)
 * - Key generation: Include tenant slug for per-tenant limits, IP for DDoS protection
 * - Window size: 60s for burst protection, 300s for sustained rate limiting
 * - Consider Redis-based rate limiting for distributed systems
 */
export const rateLimitConfigs = {
  // Search by image - 60 requests per minute
  imageSearch: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyGenerator: (request: NextRequest) => {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      const tenantSlug = request.headers.get('x-tenant-slug') || 'unknown';
      return `image_search:${ip}:${tenantSlug}`;
    },
  },
  
  // General API - 100 requests per minute
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  
  // Media upload - 10 requests per minute
  mediaUpload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (request: NextRequest) => {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      const tenantSlug = request.headers.get('x-tenant-slug') || 'unknown';
      return `media_upload:${ip}:${tenantSlug}`;
    },
  },
  
  // Media reprocess - 5 requests per minute
  mediaReprocess: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyGenerator: (request: NextRequest) => {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      const tenantSlug = request.headers.get('x-tenant-slug') || 'unknown';
      return `media_reprocess:${ip}:${tenantSlug}`;
    },
  },
};

/**
 * Redis-based rate limiting (for production)
 * This would be used in a production environment with Redis
 */
export class RedisRateLimit {
  private redis: any; // Redis client
  private config: RateLimitConfig;

  constructor(redisClient: any, config: RateLimitConfig) {
    this.redis = redisClient;
    this.config = config;
  }

  async checkLimit(key: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Use Redis sorted set for sliding window
    const pipeline = this.redis.pipeline();
    
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiration
    pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));
    
    const results = await pipeline.exec();
    const currentCount = results[1][1];
    
    const allowed = currentCount < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - currentCount - 1);
    const resetTime = now + this.config.windowMs;
    
    return { allowed, remaining, resetTime };
  }
}

/**
 * Utility to get rate limit info for a key
 */
export function getRateLimitInfo(key: string): {
  count: number;
  remaining: number;
  resetTime: number;
} | null {
  const data = rateLimitStore.get(key);
  if (!data) return null;
  
  const now = Date.now();
  if (data.resetTime < now) return null;
  
  return {
    count: data.count,
    remaining: Math.max(0, 100 - data.count), // Assuming max 100 for display
    resetTime: data.resetTime,
  };
}

/**
 * Clear rate limit for a specific key (admin function)
 */
export function clearRateLimit(key: string): boolean {
  return rateLimitStore.delete(key);
}

/**
 * Get all rate limit entries (admin function)
 */
export function getAllRateLimits(): Array<{ key: string; count: number; resetTime: number }> {
  const now = Date.now();
  const entries: Array<{ key: string; count: number; resetTime: number }> = [];
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime >= now) {
      entries.push({ key, ...data });
    }
  }
  
  return entries;
}

export default {
  rateLimit,
  rateLimitConfigs,
  RedisRateLimit,
  getRateLimitInfo,
  clearRateLimit,
  getAllRateLimits,
};
