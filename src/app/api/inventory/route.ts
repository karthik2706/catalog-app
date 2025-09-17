import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InventoryUpdateRequest } from '@/types'

// POST /api/inventory - Update inventory for a product
export async function POST(request: NextRequest) {
  try {
    const body: InventoryUpdateRequest = await request.json()
    
    // Validate required fields
    if (!body.productId || body.quantity === undefined || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, quantity, type' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: body.productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate new stock level
    const newStockLevel = product.stockLevel + body.quantity

    // Prevent negative stock levels for sales
    if (body.type === 'SALE' && newStockLevel < 0) {
      return NextResponse.json(
        { error: 'Insufficient stock for this operation' },
        { status: 400 }
      )
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update product stock level
      const updatedProduct = await tx.product.update({
        where: { id: body.productId },
        data: { stockLevel: newStockLevel }
      })

      // Create inventory history record
      const inventoryRecord = await tx.inventoryHistory.create({
        data: {
          productId: body.productId,
          quantity: body.quantity,
          type: body.type,
          reason: body.reason,
          userId: body.userId || null
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      })

      return { updatedProduct, inventoryRecord }
    })

    return NextResponse.json({
      product: result.updatedProduct,
      inventoryRecord: result.inventoryRecord
    })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}

// GET /api/inventory - Get inventory history with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const productId = searchParams.get('productId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {}
    if (productId) where.productId = productId
    if (type) where.type = type

    const [inventoryHistory, total] = await Promise.all([
      prisma.inventoryHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: {
            select: { name: true, sku: true }
          },
          user: {
            select: { name: true, email: true }
          }
        }
      }),
      prisma.inventoryHistory.count({ where })
    ])

    return NextResponse.json({
      inventoryHistory,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching inventory history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory history' },
      { status: 500 }
    )
  }
}