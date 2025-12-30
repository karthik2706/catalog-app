import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

interface GuestJWTPayload {
  type: string
  clientId: string
  clientSlug: string
  clientName: string
}

async function getGuestFromRequest(request: NextRequest): Promise<{ clientId: string } | null> {
  let token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    const cookieStore = await cookies()
    const slug = request.nextUrl.searchParams.get('slug')
    if (slug) {
      token = cookieStore.get(`guest_token_${slug}`)?.value || null
    }
  }
  
  if (token) {
    try {
      const secret = process.env.JWT_SECRET
      if (!secret) {
        throw new Error('JWT_SECRET not configured')
      }
      const decoded = jwt.verify(token, secret) as GuestJWTPayload
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

// GET /api/guest/orders/[id] - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const guest = await getGuestFromRequest(request)
    
    if (!guest) {
      return NextResponse.json(
        { error: 'Guest authentication required' },
        { status: 401 }
      )
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        clientId: guest.clientId
      },
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
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

