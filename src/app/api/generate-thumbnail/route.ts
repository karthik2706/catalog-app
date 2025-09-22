import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSignedUrl } from '@/lib/aws'
import { extractVideoThumbnail } from '@/lib/s3-upload'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

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

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { videoKey, sku } = await request.json()

    if (!videoKey || !sku) {
      return NextResponse.json(
        { error: 'Video key and SKU are required' },
        { status: 400 }
      )
    }

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
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    try {
      // Download the video from S3 to generate thumbnail
      const videoUrl = `https://quick-stock-media.s3.us-east-2.amazonaws.com/${videoKey}`
      const videoResponse = await fetch(videoUrl)
      
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`)
      }

      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
      
      // Generate thumbnail
      const thumbnailResult = await extractVideoThumbnail(videoBuffer, videoKey)
      
      // Upload thumbnail to S3
      const thumbnailKey = videoKey.replace('/video/', '/thumbnail/').replace(/\.[^/.]+$/, '.jpg')
      
      // Generate signed URL for thumbnail upload
      const thumbnailSignedUrl = await generateSignedUrl(thumbnailKey, 3600, 'PUT')
      
      const thumbnailUploadResponse = await fetch(thumbnailSignedUrl, {
        method: 'PUT',
        body: thumbnailResult.buffer,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      })

      if (!thumbnailUploadResponse.ok) {
        throw new Error(`Thumbnail upload failed: ${thumbnailUploadResponse.statusText}`)
      }

      // Generate public URL for thumbnail
      const thumbnailUrl = `https://quick-stock-media.s3.us-east-2.amazonaws.com/${thumbnailKey}`

      // Save thumbnail info to database
      await prisma.media.create({
        data: {
          productId: product.id,
          kind: 'image',
          s3Key: thumbnailKey,
          width: thumbnailResult.width,
          height: thumbnailResult.height,
          status: 'completed',
          clientId: clientId,
        },
      })

      return NextResponse.json({
        success: true,
        thumbnailUrl: thumbnailUrl,
        thumbnailKey: thumbnailKey,
      })

    } catch (error) {
      console.error('Thumbnail generation error:', error)
      return NextResponse.json(
        { error: 'Failed to generate thumbnail', details: error.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error generating thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to generate thumbnail' },
      { status: 500 }
    )
  }
}
