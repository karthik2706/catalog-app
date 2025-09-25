import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

// GET /api/media/analytics - Get media analytics
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
    const productId = searchParams.get('productId')
    const timeRange = searchParams.get('timeRange') || '30' // days

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(timeRange))

    // Build where clause
    const where: any = { 
      product: { clientId }
    }
    
    if (productId) {
      where.productId = productId
    }

    // Get media statistics
    const [
      totalMedia,
      mediaByType,
      mediaByStatus,
      recentUploads,
      totalFileSize,
      averageFileSize,
      mediaWithoutMetadata,
      productsWithMedia,
      productsWithoutMedia
    ] = await Promise.all([
      // Total media count
      prisma.media.count({ where }),
      
      // Media by type
      prisma.media.groupBy({
        by: ['kind'],
        where,
        _count: { kind: true },
        _sum: { fileSize: true }
      }),
      
      // Media by status
      prisma.media.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      }),
      
      // Recent uploads
      prisma.media.findMany({
        where: {
          ...where,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          product: {
            select: { sku: true, name: true }
          }
        }
      }),
      
      // Total file size
      prisma.media.aggregate({
        where,
        _sum: { fileSize: true }
      }),
      
      // Average file size
      prisma.media.aggregate({
        where,
        _avg: { fileSize: true }
      }),
      
      // Media without metadata
      prisma.media.count({
        where: {
          ...where,
          kind: 'image',
          OR: [
            { width: null },
            { height: null }
          ]
        }
      }),
      
      // Products with media
      prisma.product.count({
        where: {
          clientId,
          mediaItems: {
            some: {}
          }
        }
      }),
      
      // Products without media
      prisma.product.count({
        where: {
          clientId,
          mediaItems: {
            none: {}
          }
        }
      })
    ])

    // Calculate additional metrics
    const totalProducts = productsWithMedia + productsWithoutMedia
    const mediaCoverage = totalProducts > 0 ? (productsWithMedia / totalProducts) * 100 : 0

    // Get top products by media count
    const topProductsByMedia = await prisma.product.findMany({
      where: { clientId },
      include: {
        _count: {
          select: { mediaItems: true }
        }
      },
      orderBy: {
        mediaItems: {
          _count: 'desc'
        }
      },
      take: 5
    })

    // Get media upload trends (daily for last 30 days) - simplified approach
    const recentMedia = await prisma.media.findMany({
      where: {
        ...where,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        createdAt: true,
        fileSize: true
      }
    })

    // Format daily trends
    const dailyTrends = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayMedia = recentMedia.filter(media => 
        media.createdAt.toISOString().split('T')[0] === dateStr
      )
      
      dailyTrends.push({
        date: dateStr,
        uploads: dayMedia.length,
        totalSize: dayMedia.reduce((sum, media) => sum + media.fileSize, 0)
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const analytics = {
      overview: {
        totalMedia,
        totalFileSize: totalFileSize._sum.fileSize || 0,
        averageFileSize: Math.round(averageFileSize._avg.fileSize || 0),
        mediaCoverage: Math.round(mediaCoverage * 100) / 100,
        productsWithMedia,
        productsWithoutMedia
      },
      byType: mediaByType.map(type => ({
        kind: type.kind,
        count: type._count.kind,
        totalSize: type._sum.fileSize || 0,
        percentage: totalMedia > 0 ? Math.round((type._count.kind / totalMedia) * 100) : 0
      })),
      byStatus: mediaByStatus.map(status => ({
        status: status.status,
        count: status._count.status,
        percentage: totalMedia > 0 ? Math.round((status._count.status / totalMedia) * 100) : 0
      })),
      recentUploads: recentUploads.map(media => ({
        id: media.id,
        originalName: media.originalName,
        kind: media.kind,
        fileSize: media.fileSize,
        createdAt: media.createdAt,
        product: media.product
      })),
      topProductsByMedia: topProductsByMedia.map(product => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        mediaCount: product._count.mediaItems
      })),
      dailyTrends,
      issues: {
        mediaWithoutMetadata,
        needsAttention: mediaWithoutMetadata > 0
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching media analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media analytics' },
      { status: 500 }
    )
  }
}
