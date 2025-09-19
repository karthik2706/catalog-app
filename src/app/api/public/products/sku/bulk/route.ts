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

export async function POST(request: NextRequest) {
  try {
    // Validate API key if configured
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { skus, client } = body

    if (!client) {
      return NextResponse.json(
        { error: 'Client slug is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(skus) || skus.length === 0) {
      return NextResponse.json(
        { error: 'SKUs array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (skus.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 SKUs allowed per request' },
        { status: 400 }
      )
    }

    // Find client by slug
    const clientData = await prisma.client.findFirst({
      where: {
        slug: client,
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

    if (!clientData) {
      return NextResponse.json(
        { error: 'Client not found or inactive' },
        { status: 404 }
      )
    }

    // Find products by SKUs and clientId
    const products = await prisma.product.findMany({
      where: {
        sku: {
          in: skus
        },
        clientId: clientData.id,
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
      },
      orderBy: {
        sku: 'asc'
      }
    })

    // Format the response for external systems
    const response = {
      success: true,
      data: products.map(product => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: product.price,
        currency: clientData.currency?.code || 'USD',
        currencySymbol: clientData.currency?.symbol || '$',
        stockLevel: product.stockLevel,
        minStock: product.minStock,
        category: product.category,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        client: {
          id: clientData.id,
          name: clientData.name,
          slug: clientData.slug
        },
        images: product.media.map(media => ({
          id: media.id,
          url: media.url,
          s3Key: media.s3Key,
          width: media.width,
          height: media.height,
          fileType: media.fileType
        }))
      })),
      found: products.length,
      requested: skus.length,
      notFound: skus.filter(sku => !products.some(p => p.sku === sku))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching products by SKUs (public):', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
