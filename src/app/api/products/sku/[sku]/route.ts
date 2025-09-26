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

export async function GET(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  try {
    const { sku } = params
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const clientId = getClientIdFromRequest(request)
    
    // For MASTER_ADMIN, clientId can be null (they can access all clients)
    // For other roles, clientId is required
    if (!clientId && user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    // Find product by SKU and clientId (if not MASTER_ADMIN)
    const whereClause: any = {
      sku: sku,
      isActive: true
    }
    
    // For non-MASTER_ADMIN users, filter by clientId
    if (user.role !== 'MASTER_ADMIN' && clientId) {
      whereClause.clientId = clientId
    }
    
    const product = await prisma.product.findFirst({
      where: whereClause,
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
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching product by SKU:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// Update product by SKU (for external systems to update inventory, price, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { sku: string } }
) {
  try {
    const { sku } = params
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      price, 
      stockLevel, 
      minStock, 
      name, 
      description, 
      category,
      isActive 
    } = body

    // Find the product first
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku: sku,
        clientId: clientId
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: {
        id: existingProduct.id
      },
      data: {
        ...(price !== undefined && { price: Number(price) }),
        ...(stockLevel !== undefined && { stockLevel: Number(stockLevel) }),
        ...(minStock !== undefined && { minStock: Number(minStock) }),
        ...(name !== undefined && { name: name }),
        ...(description !== undefined && { description: description }),
        ...(category !== undefined && { category: category }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      },
      include: {
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
      }
    })

    const response = {
      success: true,
      message: 'Product updated successfully',
      data: {
        id: updatedProduct.id,
        sku: updatedProduct.sku,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        currency: updatedProduct.client.currency?.code || 'USD',
        currencySymbol: updatedProduct.client.currency?.symbol || '$',
        stockLevel: updatedProduct.stockLevel,
        minStock: updatedProduct.minStock,
        category: updatedProduct.category,
        isActive: updatedProduct.isActive,
        updatedAt: updatedProduct.updatedAt
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating product by SKU:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}
