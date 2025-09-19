import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Optional API key validation for public access
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  const expectedApiKey = process.env.PUBLIC_API_KEY
  
  // If no API key is configured, allow public access
  if (!expectedApiKey) {
    return true
  }
  
  // If API key is configured, validate it
  return apiKey === expectedApiKey
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  try {
    // Validate API key if configured
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    const { sku } = params
    const clientSlug = request.nextUrl.searchParams.get('client')
    
    if (!clientSlug) {
      return NextResponse.json(
        { error: 'Client slug is required. Use ?client=your-client-slug' },
        { status: 400 }
      )
    }

    // Find client by slug
    const client = await prisma.client.findFirst({
      where: {
        slug: clientSlug,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        currency: {
          select: {
            code: true,
            symbol: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or inactive' },
        { status: 404 }
      )
    }

    // Find product by SKU and clientId
    const product = await prisma.product.findFirst({
      where: {
        sku: sku,
        clientId: client.id,
        isActive: true
      },
      include: {
        media: {
          where: {
            kind: 'image',
            status: 'completed'
          },
          select: {
            id: true,
            s3Key: true,
            url: true,
            width: true,
            height: true,
            fileType: true
          },
          orderBy: {
            createdAt: 'asc'
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

    // Format the response for external systems
    const response = {
      success: true,
      data: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: product.price,
        currency: client.currency?.code || 'USD',
        currencySymbol: client.currency?.symbol || '$',
        stockLevel: product.stockLevel,
        minStock: product.minStock,
        category: product.category,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        client: {
          id: client.id,
          name: client.name,
          slug: client.slug
        },
        images: product.media.map(media => ({
          id: media.id,
          url: media.url,
          s3Key: media.s3Key,
          width: media.width,
          height: media.height,
          fileType: media.fileType
        }))
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching product by SKU (public):', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
