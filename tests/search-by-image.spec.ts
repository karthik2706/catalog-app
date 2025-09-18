import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../src/app/api/search/by-image/route';

// Mock dependencies
vi.mock('../src/lib/tenant', () => ({
  getTenantFromRequest: vi.fn(),
}));

vi.mock('../src/lib/search', () => ({
  searchSimilarProducts: vi.fn(),
  enrichSearchResults: vi.fn(),
}));

vi.mock('../src/lib/pg', () => ({
  query: vi.fn(),
}));

// Mock fetch for embedding service
global.fetch = vi.fn();

describe('Search by Image API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/search/by-image', () => {
    it('should return 400 when no file is provided', async () => {
      const formData = new FormData();
      const request = new NextRequest('https://example.com/api/search/by-image', {
        method: 'POST',
        body: formData,
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      const { getTenantFromRequest } = await import('../src/lib/tenant');
      vi.mocked(getTenantFromRequest).mockResolvedValue({
        clientId: 'client-123',
        slug: 'test-tenant',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No file provided');
    });

    it('should return 400 for invalid file type', async () => {
      const formData = new FormData();
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);

      const request = new NextRequest('https://example.com/api/search/by-image', {
        method: 'POST',
        body: formData,
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      const { getTenantFromRequest } = await import('../src/lib/tenant');
      vi.mocked(getTenantFromRequest).mockResolvedValue({
        clientId: 'client-123',
        slug: 'test-tenant',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid file type');
    });

    it('should return 400 for file too large', async () => {
      const formData = new FormData();
      // Create a large file (11MB)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      formData.append('file', largeFile);

      const request = new NextRequest('https://example.com/api/search/by-image', {
        method: 'POST',
        body: formData,
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      const { getTenantFromRequest } = await import('../src/lib/tenant');
      vi.mocked(getTenantFromRequest).mockResolvedValue({
        clientId: 'client-123',
        slug: 'test-tenant',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('File too large');
    });

    it('should return 401 when tenant is invalid', async () => {
      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const request = new NextRequest('https://example.com/api/search/by-image', {
        method: 'POST',
        body: formData,
        headers: {
          'x-tenant-slug': 'invalid-tenant',
        },
      });

      const { getTenantFromRequest } = await import('../src/lib/tenant');
      const error = new Error('Tenant not found');
      (error as any).status = 401;
      vi.mocked(getTenantFromRequest).mockRejectedValue(error);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should successfully search for similar products', async () => {
      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const request = new NextRequest('https://example.com/api/search/by-image', {
        method: 'POST',
        body: formData,
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      // Mock tenant resolution
      const { getTenantFromRequest } = await import('../src/lib/tenant');
      vi.mocked(getTenantFromRequest).mockResolvedValue({
        clientId: 'client-123',
        slug: 'test-tenant',
      });

      // Mock embedding service response
      const mockEmbeddingResponse = {
        embedding: new Array(512).fill(0.1),
        model: 'CLIP-ViT-B/32',
        device: 'cpu',
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEmbeddingResponse),
      } as Response);

      // Mock search results
      const mockSearchResults = [
        {
          productId: 'product-1',
          productName: 'Test Product 1',
          score: 0.1,
          match: {
            type: 'image' as const,
            thumbUrl: 'https://example.com/image1.jpg',
          },
        },
      ];

      const { searchSimilarProducts, enrichSearchResults } = await import('../src/lib/search');
      vi.mocked(searchSimilarProducts).mockResolvedValue(mockSearchResults);
      vi.mocked(enrichSearchResults).mockReturnValue(mockSearchResults);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toEqual(mockSearchResults);
      expect(data.total).toBe(1);
      expect(data.query.fileName).toBe('test.jpg');
    });

    it('should handle embedding service errors', async () => {
      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);

      const request = new NextRequest('https://example.com/api/search/by-image', {
        method: 'POST',
        body: formData,
        headers: {
          'x-tenant-slug': 'test-tenant',
        },
      });

      const { getTenantFromRequest } = await import('../src/lib/tenant');
      vi.mocked(getTenantFromRequest).mockResolvedValue({
        clientId: 'client-123',
        slug: 'test-tenant',
      });

      // Mock embedding service error
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      } as Response);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toContain('Failed to process image');
    });
  });

  describe('GET /api/search/by-image', () => {
    it('should return service information', async () => {
      // Mock embedding service health check
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      } as Response);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.service).toBe('Search by Image API');
      expect(data.status).toBe('operational');
      expect(data.endpoints).toHaveProperty('search');
      expect(data.endpoints).toHaveProperty('health');
      expect(data.configuration).toHaveProperty('maxFileSize');
      expect(data.configuration).toHaveProperty('allowedTypes');
    });

    it('should handle embedding service unavailable', async () => {
      // Mock embedding service unavailable
      vi.mocked(fetch).mockRejectedValue(new Error('Connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.configuration.embeddingServiceStatus).toBe('unavailable');
    });
  });
});
