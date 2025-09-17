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

function getClientIdFromRequest(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return decoded.clientId || null
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    // Get total products count for this client
    const totalProducts = await prisma.product.count({
      where: { clientId }
    })

    // Get low stock products count (stock level <= min stock) for this client
    const lowStockProducts = await prisma.product.count({
      where: {
        clientId,
        stockLevel: {
          lte: prisma.product.fields.minStock
        }
      }
    })

    // Get total categories count for this client
    const totalCategories = await prisma.category.count({
      where: { 
        clientId,
        isActive: true
      }
    })

    // Get total users count for this client
    const totalUsers = await prisma.user.count({
      where: { clientId }
    })

    // Get total value of inventory for this client
    const products = await prisma.product.findMany({
      where: { clientId },
      select: {
        price: true,
        stockLevel: true
      }
    })

    const totalValue = products.reduce((sum, product) => {
      return sum + (Number(product.price) * product.stockLevel)
    }, 0)

    // Get recent inventory activity (last 7 days) for this client
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentActivity = await prisma.inventoryHistory.count({
      where: {
        clientId,
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
      totalValue,
      recentActivity
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
