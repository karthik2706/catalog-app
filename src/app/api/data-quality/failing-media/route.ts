import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return decoded
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

// GET /api/data-quality/failing-media - Get media files that are failing to load
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const clientId = user.clientId
    if (!clientId && user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    // Build where clause based on user role
    const whereClause: any = {
      AND: [
        {
          OR: [
            { status: 'failed' },
            { status: 'error' },
            { error: { not: null } }
          ]
        }
      ]
    }

    // Filter by clientId unless user is MASTER_ADMIN
    if (clientId && user.role !== 'MASTER_ADMIN') {
      whereClause.AND.push({
        s3Key: {
          startsWith: `clients/${clientId}/`
        }
      })
    }

    // Find media files with error status or failed status
    const failingMedia = await prisma.media.findMany({
      where: whereClause,
      select: {
        id: true,
        kind: true,
        s3Key: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        status: true,
        error: true,
        createdAt: true,
        updatedAt: true,
        productMedia: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Generate signed URLs for media files (even if they're failing, we still want to show them)
    // Use Promise.allSettled to handle individual failures gracefully
    const mediaWithUrlsResults = await Promise.allSettled(
      failingMedia.map(async (media) => {
        let url = null
        let thumbnailUrl = null
        
        // Only try to generate URLs if S3 is configured
        if (process.env.S3_BUCKET_NAME && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
          try {
            const getObjectCommand = new GetObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: media.s3Key
            })
            url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 })

            if (media.kind === 'image') {
              const thumbnailKey = media.s3Key.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '_thumb.jpg')
              try {
                const getThumbnailCommand = new GetObjectCommand({
                  Bucket: process.env.S3_BUCKET_NAME,
                  Key: thumbnailKey
                })
                thumbnailUrl = await getSignedUrl(s3Client, getThumbnailCommand, { expiresIn: 3600 })
              } catch (error) {
                // Thumbnail might not exist, use main URL
                thumbnailUrl = url
              }
            }
          } catch (error) {
            console.error(`Error generating signed URL for media ${media.id}:`, error)
            // URL will remain null if generation fails - this is OK for failing media
          }
        }

        return {
          ...media,
          url,
          thumbnailUrl,
          associatedProducts: media.productMedia.map(pm => pm.product)
        }
      })
    )

    // Extract successful results, log failures but don't fail the entire request
    const mediaWithUrls = mediaWithUrlsResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`Failed to process media at index ${index}:`, result.reason)
        // Return the media without URLs if URL generation failed
        const media = failingMedia[index]
        return {
          ...media,
          url: null,
          thumbnailUrl: null,
          associatedProducts: media.productMedia.map(pm => pm.product)
        }
      }
    })

    return NextResponse.json({
      success: true,
      media: mediaWithUrls,
      count: mediaWithUrls.length
    })
  } catch (error: any) {
    console.error('Error fetching failing media:', error)
    const errorMessage = error?.message || 'Failed to fetch failing media'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

