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
      orderId, 
      items, 
      reason = 'order_cancellation', // 'order_cancellation', 'return', 'refund', 'other'
      webhookId 
    } = body

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (items.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 items allowed per request' },
        { status: 400 }
      )
    }

    // Validate items structure
    for (const item of items) {
      if (!item.sku || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Each item must have a valid SKU and positive quantity' },
          { status: 400 }
        )
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

    // Get all SKUs for batch query
    const skus = items.map(item => item.sku)
    
    // Find products by SKUs and clientId
    const products = await prisma.product.findMany({
      where: {
        sku: {
          in: skus
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

    // Process inventory restoration
    const restoreResults = []
    const errors = []

    for (const item of items) {
      const product = productMap.get(item.sku)
      
      if (!product) {
        errors.push({
          sku: item.sku,
          error: 'Product not found',
          success: false
        })
        continue
      }

      try {
        // Calculate new stock level (add back the quantity)
        const newStockLevel = product.stockLevel + item.quantity
        
        // Update the product and create inventory history
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

        // Create inventory history record for restoration
        try {
          await prisma.inventoryHistory.create({
            data: {
              productId: product.id,
              quantity: item.quantity, // Positive for restoration
              type: 'RETURN',
              reason: `Order ${orderId} - Inventory restoration via API (${reason})`,
              clientId: client.id,
              userId: null // API call, no specific user
            }
          })
          console.log(`✅ Created inventory history for restoration of ${item.sku}`)
        } catch (historyError) {
          console.error(`❌ Failed to create inventory history for restoration of ${item.sku}:`, historyError)
          // Don't fail the operation, just log the error
        }

        restoreResults.push({
          sku: item.sku,
          productName: product.name,
          success: true,
          previousStock: product.stockLevel,
          newStock: updatedProduct.stockLevel,
          restored: item.quantity,
          aboveMinStock: updatedProduct.stockLevel >= updatedProduct.minStock
        })

        // Log inventory restoration for audit trail
        console.log(`Inventory restored for ${item.sku}: ${product.stockLevel} -> ${updatedProduct.stockLevel} (restored ${item.quantity})`)

      } catch (error) {
        console.error(`Error restoring inventory for ${item.sku}:`, error)
        errors.push({
          sku: item.sku,
          error: 'Failed to restore inventory',
          success: false
        })
      }
    }

    // Check if any products are now above minimum stock (good news!)
    const stockRecovered = restoreResults.filter(result => result.aboveMinStock)

    const response = {
      success: true,
      data: {
        orderId,
        webhookId: webhookId || null,
        reason: reason,
        client: {
          id: client.id,
          name: client.name,
          slug: client.slug
        },
        summary: {
          totalItems: items.length,
          successful: restoreResults.length,
          failed: errors.length,
          totalRestored: restoreResults.reduce((sum, item) => sum + item.restored, 0)
        },
        results: restoreResults,
        errors: errors,
        stockRecovered: stockRecovered.map(item => ({
          sku: item.sku,
          productName: item.productName,
          currentStock: item.newStock,
          minStock: productMap.get(item.sku)?.minStock || 0,
          message: `Stock level (${item.newStock}) is now above minimum (${productMap.get(item.sku)?.minStock || 0})`
        })),
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in inventory restoration:', error)
    return NextResponse.json(
      { error: 'Failed to restore inventory' },
      { status: 500 }
    )
  }
}
