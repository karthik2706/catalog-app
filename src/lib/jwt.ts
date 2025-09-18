import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { createLogger } from './log';

const log = createLogger();

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  clientId?: string;
  clientSlug?: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract and validate JWT token from request headers
 */
export function validateJWT(request: NextRequest): JWTPayload {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Validate required fields
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new Error('Invalid token payload');
    }

    // Check if token is expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw error;
  }
}

/**
 * Middleware to validate JWT and add user context to request
 */
export function withJWTValidation(handler: (request: NextRequest, user: JWTPayload) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const user = validateJWT(request);
      
      // Log successful authentication
      log.info('JWT validation successful', {
        userId: user.userId,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
        clientSlug: user.clientSlug,
        route: request.url,
      });

      return handler(request, user);
    } catch (error) {
      log.logSecurity('JWT validation failed', {
        error: error instanceof Error ? error.message : String(error),
        route: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });

      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: error instanceof Error ? error.message : 'Invalid token'
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Check if user has required role
 */
export function hasRole(user: JWTPayload, requiredRole: string): boolean {
  const roleHierarchy = {
    'SUPER_ADMIN': 4,
    'ADMIN': 3,
    'MANAGER': 2,
    'USER': 1,
  };

  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Check if user can access tenant
 */
export function canAccessTenant(user: JWTPayload, tenantSlug: string): boolean {
  // Super admins can access any tenant
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Other users can only access their own tenant
  return user.clientSlug === tenantSlug;
}

/**
 * Extract tenant slug from request headers
 */
export function getTenantSlug(request: NextRequest): string | null {
  return request.headers.get('x-tenant-slug');
}

/**
 * Validate that user can access the requested tenant
 */
export function validateTenantAccess(user: JWTPayload, request: NextRequest): void {
  const tenantSlug = getTenantSlug(request);
  
  if (!tenantSlug) {
    throw new Error('Missing tenant slug in request headers');
  }

  if (!canAccessTenant(user, tenantSlug)) {
    throw new Error('Access denied to tenant');
  }
}

/**
 * Create a new JWT token
 */
export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: string = '24h'): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Refresh a JWT token
 */
export function refreshToken(token: string, expiresIn: string = '24h'): string {
  const user = validateJWT({ headers: { get: (name: string) => `Bearer ${token}` } } as NextRequest);
  
  // Remove iat and exp from payload
  const { iat, exp, ...payload } = user;
  
  return createToken(payload, expiresIn);
}

/**
 * Decode JWT without verification (for debugging)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

export default {
  validateJWT,
  withJWTValidation,
  hasRole,
  canAccessTenant,
  getTenantSlug,
  validateTenantAccess,
  createToken,
  refreshToken,
  decodeJWT,
};
