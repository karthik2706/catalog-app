import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

function getClientIdFromRequest(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return decoded.clientId || null
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

// DELETE /api/media/bulk - Bulk delete media files
export async function DELETE(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('JSON parsing error:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const { mediaIds } = body

    if (!mediaIds || !Array.isArray(mediaIds)) {
      return NextResponse.json(
        { error: 'Media IDs array is required' },
        { status: 400 }
      )
    }

    if (mediaIds.length === 0) {
      return NextResponse.json(
        { error: 'No media files to delete' },
        { status: 400 }
      )
    }

    if (mediaIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 media files can be deleted at once' },
        { status: 400 }
      )
    }

    // Verify all media files exist and belong to the client
    const mediaFiles = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        s3Key: {
          startsWith: `clients/${clientId}/`
        }
      },
      include: {
        productMedia: {
          include: {
            product: true
          }
        }
      }
    })

    if (mediaFiles.length !== mediaIds.length) {
      return NextResponse.json(
        { error: 'Some media files not found or don\'t belong to your organization' },
        { status: 404 }
      )
    }

    // Delete media files and related data
    const deletedCount = await prisma.$transaction(async (tx) => {
      // Delete from S3 first
      for (const media of mediaFiles) {
        try {
          // Delete main file
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: media.s3Key
          })
          await s3Client.send(deleteCommand)

          // Delete thumbnail if it exists
          if (media.kind === 'image') {
            const thumbnailKey = media.s3Key.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '_thumb.jpg')
            const deleteThumbnailCommand = new DeleteObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: thumbnailKey
            })
            await s3Client.send(deleteThumbnailCommand)
          }
        } catch (error) {
          console.error(`Error deleting ${media.s3Key} from S3:`, error)
          // Continue with database deletion even if S3 deletion fails
        }

        // Handle primary media reassignment for each product that had this media
        for (const productMedia of media.productMedia) {
          if (productMedia.isPrimary) {
            const nextProductMedia = await tx.productMedia.findFirst({
              where: { 
                productId: productMedia.productId,
                mediaId: { not: media.id }
              },
              orderBy: { sortOrder: 'asc' }
            })

            if (nextProductMedia) {
              await tx.productMedia.update({
                where: { id: nextProductMedia.id },
                data: { isPrimary: true }
              })
            }
          }
        }
      }

      // Delete from junction table first
      await tx.productMedia.deleteMany({
        where: { mediaId: { in: mediaIds } }
      })

      // Delete from database
      const result = await tx.media.deleteMany({
        where: { id: { in: mediaIds } }
      })

      return result.count
    })

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount} media file${deletedCount !== 1 ? 's' : ''}`,
      deletedCount,
      deletedMedia: mediaFiles.map(m => ({ id: m.id, originalName: m.originalName, s3Key: m.s3Key }))
    })

  } catch (error) {
    console.error('Error deleting media files:', error)
    return NextResponse.json(
      { error: 'Failed to delete media files' },
      { status: 500 }
    )
  }
}

