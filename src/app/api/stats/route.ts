import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get total products count
    const totalProducts = await prisma.product.count()

    // Get low stock products count (stock level <= min stock)
    const lowStockProducts = await prisma.product.count({
      where: {
        stockLevel: {
          lte: prisma.product.fields.minStock
        }
      }
    })

    // Get total categories count (unique categories)
    const categories = await prisma.product.findMany({
      select: {
        category: true
      },
      distinct: ['category']
    })
    const totalCategories = categories.length

    // Get total users count
    const totalUsers = await prisma.user.count()

    // Get total value of inventory
    const products = await prisma.product.findMany({
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
