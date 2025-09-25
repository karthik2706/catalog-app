import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
}

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

// GET /api/media/assets - Get all media assets for a client
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
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // image, video, audio, document
    const folder = searchParams.get('folder')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const assigned = searchParams.get('assigned') // true, false, or null for all

    // Build where clause
    const where: any = {
      s3Key: {
        startsWith: `clients/${clientId}/media/`
      }
    }

    if (type) {
      where.kind = type
    }

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
        { caption: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (assigned === 'true') {
      where.productId = { not: null }
    } else if (assigned === 'false') {
      where.productId = null
    }

    // Get total count
    const total = await prisma.media.count({ where })

    // Get media assets
    const mediaAssets = await prisma.media.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        kind: true,
        s3Key: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        width: true,
        height: true,
        durationMs: true,
        altText: true,
        caption: true,
        isPrimary: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    })

    // Generate URLs for each asset
    const assetsWithUrls = mediaAssets.map(asset => ({
      ...asset,
      url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${asset.s3Key}`,
      thumbnailUrl: asset.kind === 'image' 
        ? `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${asset.s3Key}`
        : null,
      folder: asset.s3Key.split('/')[3] || 'general', // Extract folder from S3 key
      assigned: !!asset.product,
      productName: asset.product?.name || null,
      productSku: asset.product?.sku || null
    }))

    // Get folder statistics
    const folderStats = await prisma.media.groupBy({
      by: ['kind'],
      where: {
        s3Key: {
          startsWith: `clients/${clientId}/media/`
        }
      },
      _count: {
        id: true
      },
      _sum: {
        fileSize: true
      }
    })

    return NextResponse.json({
      success: true,
      assets: assetsWithUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total: total,
        byType: folderStats.reduce((acc, stat) => {
          acc[stat.kind] = {
            count: stat._count.id,
            totalSize: stat._sum.fileSize || 0
          }
          return acc
        }, {} as Record<string, { count: number, totalSize: number }>)
      }
    })

  } catch (error) {
    console.error('Error fetching media assets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media assets' },
      { status: 500 }
    )
  }
}
