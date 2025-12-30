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
      const secret = process.env.JWT_SECRET
      if (!secret) {
        throw new Error('JWT_SECRET not configured')
      }
      const decoded = jwt.verify(token, secret) as JWTPayload
      if (decoded.userId && decoded.role) {
        return {
          userId: decoded.userId,
          role: decoded.role,
          clientId: decoded.clientId
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

// GET /api/orders - Get all orders (for authenticated users/admins)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const status = searchParams.get('status') || undefined
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Filter by client if not super admin
    if (user.role !== 'MASTER_ADMIN' && user.clientId) {
      where.clientId = user.clientId
    }

    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  thumbnailUrl: true
                }
              }
            }
          },
          client: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

