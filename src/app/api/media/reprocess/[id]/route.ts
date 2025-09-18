import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { withJWTValidation, JWTPayload } from '@/lib/jwt';
import { createApiLogger, PerformanceTimer } from '@/lib/log';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

interface ReprocessParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/media/reprocess/[id]
 * 
 * Reprocess a media item by setting its status to 'pending' and clearing any errors
 * This will trigger the embedding generation process for the media item
 */
async function handleReprocessMedia(
  request: NextRequest,
  user: JWTPayload
) {
  const params = { id: request.url.split('/').pop() || '' };
  const timer = new PerformanceTimer('media_reprocess');
  let logger = createApiLogger('/api/media/reprocess');
  
  try {
    // Resolve tenant from request
    const { clientId, slug } = await getTenantFromRequest(request);
    logger = logger.child({ 
      tenantSlug: slug,
      userId: user.userId,
      userRole: user.role 
    });

    const mediaId = params.id;

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Validate mediaId is a valid BigInt
    let parsedMediaId: bigint;
    try {
      parsedMediaId = BigInt(mediaId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid media ID format' },
        { status: 400 }
      );
    }

    // Check if media exists and belongs to the tenant
    const existingMedia = await prisma.media.findFirst({
      where: {
        id: parsedMediaId,
        clientId: clientId,
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

    if (!existingMedia) {
      return NextResponse.json(
        { error: 'Media not found or access denied' },
        { status: 404 }
      );
    }

    // Update media status to pending and clear error
    const updatedMedia = await prisma.media.update({
      where: {
        id: parsedMediaId,
      },
      data: {
        status: 'pending',
        error: null,
        updatedAt: new Date(),
      },
    });

    // Log the reprocess action
    console.log(`Media ${mediaId} queued for reprocessing by tenant ${clientId}`);

    // TODO: In a production system, you would:
    // 1. Add the media to a processing queue (Redis, SQS, etc.)
    // 2. Trigger the embedding generation worker
    // 3. Send a webhook notification if configured
    // 4. Update a processing status table

    return NextResponse.json({
      success: true,
      message: 'Media queued for reprocessing',
      media: {
        id: updatedMedia.id.toString(),
        status: updatedMedia.status,
        s3Key: updatedMedia.s3Key,
        product: {
          id: existingMedia.product.id,
          name: existingMedia.product.name,
          sku: existingMedia.product.sku,
        },
      },
    });

  } catch (error: any) {
    console.error('Reprocess media error:', error);

    // Handle tenant resolution errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid tenant' },
        { status: 401 }
      );
    }

    // Handle database errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Handle other errors
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
export const POST = rateLimit(rateLimitConfigs.mediaReprocess)(withJWTValidation(handleReprocessMedia));

/**
 * GET /api/media/reprocess/[id]
 * 
 * Get the current status of a media item
 */
export async function GET(
  request: NextRequest,
  { params }: ReprocessParams
) {
  try {
    // Resolve tenant from request
    const { clientId } = await getTenantFromRequest(request);

    const mediaId = params.id;

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Media ID is required' },
        { status: 400 }
      );
    }

    // Validate mediaId is a valid BigInt
    let parsedMediaId: bigint;
    try {
      parsedMediaId = BigInt(mediaId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid media ID format' },
        { status: 400 }
      );
    }

    // Get media details
    const media = await prisma.media.findFirst({
      where: {
        id: parsedMediaId,
        clientId: clientId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        imageEmbedding: {
          select: {
            mediaId: true,
          },
        },
        videoFrames: {
          select: {
            id: true,
            tsMs: true,
            frameS3Key: true,
            frameEmbedding: {
              select: {
                frameId: true,
              },
            },
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate processing statistics
    const hasImageEmbedding = !!media.imageEmbedding;
    const videoFrameCount = media.videoFrames.length;
    const videoFrameEmbeddingCount = media.videoFrames.filter(
      frame => frame.frameEmbedding
    ).length;

    return NextResponse.json({
      success: true,
      media: {
        id: media.id.toString(),
        s3Key: media.s3Key,
        kind: media.kind,
        status: media.status,
        error: media.error,
        width: media.width,
        height: media.height,
        durationMs: media.durationMs,
        createdAt: media.createdAt,
        updatedAt: media.updatedAt,
        product: media.product,
        processing: {
          hasImageEmbedding,
          videoFrameCount,
          videoFrameEmbeddingCount,
          isFullyProcessed: media.kind === 'image' 
            ? hasImageEmbedding 
            : videoFrameCount > 0 && videoFrameEmbeddingCount === videoFrameCount,
        },
      },
    });

  } catch (error: any) {
    console.error('Get media status error:', error);

    // Handle tenant resolution errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid tenant' },
        { status: 401 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}