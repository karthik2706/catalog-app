import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Optional API key validation for public access
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  const expectedApiKey = process.env.PUBLIC_API_KEY
  
  // If no API key is configured, allow public access
  if (!expectedApiKey) {
    return true
  }
  
  // If API key is configured, validate it
  return apiKey === expectedApiKey
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key if configured
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    const clientSlug = request.nextUrl.searchParams.get('client')
    
    if (!clientSlug) {
      return NextResponse.json(
        { error: 'Client slug is required. Use ?client=your-client-slug' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { 
      orders, 
      reduceMode = 'strict', // 'strict' or 'allow_negative'
      batchId 
    } = body

    // Validate required fields
    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: 'Orders array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (orders.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 orders allowed per batch request' },
        { status: 400 }
      )
    }

    // Validate each order structure
    for (const order of orders) {
      if (!order.orderId || !Array.isArray(order.items) || order.items.length === 0) {
        return NextResponse.json(
          { error: 'Each order must have orderId and non-empty items array' },
          { status: 400 }
        )
      }

      for (const item of order.items) {
        if (!item.sku || typeof item.quantity !== 'number' || item.quantity <= 0) {
          return NextResponse.json(
            { error: 'Each item must have a valid SKU and positive quantity' },
            { status: 400 }
          )
        }
      }
    }

    // Find client by slug
    const client = await prisma.client.findFirst({
      where: {
        slug: clientSlug,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or inactive' },
        { status: 404 }
      )
    }

    // Collect all unique SKUs from all orders
    const allSkus = new Set()
    orders.forEach(order => {
      order.items.forEach(item => allSkus.add(item.sku))
    })

    // Find all products by SKUs and clientId
    const products = await prisma.product.findMany({
      where: {
        sku: {
          in: Array.from(allSkus)
        },
        clientId: client.id,
        isActive: true
      },
      select: {
        id: true,
        sku: true,
        name: true,
        stockLevel: true,
        minStock: true
      }
    })

    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.sku, p]))

    // Process each order
    const orderResults = []
    const batchErrors = []

    for (const order of orders) {
      const orderResult = {
        orderId: order.orderId,
        webhookId: order.webhookId || null,
        success: false,
        items: [],
        errors: [],
        summary: {
          totalItems: order.items.length,
          successful: 0,
          failed: 0,
          totalReduced: 0
        }
      }

      // Check stock availability for this order
      const insufficientStock = []
      const orderValidation = []

      for (const item of order.items) {
        const product = productMap.get(item.sku)
        
        if (!product) {
          orderValidation.push({
            sku: item.sku,
            error: 'Product not found',
            success: false
          })
          continue
        }

        if (reduceMode === 'strict' && product.stockLevel < item.quantity) {
          insufficientStock.push({
            sku: item.sku,
            productName: product.name,
            requested: item.quantity,
            available: product.stockLevel,
            shortfall: item.quantity - product.stockLevel
          })
          orderValidation.push({
            sku: item.sku,
            error: 'Insufficient stock',
            success: false,
            available: product.stockLevel,
            requested: item.quantity
          })
        } else {
          orderValidation.push({
            sku: item.sku,
            success: true,
            currentStock: product.stockLevel,
            requested: item.quantity
          })
        }
      }

      // If strict mode and insufficient stock, mark order as failed
      if (reduceMode === 'strict' && insufficientStock.length > 0) {
        orderResult.errors = orderValidation.filter(v => !v.success)
        orderResult.summary.failed = orderResult.errors.length
        orderResults.push(orderResult)
        continue
      }

      // Process inventory reduction for this order
      for (const item of order.items) {
        const product = productMap.get(item.sku)
        
        if (!product) {
          orderResult.errors.push({
            sku: item.sku,
            error: 'Product not found',
            success: false
          })
          continue
        }

        try {
          // Calculate new stock level
          const newStockLevel = Math.max(0, product.stockLevel - item.quantity)
          
          // Update the product
          const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: { stockLevel: newStockLevel },
            select: {
              id: true,
              sku: true,
              name: true,
              stockLevel: true,
              minStock: true
            }
          })

          // Update the product map for subsequent orders
          productMap.set(item.sku, updatedProduct)

          orderResult.items.push({
            sku: item.sku,
            productName: product.name,
            success: true,
            previousStock: product.stockLevel,
            newStock: updatedProduct.stockLevel,
            reduced: item.quantity,
            belowMinStock: updatedProduct.stockLevel < updatedProduct.minStock
          })

          orderResult.summary.successful++
          orderResult.summary.totalReduced += item.quantity

        } catch (error) {
          console.error(`Error updating inventory for ${item.sku} in order ${order.orderId}:`, error)
          orderResult.errors.push({
            sku: item.sku,
            error: 'Failed to update inventory',
            success: false
          })
        }
      }

      orderResult.summary.failed = orderResult.errors.length
      orderResult.success = orderResult.summary.failed === 0
      orderResults.push(orderResult)
    }

    // Calculate batch summary
    const batchSummary = {
      totalOrders: orders.length,
      successfulOrders: orderResults.filter(r => r.success).length,
      failedOrders: orderResults.filter(r => !r.success).length,
      totalItemsProcessed: orderResults.reduce((sum, order) => sum + order.summary.totalItems, 0),
      totalItemsSuccessful: orderResults.reduce((sum, order) => sum + order.summary.successful, 0),
      totalItemsFailed: orderResults.reduce((sum, order) => sum + order.summary.failed, 0),
      totalQuantityReduced: orderResults.reduce((sum, order) => sum + order.summary.totalReduced, 0)
    }

    // Check for low stock alerts across all orders
    const lowStockAlerts = []
    orderResults.forEach(order => {
      order.items.forEach(item => {
        if (item.belowMinStock) {
          const product = productMap.get(item.sku)
          if (product) {
            lowStockAlerts.push({
              sku: item.sku,
              productName: item.productName,
              currentStock: item.newStock,
              minStock: product.minStock,
              orderId: order.orderId,
              message: `Stock level (${item.newStock}) is below minimum (${product.minStock})`
            })
          }
        }
      })
    })

    const response = {
      success: true,
      data: {
        batchId: batchId || `batch_${Date.now()}`,
        client: {
          id: client.id,
          name: client.name,
          slug: client.slug
        },
        summary: batchSummary,
        orders: orderResults,
        lowStockAlerts: lowStockAlerts,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in bulk inventory reduction:', error)
    return NextResponse.json(
      { error: 'Failed to reduce inventory' },
      { status: 500 }
    )
  }
}
