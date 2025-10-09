import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { generateSignedUrl } from '@/lib/aws'

interface GuestJWTPayload {
  type: string
  clientId: string
  clientSlug: string
  clientName: string
}

function getGuestFromRequest(request: NextRequest): { clientId: string } | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as GuestJWTPayload
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

// Helper function to process media and generate signed URLs
async function processMediaWithUrls(products: any[]): Promise<any[]> {
  const processedProducts = await Promise.all(
    products.map(async (product) => {
      let processedMedia = []
      let processedImages = []
      let processedVideos = []
      
      // Process media from productMedia relationships
      if (product.productMedia && product.productMedia.length > 0) {
        processedMedia = await Promise.all(
          product.productMedia.map(async (pm: any) => {
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
        
        processedImages = processedMedia.filter(m => m.kind === 'image')
        processedVideos = processedMedia.filter(m => m.kind === 'video')
      }
      
      // Process legacy images field
      if (product.images && product.images.length > 0) {
        const legacyImages = await Promise.all(
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
        processedImages = [...processedImages, ...legacyImages]
      }
      
      // Process legacy videos field
      if (product.videos && product.videos.length > 0) {
        const legacyVideos = await Promise.all(
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
        processedVideos = [...processedVideos, ...legacyVideos]
      }
      
      let thumbnailUrl = product.thumbnailUrl
      if (!thumbnailUrl && processedImages.length > 0) {
        thumbnailUrl = processedImages[0].url
      }
      
      return {
        ...product,
        media: processedMedia,
        images: processedImages,
        videos: processedVideos,
        thumbnailUrl: thumbnailUrl
      }
    })
  )
  
  return processedProducts
}

// GET /api/guest/products - Get products for guest view
export async function GET(request: NextRequest) {
  try {
    const guest = getGuestFromRequest(request)
    
    if (!guest) {
      return NextResponse.json(
        { error: 'Guest authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12
    const search = searchParams.get('search') || undefined
    const category = searchParams.get('category') || undefined
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      clientId: guest.clientId,
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.categoryId = category
    }

    // Build orderBy
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [products, total, client] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          sku: true,
          description: true,
          price: true,
          category: true,
          categoryId: true,
          images: true,
          videos: true,
          thumbnailUrl: true,
          productMedia: {
            select: {
              isPrimary: true,
              sortOrder: true,
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
          }
        }
      }),
      prisma.product.count({ where }),
      prisma.client.findUnique({
        where: { id: guest.clientId },
        select: {
          name: true,
          logo: true,
          slug: true
        }
      })
    ])

    // Process media to generate signed URLs
    const processedProducts = await processMediaWithUrls(products)

    return NextResponse.json({
      products: processedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      client
    })
  } catch (error) {
    console.error('Error fetching guest products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

