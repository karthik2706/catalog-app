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

function getUserFromRequest(request: NextRequest): { userId: string; role: string; clientId?: string } | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return {
        userId: decoded.userId,
        role: decoded.role,
        clientId: decoded.clientId
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

function getClientIdFromRequest(request: NextRequest): string | null {
  const user = getUserFromRequest(request)
  if (!user) {
    return null
  }
  
  // For super admin, we need to get clientId from query params or headers
  if (user.role === 'MASTER_ADMIN') {
    const clientId = request.nextUrl.searchParams.get('clientId')
    return clientId
  }
  
  return user.clientId || null
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { skus } = body

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

    // Find products by SKUs and clientId
    const products = await prisma.product.findMany({
      where: {
        sku: {
          in: skus
        },
        clientId: clientId,
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
        },
        client: {
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
        currency: product.client.currency?.code || 'USD',
        currencySymbol: product.client.currency?.symbol || '$',
        stockLevel: product.stockLevel,
        minStock: product.minStock,
        category: product.category,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        client: {
          id: product.client.id,
          name: product.client.name,
          slug: product.client.slug
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
    console.error('Error fetching products by SKUs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// Bulk update products by SKUs
export async function PUT(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { updates } = body

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (updates.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 updates allowed per request' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const update of updates) {
      const { sku, ...updateData } = update

      if (!sku) {
        errors.push({ sku: sku || 'unknown', error: 'SKU is required' })
        continue
      }

      try {
        // Find the product first
        const existingProduct = await prisma.product.findFirst({
          where: {
            sku: sku,
            clientId: clientId
          }
        })

        if (!existingProduct) {
          errors.push({ sku, error: 'Product not found' })
          continue
        }

        // Update the product
        const updatedProduct = await prisma.product.update({
          where: {
            id: existingProduct.id
          },
          data: {
            ...(updateData.price !== undefined && { price: Number(updateData.price) }),
            ...(updateData.stockLevel !== undefined && { stockLevel: Number(updateData.stockLevel) }),
            ...(updateData.minStock !== undefined && { minStock: Number(updateData.minStock) }),
            ...(updateData.name !== undefined && { name: updateData.name }),
            ...(updateData.description !== undefined && { description: updateData.description }),
            ...(updateData.category !== undefined && { category: updateData.category }),
            ...(updateData.isActive !== undefined && { isActive: Boolean(updateData.isActive) })
          }
        })

        results.push({
          sku: updatedProduct.sku,
          id: updatedProduct.id,
          updated: true,
          data: {
            name: updatedProduct.name,
            price: updatedProduct.price,
            stockLevel: updatedProduct.stockLevel,
            minStock: updatedProduct.minStock,
            category: updatedProduct.category,
            isActive: updatedProduct.isActive,
            updatedAt: updatedProduct.updatedAt
          }
        })
      } catch (error) {
        console.error(`Error updating product ${sku}:`, error)
        errors.push({ sku, error: 'Failed to update product' })
      }
    }

    const response = {
      success: true,
      message: `Updated ${results.length} products successfully`,
      data: {
        updated: results,
        errors: errors,
        summary: {
          total: updates.length,
          successful: results.length,
          failed: errors.length
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error bulk updating products by SKUs:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update products' },
      { status: 500 }
    )
  }
}
