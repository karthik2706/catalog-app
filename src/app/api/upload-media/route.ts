import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3_CONFIG, validateFileType, generateS3Key } from '@/lib/aws'
import { processImageFile, processVideoFile, uploadToS3 } from '@/lib/s3-upload'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { validateImageSecurity, processImageForSecurity, generateSecureFilename, sanitizeS3Key } from '@/lib/security'
import { createApiLogger, PerformanceTimer } from '@/lib/log'

// Configure body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

function getClientIdFromRequest(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  console.log('Token received:', token ? `${token.substring(0, 20)}...` : 'No token')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      console.log('Decoded token:', decoded)
      return decoded.clientId || null
    } catch (error) {
      console.error('Error decoding token:', error)
      console.error('Token length:', token.length)
      console.error('Token starts with:', token.substring(0, 10))
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check content length before processing
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 413 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const sku = formData.get('sku') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!sku) {
      return NextResponse.json(
        { error: 'Product SKU is required for file organization' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFileType(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Security validation and processing
    const logger = createApiLogger('/api/upload-media');
    const timer = new PerformanceTimer('media_upload');
    
    // Validate image security
    const securityValidation = await validateImageSecurity(buffer, file.name, 50 * 1024 * 1024);
    if (!securityValidation.valid) {
      logger.warn('Image security validation failed', { 
        reason: securityValidation.reason,
        fileName: file.name,
        clientId 
      });
      return NextResponse.json(
        { error: 'Image validation failed', reason: securityValidation.reason },
        { status: 400 }
      );
    }

    // Process image for security if it's an image
    let processedBuffer = buffer;
    if (file.type.startsWith('image/')) {
      const processedImage = await processImageForSecurity(buffer, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 85,
        stripExif: true,
        stripMetadata: true,
      });
      
      processedBuffer = processedImage.buffer;
      
      logger.info('Image processed for security', {
        originalSize: buffer.length,
        processedSize: processedBuffer.length,
        dimensions: `${processedImage.metadata.width}x${processedImage.metadata.height}`,
        hasExif: processedImage.metadata.hasExif,
        clientId,
      });
    }

    let processedFile
    let uploadResult

    try {
      // Determine file type
      let fileType: 'image' | 'video' = 'image'
      if (S3_CONFIG.allowedFileTypes.images.includes(file.type)) {
        fileType = 'image'
        processedFile = await processImageFile(processedBuffer, file.name, file.type)
      } else if (S3_CONFIG.allowedFileTypes.videos.includes(file.type)) {
        fileType = 'video'
        processedFile = await processVideoFile(processedBuffer, file.name, file.type)
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type' },
          { status: 400 }
        )
      }

      // Upload to S3 with proper folder structure
      uploadResult = await uploadToS3(processedFile, clientId, sku, fileType)

      if (!uploadResult.success) {
        logger.error('S3 upload failed', { 
          error: uploadResult.error,
          fileName: file.name,
          clientId 
        });
        return NextResponse.json(
          { error: uploadResult.error || 'Upload failed' },
          { status: 500 }
        )
      }

      // Log successful upload
      const uploadDuration = timer.end();
      logger.logMediaUpload(
        file.name,
        processedBuffer.length,
        file.type,
        uploadResult.s3Key || 'unknown',
        clientId
      );

      // Find the product by SKU to get productId
      const product = await prisma.product.findFirst({
        where: {
          sku: sku,
          clientId: clientId,
        },
        select: {
          id: true,
        },
      })

      if (!product) {
        console.warn(`Product not found for SKU: ${sku} in client: ${clientId}`)
        // Continue with upload success but log the warning
      }

      // Create or upsert Media row for the uploaded file
      let mediaRow = null
      if (product && uploadResult.key) {
        try {
          // Get image dimensions if it's an image
          let width: number | undefined
          let height: number | undefined
          let durationMs: number | undefined

          if (fileType === 'image') {
            try {
              const sharp = require('sharp')
              const metadata = await sharp(processedFile.buffer).metadata()
              width = metadata.width
              height = metadata.height
            } catch (error) {
              console.warn('Could not extract image dimensions:', error)
            }
          }

          // For videos, duration would need to be extracted using ffmpeg
          // For now, we'll leave it undefined
          if (fileType === 'video') {
            // TODO: Extract video duration using ffmpeg
            durationMs = undefined
          }

          mediaRow = await prisma.media.upsert({
            where: {
              s3Key: uploadResult.key,
            },
            create: {
              productId: product.id,
              clientId: clientId,
              kind: fileType,
              s3Key: uploadResult.key,
              width: width,
              height: height,
              durationMs: durationMs,
              status: 'pending',
            },
            update: {
              // Update metadata if the file is re-uploaded
              width: width,
              height: height,
              durationMs: durationMs,
              status: 'pending', // Reset to pending for reprocessing
              error: null, // Clear any previous errors
              updatedAt: new Date(),
            },
          })

          console.log(`Created/updated Media row for ${fileType}: ${uploadResult.key}`)
        } catch (error) {
          console.error('Failed to create Media row:', error)
          // Don't fail the upload if Media row creation fails
        }
      }

      return NextResponse.json({
        success: true,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        key: uploadResult.key,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        mediaId: mediaRow?.id, // Include Media row ID if created
      })

      // TODO: Backfill Media rows for historical Product.images/videos JSON data
      // This should be implemented as a separate migration script that:
      // 1. Iterates through all products with existing images/videos JSON
      // 2. Creates Media rows for each URL in the JSON arrays
      // 3. Extracts metadata (width, height, duration) where possible
      // 4. Sets status to 'completed' for existing media
      // 5. Generates embeddings for existing media (separate worker process)

    } catch (error) {
      console.error('File processing error:', error)
      return NextResponse.json(
        { error: `File processing failed: ${error.message}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to generate signed URLs for private files
export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600')

    if (!key) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      )
    }

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'quick-stock-media',
      Key: key,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresIn,
    })

  } catch (error) {
    console.error('Signed URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    )
  }
}
