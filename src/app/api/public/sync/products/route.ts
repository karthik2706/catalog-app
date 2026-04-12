import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSignedUrl } from '@/lib/aws'
import { requireApiKeyPermission } from '@/lib/public-sync'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100
const SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiKeyPermission(request, 'products:read')
    if ('response' in authResult) {
      return authResult.response
    }

    const { apiKey, clientSlug } = authResult
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10), 1),
      MAX_LIMIT
    )
    const updatedAfterParam = searchParams.get('updatedAfter')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let updatedAfter: Date | null = null
    if (updatedAfterParam) {
      updatedAfter = new Date(updatedAfterParam)
      if (Number.isNaN(updatedAfter.getTime())) {
        return NextResponse.json(
          { error: 'Invalid updatedAfter value. Use an ISO 8601 timestamp.' },
          { status: 400 }
        )
      }
    }

    const where: Record<string, unknown> = {
      clientId: apiKey.clientId
    }

    if (!includeInactive) {
      where.isActive = true
    }

    if (updatedAfter) {
      where.updatedAt = { gt: updatedAfter }
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          media: {
            where: {
              kind: 'image',
              status: 'completed'
            },
            select: {
              id: true,
              s3Key: true,
              altText: true,
              sortOrder: true,
              isPrimary: true,
              width: true,
              height: true
            },
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }]
          }
        },
        orderBy: [{ updatedAt: 'asc' }, { sku: 'asc' }],
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    const formattedProducts = await Promise.all(
      products.map(async (product) => {
        const images = await Promise.all(
          product.media.map(async (media) => ({
            id: media.id,
            url: await generateSignedUrl(media.s3Key, SIGNED_URL_TTL_SECONDS),
            altText: media.altText,
            isPrimary: media.isPrimary,
            sortOrder: media.sortOrder,
            width: media.width,
            height: media.height
          }))
        )

        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description || '',
          price: Number(product.price),
          stockLevel: product.stockLevel,
          minStock: product.minStock,
          category: product.category,
          isActive: product.isActive,
          allowPreorder: product.allowPreorder,
          thumbnailUrl: images[0]?.url || product.thumbnailUrl || null,
          images,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: apiKey.client.id,
          name: apiKey.client.name,
          slug: clientSlug
        },
        products: formattedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNextPage: skip + formattedProducts.length < total
        }
      }
    })
  } catch (error) {
    console.error('WooCommerce sync products export failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync products' },
      { status: 500 }
    )
  }
}
