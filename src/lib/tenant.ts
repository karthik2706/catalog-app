import { NextRequest } from 'next/server';
import { prisma } from './prisma';

export interface TenantInfo {
  clientId: string;
  slug: string;
}

/**
 * Resolves tenant information from the x-tenant-slug header in the request
 * 
 * @param req - Next.js request object
 * @returns Promise<TenantInfo> - Object containing clientId and slug
 * @throws Error with 401 status if tenant slug is missing or invalid
 */
export async function getTenantFromRequest(req: NextRequest): Promise<TenantInfo> {
  // Extract tenant slug from the x-tenant-slug header
  const tenantSlug = req.headers.get('x-tenant-slug');
  
  if (!tenantSlug) {
    const error = new Error('Missing tenant slug in request headers');
    (error as any).status = 401;
    throw error;
  }

  try {
    // Query the database to find the client by slug
    const client = await prisma.client.findUnique({
      where: {
        slug: tenantSlug,
      },
      select: {
        id: true,
        slug: true,
        isActive: true,
      },
    });

    if (!client) {
      const error = new Error(`Tenant not found: ${tenantSlug}`);
      (error as any).status = 401;
      throw error;
    }

    if (!client.isActive) {
      const error = new Error(`Tenant is inactive: ${tenantSlug}`);
      (error as any).status = 401;
      throw error;
    }

    return {
      clientId: client.id,
      slug: client.slug,
    };
  } catch (error) {
    // If it's already our custom error, re-throw it
    if ((error as any).status) {
      throw error;
    }

    // For database errors, wrap them
    console.error('Database error while resolving tenant:', error);
    const dbError = new Error('Failed to resolve tenant');
    (dbError as any).status = 500;
    throw dbError;
  }
}

/**
 * Helper function to get tenant info and throw if not found
 * This is a convenience wrapper for API routes
 * 
 * @param req - Next.js request object
 * @returns Promise<TenantInfo>
 */
export async function requireTenant(req: NextRequest): Promise<TenantInfo> {
  return getTenantFromRequest(req);
}

/**
 * Helper function to safely get tenant info without throwing
 * Returns null if tenant is not found or invalid
 * 
 * @param req - Next.js request object
 * @returns Promise<TenantInfo | null>
 */
export async function getTenantSafely(req: NextRequest): Promise<TenantInfo | null> {
  try {
    return await getTenantFromRequest(req);
  } catch (error) {
    console.warn('Failed to resolve tenant:', error);
    return null;
  }
}
