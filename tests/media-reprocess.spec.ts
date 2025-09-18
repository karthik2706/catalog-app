import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../src/app/api/media/reprocess/[id]/route';

// Mock dependencies
vi.mock('../src/lib/tenant', () => ({
  getTenantFromRequest: vi.fn(),
}));

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    media: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Media Reprocess API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/media/reprocess/[id]', () => {
    it('should reprocess media successfully', async () => {
      const { getTenantFromRequest } = await import('../src/lib/tenant');
      const { prisma } = await import('../src/lib/prisma');

      // Mock tenant resolution
      vi.mocked(getTenantFromRequest).mockResolvedValue({
        clientId: 'client-123',
        slug: 'test-tenant',
      });

      // Mock existing media
      const mockMedia = {
        id: BigInt(1),
        s3Key: 'clients/client-123/products/test-sku/media/image/test.jpg',
        status: 'failed',
        error: 'Processing failed',
        product: {
          id: 'product-123',
          name: 'Test Product',
          sku: 'TEST-SKU',
        },
      };

      vi.mocked(prisma.media.findFirst).mockResolvedValue(mockMedia);
      vi.mocked(prisma.media.update).mockResolvedValue({
        ...mockMedia,
        status: 'pending',
        error: null,
        updatedAt: new Date(),
      });

      const request = new NextRequest('https://example.com/api/media/reprocess/1', {
        method: 'POST',
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Media queued for reprocessing');
      expect(data.media.status).toBe('pending');
      expect(data.media.product.name).toBe('Test Product');

      expect(prisma.media.findFirst).toHaveBeenCalledWith({
        where: {
          id: BigInt(1),
          clientId: 'client-123',
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      });

      expect(prisma.media.update).toHaveBeenCalledWith({
        where: {
          id: BigInt(1),
        },
        data: {
          status: 'pending',
          error: null,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should return 404 when media not found', async () => {
      const { getTenantFromRequest } = await import('../src/lib/tenant');
      const { prisma } = await import('../src/lib/prisma');

      vi.mocked(getTenantFromRequest).mockResolvedValue({
        clientId: 'client-123',
        slug: 'test-tenant',
      });

      vi.mocked(prisma.media.findFirst).mockResolvedValue(null);

      const request = new NextRequest('https://example.com/api/media/reprocess/999', {
        method: 'POST',
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      const response = await POST(request, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Media not found or access denied');
    });

    it('should return 401 when tenant is invalid', async () => {
      const { getTenantFromRequest } = await import('../src/lib/tenant');

      const error = new Error('Tenant not found');
      (error as any).status = 401;
      vi.mocked(getTenantFromRequest).mockRejectedValue(error);

      const request = new NextRequest('https://example.com/api/media/reprocess/1', {
        method: 'POST',
        headers: {
          'x-tenant-slug': 'invalid-tenant',
        },
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 400 for invalid media ID', async () => {
      const { getTenantFromRequest } = await import('../src/lib/tenant');

      vi.mocked(getTenantFromRequest).mockResolvedValue({
        clientId: 'client-123',
        slug: 'test-tenant',
      });

      const request = new NextRequest('https://example.com/api/media/reprocess/invalid', {
        method: 'POST',
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      const response = await POST(request, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid media ID format');
    });
  });

  describe('GET /api/media/reprocess/[id]', () => {
    it('should return media status successfully', async () => {
      const { getTenantFromRequest } = await import('../src/lib/tenant');
      const { prisma } = await import('../src/lib/prisma');

      vi.mocked(getTenantFromRequest).mockResolvedValue({
        clientId: 'client-123',
        slug: 'test-tenant',
      });

      const mockMedia = {
        id: BigInt(1),
        s3Key: 'clients/client-123/products/test-sku/media/image/test.jpg',
        kind: 'image',
        status: 'completed',
        error: null,
        width: 1920,
        height: 1080,
        durationMs: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: 'product-123',
          name: 'Test Product',
          sku: 'TEST-SKU',
        },
        imageEmbedding: {
          mediaId: BigInt(1),
        },
        videoFrames: [],
      };

      vi.mocked(prisma.media.findFirst).mockResolvedValue(mockMedia);

      const request = new NextRequest('https://example.com/api/media/reprocess/1', {
        method: 'GET',
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      const response = await GET(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.media.id).toBe('1');
      expect(data.media.status).toBe('completed');
      expect(data.media.processing.hasImageEmbedding).toBe(true);
      expect(data.media.processing.isFullyProcessed).toBe(true);
    });

    it('should return 404 when media not found', async () => {
      const { getTenantFromRequest } = await import('../src/lib/tenant');
      const { prisma } = await import('../src/lib/prisma');

      vi.mocked(getTenantFromRequest).mockResolvedValue({
        clientId: 'client-123',
        slug: 'test-tenant',
      });

      vi.mocked(prisma.media.findFirst).mockResolvedValue(null);

      const request = new NextRequest('https://example.com/api/media/reprocess/999', {
        method: 'GET',
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      const response = await GET(request, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Media not found or access denied');
    });
  });
});
