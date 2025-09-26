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
        clientId: decoded.clientId || null
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

// GET /api/inventory/analytics - Get inventory analytics for a product or all products
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const clientId = user.clientId
    
    // For MASTER_ADMIN, clientId can be null (they can access all clients)
    // For other roles, clientId is required
    if (!clientId && user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const timeRange = searchParams.get('timeRange') || '30' // days
    const includeProjections = searchParams.get('includeProjections') === 'true'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - parseInt(timeRange))

    // Build where clause
    const where: any = { 
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
    
    // For non-MASTER_ADMIN users, filter by clientId
    if (user.role !== 'MASTER_ADMIN' && clientId) {
      where.clientId = clientId
    }
    
    if (productId) {
      where.productId = productId
    }

    // Get inventory history
    const inventoryHistory = await prisma.inventoryHistory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            stockLevel: true,
            minStock: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate analytics
    const analytics = {
      totalMovements: inventoryHistory.length,
      totalQuantityMoved: inventoryHistory.reduce((sum, record) => sum + Math.abs(record.quantity), 0),
      averageMovement: inventoryHistory.length > 0 
        ? inventoryHistory.reduce((sum, record) => sum + record.quantity, 0) / inventoryHistory.length 
        : 0,
      lastMovement: inventoryHistory.length > 0 ? inventoryHistory[0].createdAt : null,
      stockTrend: calculateStockTrend(inventoryHistory),
      movementTypes: calculateMovementTypes(inventoryHistory),
      dailyMovements: calculateDailyMovements(inventoryHistory, startDate, endDate),
      lowStockAlerts: await getLowStockAlerts(user.role === 'MASTER_ADMIN' ? null : clientId),
      reorderRecommendations: await getReorderRecommendations(user.role === 'MASTER_ADMIN' ? null : clientId, includeProjections)
    }

    // If specific product, add product-specific analytics
    if (productId) {
      const productWhereClause: any = { id: productId }
      
      // For non-MASTER_ADMIN users, filter by clientId
      if (user.role !== 'MASTER_ADMIN' && clientId) {
        productWhereClause.clientId = clientId
      }
      
      const product = await prisma.product.findFirst({
        where: productWhereClause,
        select: {
          id: true,
          sku: true,
          name: true,
          stockLevel: true,
          minStock: true,
          price: true
        }
      })

      if (product) {
        analytics.product = product
        analytics.stockProjection = includeProjections 
          ? calculateStockProjection(inventoryHistory, product.stockLevel)
          : null
      }
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching inventory analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory analytics' },
      { status: 500 }
    )
  }
}

function calculateStockTrend(history: any[]): 'up' | 'down' | 'stable' {
  if (history.length < 2) return 'stable'
  
  const recent = history.slice(0, Math.min(10, history.length))
  const totalChange = recent.reduce((sum, record) => sum + record.quantity, 0)
  
  if (totalChange > 5) return 'up'
  if (totalChange < -5) return 'down'
  return 'stable'
}

function calculateMovementTypes(history: any[]) {
  const types: Record<string, { count: number; totalQuantity: number }> = {}
  
  history.forEach(record => {
    if (!types[record.type]) {
      types[record.type] = { count: 0, totalQuantity: 0 }
    }
    types[record.type].count++
    types[record.type].totalQuantity += record.quantity
  })
  
  return types
}

function calculateDailyMovements(history: any[], startDate: Date, endDate: Date) {
  const dailyData: Record<string, { date: string; movements: number; quantity: number }> = {}
  
  // Initialize all days in range
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    dailyData[dateStr] = { date: dateStr, movements: 0, quantity: 0 }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Add actual data
  history.forEach(record => {
    const dateStr = record.createdAt.toISOString().split('T')[0]
    if (dailyData[dateStr]) {
      dailyData[dateStr].movements++
      dailyData[dateStr].quantity += record.quantity
    }
  })
  
  return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
}

async function getLowStockAlerts(clientId: string | null) {
  const whereClause: any = {
    isActive: true,
    stockLevel: {
      lte: prisma.product.fields.minStock
    }
  }
  
  // For non-MASTER_ADMIN users, filter by clientId
  if (clientId) {
    whereClause.clientId = clientId
  }
  
  const products = await prisma.product.findMany({
    where: whereClause,
    select: {
      id: true,
      sku: true,
      name: true,
      stockLevel: true,
      minStock: true
    }
  })
  
  return products.map(product => ({
    ...product,
    alertLevel: product.stockLevel === 0 ? 'critical' : 'warning',
    daysUntilStockout: calculateDaysUntilStockout(product.stockLevel, product.minStock)
  }))
}

async function getReorderRecommendations(clientId: string | null, includeProjections: boolean) {
  const whereClause: any = {
    isActive: true
  }
  
  // For non-MASTER_ADMIN users, filter by clientId
  if (clientId) {
    whereClause.clientId = clientId
  }
  
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      inventoryHistory: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })
  
  const recommendations = products.map(product => {
    const avgDailyUsage = calculateAverageDailyUsage(product.inventoryHistory)
    const daysUntilReorder = product.stockLevel / Math.max(avgDailyUsage, 1)
    const recommendedOrderQuantity = Math.max(avgDailyUsage * 30, product.minStock * 2) // 30 days supply
    
    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      currentStock: product.stockLevel,
      minStock: product.minStock,
      avgDailyUsage,
      daysUntilReorder: Math.round(daysUntilReorder),
      recommendedOrderQuantity: Math.round(recommendedOrderQuantity),
      priority: daysUntilReorder < 7 ? 'high' : daysUntilReorder < 14 ? 'medium' : 'low'
    }
  })
  
  return recommendations
    .filter(rec => rec.daysUntilReorder < 30) // Only show products that need reordering soon
    .sort((a, b) => a.daysUntilReorder - b.daysUntilReorder)
}

function calculateAverageDailyUsage(history: any[]): number {
  if (history.length === 0) return 0
  
  // Calculate average daily usage from sales and damage (negative quantities)
  const salesHistory = history.filter(record => 
    record.type === 'SALE' || record.type === 'DAMAGE'
  )
  
  if (salesHistory.length === 0) return 0
  
  const totalSold = salesHistory.reduce((sum, record) => sum + Math.abs(record.quantity), 0)
  const days = 30 // Last 30 days
  
  return totalSold / days
}

function calculateDaysUntilStockout(currentStock: number, minStock: number): number {
  if (currentStock <= 0) return 0
  if (currentStock <= minStock) return 1
  return Math.ceil((currentStock - minStock) / 2) // Assume 2 units per day average usage
}

function calculateStockProjection(history: any[], currentStock: number) {
  const avgDailyChange = history.length > 0 
    ? history.reduce((sum, record) => sum + record.quantity, 0) / 30 // Last 30 days
    : 0
  
  const projections = []
  let projectedStock = currentStock
  
  for (let day = 1; day <= 30; day++) {
    projectedStock += avgDailyChange
    projections.push({
      day,
      projectedStock: Math.max(0, Math.round(projectedStock))
    })
  }
  
  return {
    avgDailyChange: Math.round(avgDailyChange * 100) / 100,
    projections
  }
}
