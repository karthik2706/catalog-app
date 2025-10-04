import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { searchSimilarProducts } from '@/lib/search';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  clientId?: string;
  clientSlug?: string;
}

function getClientIdFromRequest(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
      return decoded.clientId || null;
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }
  return null;
}

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000';

interface EmbeddingResponse {
  embedding: number[];
  model: string;
  device: string;
}

/**
 * POST /api/search/by-image-simple
 * 
 * Simplified search for similar products by uploading an image
 * Uses CLIP embeddings and vector similarity search
 */
export async function POST(request: NextRequest) {
  try {
    // Get client ID from JWT token
    const clientId = getClientIdFromRequest(request);
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('Image search request received', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      clientId
    });

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
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
      return NextResponse.json(
        { 
          error: 'File too large. Maximum size is 10MB.',
          maxSize: MAX_FILE_SIZE
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Generate embedding using the embedding service
    const embeddingFormData = new FormData();
    embeddingFormData.append('file', new Blob([buffer], { type: file.type }), file.name);

    console.log('Sending request to embedding service...');
    const embeddingResponse = await fetch(`${EMBEDDING_SERVICE_URL}/embed-image`, {
      method: 'POST',
      body: embeddingFormData,
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Embedding service error:', errorText);
      return NextResponse.json(
        { error: 'Failed to process image for search' },
        { status: 500 }
      );
    }

    const embeddingData = await embeddingResponse.json() as EmbeddingResponse;
    
    if (!embeddingData.embedding || !Array.isArray(embeddingData.embedding)) {
      return NextResponse.json(
        { error: 'Invalid embedding response from service' },
        { status: 500 }
      );
    }

    console.log('Embedding generated successfully', {
      dimension: embeddingData.embedding.length,
      model: embeddingData.model,
      device: embeddingData.device
    });

    // Search for similar products using vector similarity
    console.log('Starting vector similarity search...');
    const searchResults = await searchSimilarProducts(
      embeddingData.embedding,
      clientId,
      24 // Top 24 products
    );

    console.log('Vector search completed', { 
      resultCount: searchResults.length
    });

    // Return search results
    const response = {
      success: true,
      results: searchResults,
      total: searchResults.length,
      query: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        model: embeddingData.model,
        device: embeddingData.device,
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Search by image error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search/by-image-simple
 * 
 * Health check and service information
 */
export async function GET() {
  try {
    // Check if embedding service is available
    let embeddingServiceStatus = 'unknown';
    try {
      const healthRes = await fetch(`${EMBEDDING_SERVICE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      embeddingServiceStatus = healthRes.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      embeddingServiceStatus = 'unavailable';
    }

    return NextResponse.json({
      service: 'Search by Image API (Simple)',
      status: 'operational',
      endpoints: {
        search: 'POST /api/search/by-image-simple',
        health: 'GET /api/search/by-image-simple'
      },
      configuration: {
        maxFileSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_TYPES,
        embeddingServiceUrl: EMBEDDING_SERVICE_URL,
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
