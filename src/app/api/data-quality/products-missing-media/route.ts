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

// GET /api/data-quality/products-missing-media - Get products with missing media
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!user.clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    // Find products that have no valid media
    // This includes:
    // 1. Products with no media at all
    // 2. Products where all media is failing/error
    const allProducts = await prisma.product.findMany({
      where: {
        clientId: user.clientId
      },
      include: {
        productMedia: {
          include: {
            media: {
              select: {
                id: true,
                status: true,
                error: true
              }
            }
          }
        },
        media: {
          select: {
            id: true,
            status: true,
            error: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter to products with no valid media
    const productsWithoutMedia = allProducts
      .filter(product => {
        // Check if product has no media via junction table
        const hasJunctionMedia = product.productMedia.length > 0
        // Check if product has no media via direct relation
        const hasDirectMedia = product.media.length > 0
        
        // If no media at all, include it
        if (!hasJunctionMedia && !hasDirectMedia) {
          return true
        }

        // Check if all junction media is failing
        const allJunctionMediaFailing = hasJunctionMedia && 
          product.productMedia.every(pm => 
            pm.media.status === 'failed' || 
            pm.media.status === 'error' || 
            pm.media.error !== null
          )

        // Check if all direct media is failing
        const allDirectMediaFailing = hasDirectMedia &&
          product.media.every(m => 
            m.status === 'failed' || 
            m.status === 'error' || 
            m.error !== null
          )

        // Include if all media is failing
        if (hasJunctionMedia && !hasDirectMedia && allJunctionMediaFailing) {
          return true
        }
        if (hasDirectMedia && !hasJunctionMedia && allDirectMediaFailing) {
          return true
        }
        if (hasJunctionMedia && hasDirectMedia && allJunctionMediaFailing && allDirectMediaFailing) {
          return true
        }

        return false
      })
      .map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: Number(product.price),
        stockLevel: product.stockLevel,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }))

    return NextResponse.json({
      success: true,
      products: productsWithoutMedia,
      count: productsWithoutMedia.length
    })
  } catch (error) {
    console.error('Error fetching products with missing media:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products with missing media' },
      { status: 500 }
    )
  }
}

