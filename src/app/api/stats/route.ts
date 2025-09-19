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

    // For super admin, show global stats; for regular users, show client-specific stats
    const isSuperAdmin = user.role === 'SUPER_ADMIN'
    const whereClause = isSuperAdmin ? {} : { clientId: user.clientId }

    // Get total products count
    const totalProducts = await prisma.product.count({
      where: {
        ...whereClause,
        isActive: true
      }
    })

    // Get low stock products count (stock level <= min stock)
    const lowStockProducts = await prisma.product.count({
      where: {
        ...whereClause,
        stockLevel: {
          lte: prisma.product.fields.minStock
        }
      }
    })

    // Get total categories count
    const totalCategories = await prisma.category.count({
      where: { 
        ...whereClause,
        isActive: true
      }
    })

    // Get total users count
    const totalUsers = await prisma.user.count({
      where: isSuperAdmin ? {} : { clientId: user.clientId }
    })

    // Get total clients count (only for super admin)
    const totalClients = isSuperAdmin ? await prisma.client.count() : 0

    // Get total value of inventory
    const products = await prisma.product.findMany({
      where: {
        ...whereClause,
        isActive: true
      },
      select: {
        price: true,
        stockLevel: true
      }
    })

    const totalValue = products.reduce((sum, product) => {
      return sum + (Number(product.price) * product.stockLevel)
    }, 0)

    // Get recent inventory activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivity = await prisma.inventoryHistory.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    const stats = {
      totalProducts,
      lowStockProducts,
      totalCategories,
      totalUsers,
      totalClients,
      totalValue,
      recentActivity,
      isSuperAdmin
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
