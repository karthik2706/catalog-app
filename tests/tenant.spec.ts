import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getTenantFromRequest, requireTenant, getTenantSafely } from '../src/lib/tenant';

// Mock Prisma client
const mockPrismaClient = {
  client: {
    findUnique: vi.fn(),
  },
};

// Mock the prisma module
vi.mock('../src/lib/prisma', () => ({
  prisma: mockPrismaClient,
}));

describe('Tenant Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTenantFromRequest', () => {
    it('should resolve tenant from valid x-tenant-slug header', async () => {
      // Mock successful database response
      mockPrismaClient.client.findUnique.mockResolvedValue({
        id: 'client-123',
        slug: 'test-tenant',
        isActive: true,
      });

      // Create mock request with header
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      const result = await getTenantFromRequest(request);

      expect(result).toEqual({
        clientId: 'client-123',
        slug: 'test-tenant',
      });

      expect(mockPrismaClient.client.findUnique).toHaveBeenCalledWith({
        where: {
          slug: 'test-tenant',
        },
        select: {
          id: true,
          slug: true,
          isActive: true,
        },
      });
    });

    it('should throw 401 error when x-tenant-slug header is missing', async () => {
      const request = new NextRequest('https://example.com/api/test');

      await expect(getTenantFromRequest(request)).rejects.toThrow('Missing tenant slug in request headers');
      
      // Verify the error has status 401
      try {
        await getTenantFromRequest(request);
      } catch (error: any) {
        expect(error.status).toBe(401);
      }
    });

    it('should throw 401 error when tenant is not found', async () => {
      mockPrismaClient.client.findUnique.mockResolvedValue(null);

      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'x-tenant-slug': 'nonexistent-tenant',
        },
      });

      await expect(getTenantFromRequest(request)).rejects.toThrow('Tenant not found: nonexistent-tenant');
      
      try {
        await getTenantFromRequest(request);
      } catch (error: any) {
        expect(error.status).toBe(401);
      }
    });

    it('should throw 401 error when tenant is inactive', async () => {
      mockPrismaClient.client.findUnique.mockResolvedValue({
        id: 'client-123',
        slug: 'inactive-tenant',
        isActive: false,
      });

      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'x-tenant-slug': 'inactive-tenant',
        },
      });

      await expect(getTenantFromRequest(request)).rejects.toThrow('Tenant is inactive: inactive-tenant');
      
      try {
        await getTenantFromRequest(request);
      } catch (error: any) {
        expect(error.status).toBe(401);
      }
    });

    it('should throw 500 error when database operation fails', async () => {
      mockPrismaClient.client.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      await expect(getTenantFromRequest(request)).rejects.toThrow('Failed to resolve tenant');
      
      try {
        await getTenantFromRequest(request);
      } catch (error: any) {
        expect(error.status).toBe(500);
      }
    });
  });

  describe('requireTenant', () => {
    it('should be an alias for getTenantFromRequest', async () => {
      mockPrismaClient.client.findUnique.mockResolvedValue({
        id: 'client-456',
        slug: 'required-tenant',
        isActive: true,
      });

      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'x-tenant-slug': 'required-tenant',
        },
      });

      const result = await requireTenant(request);

      expect(result).toEqual({
        clientId: 'client-456',
        slug: 'required-tenant',
      });
    });
  });

  describe('getTenantSafely', () => {
    it('should return tenant info when valid', async () => {
      mockPrismaClient.client.findUnique.mockResolvedValue({
        id: 'client-789',
        slug: 'safe-tenant',
        isActive: true,
      });

      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'x-tenant-slug': 'safe-tenant',
        },
      });

      const result = await getTenantSafely(request);

      expect(result).toEqual({
        clientId: 'client-789',
        slug: 'safe-tenant',
      });
    });

    it('should return null when tenant is not found', async () => {
      mockPrismaClient.client.findUnique.mockResolvedValue(null);

      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'x-tenant-slug': 'nonexistent-tenant',
        },
      });

      const result = await getTenantSafely(request);

      expect(result).toBeNull();
    });

    it('should return null when header is missing', async () => {
      const request = new NextRequest('https://example.com/api/test');

      const result = await getTenantSafely(request);

      expect(result).toBeNull();
    });

    it('should return null when database operation fails', async () => {
      mockPrismaClient.client.findUnique.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      const result = await getTenantSafely(request);

      expect(result).toBeNull();
    });
  });
});
