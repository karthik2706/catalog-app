import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { generateSignedUrl } from '@/lib/aws'
import { cookies } from 'next/headers'

interface GuestJWTPayload {
  type: string
  clientId: string
  clientSlug: string
  clientName: string
}

async function getGuestFromRequest(request: NextRequest): Promise<{ clientId: string } | null> {
  let token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    if (slug) {
      const cookieStore = await cookies()
      token = cookieStore.get(`guest_token_${slug}`)?.value || null
    }
  }
  
  if (token) {
    try {
      const secret = process.env.JWT_SECRET
      if (!secret) {
        throw new Error('JWT_SECRET not configured')
      }
      const decoded = jwt.verify(token, secret) as GuestJWTPayload
      if (decoded.type === 'guest') {
        return {
          clientId: decoded.clientId
        }
      }
    } catch (error) {
      console.error('Error decoding guest token:', error)
    }
  }
  return null
}

// GET /api/guest/products/[id] - Get single product for guest view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const guest = await getGuestFromRequest(request)
    
    if (!guest) {
      return NextResponse.json(
        { error: 'Guest authentication required' },
        { status: 401 }
      )
    }

    const product = await prisma.product.findFirst({
      where: {
        id,
        clientId: guest.clientId,
        isActive: true,
      },
      include: {
        productMedia: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' }
          ],
          include: {
            media: {
              select: {
                id: true,
                kind: true,
                s3Key: true,
                originalName: true,
                mimeType: true,
                width: true,
                height: true,
                durationMs: true,
                altText: true,
                caption: true,
                status: true,
                createdAt: true,
              }
            }
          }
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
              }
            }
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Process media to generate signed URLs
    const processedMedia = await Promise.all(
      product.productMedia.map(async (pm) => {
        const media = pm.media
        try {
          const signedUrl = await generateSignedUrl(media.s3Key, 7 * 24 * 60 * 60)
          return {
            ...media,
            url: signedUrl,
            isPrimary: pm.isPrimary,
            sortOrder: pm.sortOrder
          }
        } catch (error) {
          console.error('Error generating signed URL:', error)
          return {
            ...media,
            url: null,
            isPrimary: pm.isPrimary,
            sortOrder: pm.sortOrder
          }
        }
      })
    )

    const images = processedMedia.filter(m => m.kind === 'image')
    const videos = processedMedia.filter(m => m.kind === 'video')
    const thumbnailUrl = images.length > 0 ? images[0].url : product.thumbnailUrl

    // Process legacy images/videos if they exist
    let legacyImages: any[] = []
    let legacyVideos: any[] = []

    if (product.images && Array.isArray(product.images)) {
      legacyImages = await Promise.all(
        product.images.map(async (image: any) => {
          try {
            const s3Key = image.key || image.s3Key
            if (s3Key) {
              const signedUrl = await generateSignedUrl(s3Key, 7 * 24 * 60 * 60)
              return {
                ...image,
                url: signedUrl
              }
            }
            return image
          } catch (error) {
            return image
          }
        })
      )
    }

    if (product.videos && Array.isArray(product.videos)) {
      legacyVideos = await Promise.all(
        product.videos.map(async (video: any) => {
          try {
            const s3Key = video.key || video.s3Key
            if (s3Key) {
              const signedUrl = await generateSignedUrl(s3Key, 7 * 24 * 60 * 60)
              return {
                ...video,
                url: signedUrl
              }
            }
            return video
          } catch (error) {
            return video
          }
        })
      )
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: product.price,
        category: product.category,
        categoryId: product.categoryId,
        categories: product.categories.map(pc => pc.category),
        images: [...images.map(m => m.url), ...legacyImages.map(img => img.url || img).filter(Boolean)],
        videos: [...videos.map(m => m.url), ...legacyVideos.map(vid => vid.url || vid).filter(Boolean)],
        media: processedMedia,
        thumbnailUrl: thumbnailUrl || images[0]?.url,
        allowPreorder: product.allowPreorder,
        stockLevel: product.stockLevel, // Show stock level to guests
      }
    })
  } catch (error) {
    console.error('Error fetching guest product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

