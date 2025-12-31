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

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (dbError: any) {
      console.error('Database connection error:', dbError)
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          message: process.env.NODE_ENV === 'development' 
            ? dbError.message 
            : 'Please check your database configuration'
        },
        { status: 503 }
      )
    }

    const isSuperAdmin = user.role === 'MASTER_ADMIN'
    const whereClause = isSuperAdmin ? {} : { clientId: user.clientId }
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')

    // Get recent inventory history
    const inventoryHistory = await prisma.inventoryHistory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Get recently created products
    const recentProducts = await prisma.product.findMany({
      where: {
        ...whereClause,
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        sku: true,
        createdAt: true
      }
    })

    // Get recently created users
    const recentUsers = await prisma.user.findMany({
      where: isSuperAdmin ? {} : { clientId: user.clientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    // Combine all activities and sort by date
    const activities = [
      ...inventoryHistory.map(item => ({
        id: item.id,
        type: 'inventory',
        action: getInventoryAction(item.type, item.quantity),
        item: item.product?.name || 'Unknown Product',
        itemSku: item.product?.sku,
        itemId: item.productId,
        user: item.user?.name || item.user?.email || 'System',
        time: item.createdAt,
        timestamp: item.createdAt
      })),
      ...recentProducts.map(product => ({
        id: product.id,
        type: 'product',
        action: 'Product added',
        item: product.name,
        itemSku: product.sku,
        itemId: product.id,
        user: 'System',
        time: product.createdAt,
        timestamp: product.createdAt
      })),
      ...recentUsers.map(user => ({
        id: user.id,
        type: 'user',
        action: 'User registered',
        item: user.email,
        itemSku: null,
        itemId: null,
        user: user.name || 'System',
        time: user.createdAt,
        timestamp: user.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map(activity => ({
        ...activity,
        timeAgo: getTimeAgo(activity.timestamp)
      }))

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}

function getInventoryAction(type: string, quantity: number): string {
  const absQuantity = Math.abs(quantity)
  switch (type) {
    case 'PURCHASE':
      return `Stock increased by ${absQuantity}`
    case 'SALE':
      return `Stock decreased by ${absQuantity}`
    case 'ADJUSTMENT':
      return quantity > 0 ? `Stock adjusted +${absQuantity}` : `Stock adjusted -${absQuantity}`
    case 'RETURN':
      return `Stock returned +${absQuantity}`
    case 'DAMAGE':
      return `Stock damaged -${absQuantity}`
    case 'TRANSFER':
      return `Stock transferred ${absQuantity}`
    default:
      return `Stock updated ${quantity > 0 ? '+' : ''}${quantity}`
  }
}

function getTimeAgo(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`
}

