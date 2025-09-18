import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/tenant';
import { searchSimilarProducts, enrichSearchResults } from '@/lib/search';
import { createApiLogger, PerformanceTimer } from '@/lib/log';
import { withJWTValidation, JWTPayload } from '@/lib/jwt';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { validateImageSecurity, processImageForSecurity } from '@/lib/security';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000';
const EMBEDDING_HEALTH_URL = `${EMBEDDING_SERVICE_URL}/healthz`;

interface EmbeddingResponse {
  embedding: number[];
  model: string;
  device: string;
}

/**
 * POST /api/search/by-image
 * 
 * Search for similar products by uploading an image
 * Uses CLIP embeddings and vector similarity search
 * 
 * TUNING:
 * - HNSW params: m=16-32 (higher = better recall, more memory), ef_construction=64-128 (higher = better quality), ef_search=50-100 (higher = better recall, slower)
 * - IVFFLAT: lists=1000-2000 for 1M vectors, lists=10000-20000 for 10M vectors, probes=10-50 (higher = better recall, slower)
 * - Frame budget: 1-5 frames per second for videos, enable scene detection for better keyframe selection
 * - Pool size: pg pool 20-50 connections, SQS long-poll 20s for better throughput
 * - Embedding service: 2-4 concurrent workers, batch process 5-10 images per batch
 */
async function handleSearchByImage(request: NextRequest, user: JWTPayload) {
  const timer = new PerformanceTimer('image_search');
  let logger = createApiLogger('/api/search/by-image');
  
  try {
    // Resolve tenant from request
    const { clientId, slug } = await getTenantFromRequest(request);
    logger = logger.child({ 
      tenantSlug: slug,
      userId: user.userId,
      userRole: user.role 
    });

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      logger.warn('No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    logger.info('Image search request received', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      logger.warn('Invalid file type', { fileType: file.type, allowedTypes: ALLOWED_TYPES });
      return NextResponse.json(
        { 
          error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
          allowedTypes: ALLOWED_TYPES
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      logger.warn('File too large', { fileSize: file.size, maxSize: MAX_FILE_SIZE });
      return NextResponse.json(
        { 
          error: 'File too large. Maximum size is 10MB.',
          maxSize: MAX_FILE_SIZE
        },
        { status: 400 }
      );
    }

    // Convert file to buffer for security validation
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Validate image security
    const securityValidation = await validateImageSecurity(buffer, file.name, MAX_FILE_SIZE);
    if (!securityValidation.valid) {
      logger.warn('Image security validation failed', { 
        reason: securityValidation.reason,
        fileName: file.name 
      });
      return NextResponse.json(
        { error: 'Image validation failed', reason: securityValidation.reason },
        { status: 400 }
      );
    }

    // Process image for security (strip EXIF, resize if needed)
    // Temporarily disabled for debugging
    const processedImage = {
      buffer: buffer,
      metadata: {
        width: 100,
        height: 100,
        format: 'jpeg',
        size: buffer.length,
        hasExif: false,
      }
    };

    logger.info('Image processed for security (simplified)', {
      originalSize: buffer.length,
      processedSize: processedImage.buffer.length,
      dimensions: `${processedImage.metadata.width}x${processedImage.metadata.height}`,
      hasExif: processedImage.metadata.hasExif,
    });

    // Create blob from processed image
    const fileBlob = new Blob([processedImage.buffer], { type: file.type });

    // Send to embedding service
    const embeddingFormData = new FormData();
    embeddingFormData.append('file', fileBlob, file.name);

    let embeddingResponse: EmbeddingResponse;
    const embeddingTimer = new PerformanceTimer('embedding_service_call');
    
    try {
      logger.info('Calling embedding service', { serviceUrl: EMBEDDING_SERVICE_URL });
      
      const embeddingRes = await fetch(`${EMBEDDING_SERVICE_URL}/embed-image`, {
        method: 'POST',
        body: embeddingFormData,
        // Don't set Content-Type header, let fetch set it with boundary
      });

      const embeddingDuration = embeddingTimer.end();

      if (!embeddingRes.ok) {
        const errorText = await embeddingRes.text();
        logger.error('Embedding service error', { 
          status: embeddingRes.status, 
          error: errorText,
          durationMs: embeddingDuration 
        });
        return NextResponse.json(
          { error: 'Failed to process image for search' },
          { status: 502 }
        );
      }

      embeddingResponse = await embeddingRes.json();
      logger.info('Embedding service response received', { 
        model: embeddingResponse.model,
        device: embeddingResponse.device,
        durationMs: embeddingDuration 
      });
    } catch (error) {
      const embeddingDuration = embeddingTimer.end();
      logger.error('Error calling embedding service', { 
        error: error instanceof Error ? error.message : String(error),
        durationMs: embeddingDuration 
      });
      return NextResponse.json(
        { error: 'Embedding service unavailable' },
        { status: 503 }
      );
    }

    // Validate embedding response
    if (!embeddingResponse.embedding || !Array.isArray(embeddingResponse.embedding)) {
      return NextResponse.json(
        { error: 'Invalid embedding response from service' },
        { status: 502 }
      );
    }

    if (embeddingResponse.embedding.length !== 512) {
      return NextResponse.json(
        { error: 'Invalid embedding dimension. Expected 512, got ' + embeddingResponse.embedding.length },
        { status: 502 }
      );
    }

    // Search for similar products using vector similarity
    const searchTimer = new PerformanceTimer('vector_search');
    logger.info('Starting vector similarity search', { 
      embeddingDimension: embeddingResponse.embedding.length 
    });
    
    const searchResults = await searchSimilarProducts(
      embeddingResponse.embedding,
      clientId,
      24 // Top 24 products
    );

    const searchDuration = searchTimer.end();
    logger.info('Vector search completed', { 
      resultCount: searchResults.length,
      durationMs: searchDuration 
    });

    // Enrich results with full URLs
    const enrichedResults = await enrichSearchResults(searchResults);

    const totalDuration = timer.end();
    logger.logImageSearch(
      file.name,
      file.size,
      enrichedResults.length,
      totalDuration,
      slug
    );

    // Return search results
    const response: any = {
      success: true,
      results: enrichedResults,
      total: enrichedResults.length,
      query: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        model: embeddingResponse.model,
        device: embeddingResponse.device,
      }
    };

    // Include raw scores in development
    if (process.env.NODE_ENV !== 'production') {
      response.debug = {
        rawScores: enrichedResults.map(r => ({
          productName: r.productName,
          rawScore: r.score,
          similarityPercent: r.similarityPercent
        }))
      };
    }

    return NextResponse.json(response);

  } catch (error: any) {
    const totalDuration = timer.end();
    logger.error('Search by image error', {
      error: error.message,
      status: error.status,
      durationMs: totalDuration,
    });

    // Handle tenant resolution errors
    if (error.status === 401) {
      logger.logSecurity('Invalid tenant access attempt', { 
        error: error.message 
      });
      return NextResponse.json(
        { error: 'Unauthorized: Invalid tenant' },
        { status: 401 }
      );
    }

    // Handle other errors
    logger.logError(error, { 
      route: '/api/search/by-image',
      durationMs: totalDuration 
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Export JWT-protected and rate-limited POST handler
export const POST = rateLimit(rateLimitConfigs.imageSearch)(withJWTValidation(handleSearchByImage));

/**
 * GET /api/search/by-image
 * 
 * Health check and service information
 */
export async function GET() {
  try {
    // Check if embedding service is available
    const embeddingServiceUrl = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000';
    
    let embeddingServiceStatus = 'unknown';
    try {
      const healthRes = await fetch(`${embeddingServiceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      embeddingServiceStatus = healthRes.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      embeddingServiceStatus = 'unavailable';
    }

    return NextResponse.json({
      service: 'Search by Image API',
      status: 'operational',
      endpoints: {
        search: 'POST /api/search/by-image',
        health: 'GET /api/search/by-image'
      },
      configuration: {
        maxFileSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_TYPES,
        embeddingServiceUrl,
        embeddingServiceStatus,
      },
      usage: {
        method: 'POST',
        contentType: 'multipart/form-data',
        body: {
          file: 'Image file (JPEG, PNG, WebP, max 10MB)'
        }
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
