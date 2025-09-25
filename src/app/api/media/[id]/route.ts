import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

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

// GET /api/media/[id] - Get specific media file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const media = await prisma.media.findFirst({
      where: { 
        id,
        product: { clientId }
      },
      include: {
        product: {
          select: { id: true, sku: true, name: true }
        }
      }
    })

    if (!media) {
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ media })
  } catch (error) {
    console.error('Error fetching media file:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media file' },
      { status: 500 }
    )
  }
}

// PATCH /api/media/[id] - Update media metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { altText, caption, sortOrder, isPrimary } = body

    // Verify media belongs to client
    const media = await prisma.media.findFirst({
      where: { 
        id,
        product: { clientId }
      },
      include: {
        product: true
      }
    })

    if (!media) {
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 }
      )
    }

    // If setting as primary, unset other primary files
    if (isPrimary) {
      await prisma.media.updateMany({
        where: { 
          productId: media.productId,
          isPrimary: true
        },
        data: { isPrimary: false }
      })
    }

    // Update media
    const updatedMedia = await prisma.media.update({
      where: { id },
      data: {
        ...(altText !== undefined && { altText }),
        ...(caption !== undefined && { caption }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isPrimary !== undefined && { isPrimary })
      }
    })

    return NextResponse.json({ 
      success: true,
      media: updatedMedia 
    })
  } catch (error) {
    console.error('Error updating media file:', error)
    return NextResponse.json(
      { error: 'Failed to update media file' },
      { status: 500 }
    )
  }
}

// DELETE /api/media/[id] - Delete media file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify media belongs to client
    const media = await prisma.media.findFirst({
      where: { 
        id,
        product: { clientId }
      },
      include: {
        product: true
      }
    })

    if (!media) {
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 }
      )
    }

    // Delete from S3
    try {
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
      console.error('Error deleting from S3:', error)
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    await prisma.media.delete({
      where: { id }
    })

    // If this was the primary media, set another one as primary
    if (media.isPrimary) {
      const nextMedia = await prisma.media.findFirst({
        where: { productId: media.productId },
        orderBy: { sortOrder: 'asc' }
      })

      if (nextMedia) {
        await prisma.media.update({
          where: { id: nextMedia.id },
          data: { isPrimary: true }
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Media file deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting media file:', error)
    return NextResponse.json(
      { error: 'Failed to delete media file' },
      { status: 500 }
    )
  }
}
