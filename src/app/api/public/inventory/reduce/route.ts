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
      reduceMode = 'strict', // 'strict' or 'allow_negative'
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

    // Validate all SKUs exist and check stock levels
    const validationResults = []
    const insufficientStock = []
    
    for (const item of items) {
      const product = productMap.get(item.sku)
      
      if (!product) {
        validationResults.push({
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
        validationResults.push({
          sku: item.sku,
          error: 'Insufficient stock',
          success: false,
          available: product.stockLevel,
          requested: item.quantity
        })
      } else {
        validationResults.push({
          sku: item.sku,
          success: true,
          currentStock: product.stockLevel,
          requested: item.quantity
        })
      }
    }

    // If strict mode and any items have insufficient stock, return error
    if (reduceMode === 'strict' && insufficientStock.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient stock for some items',
          data: {
            orderId,
            insufficientStock,
            validationResults
          }
        },
        { status: 422 } // Unprocessable Entity
      )
    }

    // Proceed with inventory reduction
    const updateResults = []
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

        updateResults.push({
          sku: item.sku,
          productName: product.name,
          success: true,
          previousStock: product.stockLevel,
          newStock: updatedProduct.stockLevel,
          reduced: item.quantity,
          belowMinStock: updatedProduct.stockLevel < updatedProduct.minStock
        })

        // Log inventory reduction for audit trail
        console.log(`Inventory reduced for ${item.sku}: ${product.stockLevel} -> ${updatedProduct.stockLevel} (reduced by ${item.quantity})`)

        // Create inventory history entry for scan2ship order
        await prisma.inventoryHistory.create({
          data: {
            productId: product.id,
            quantity: -item.quantity, // Negative quantity for reduction
            type: 'SALE',
            reason: `Scan2Ship Order: ${orderId}`,
            clientId: client.id,
            userId: null // No specific user for external orders
          }
        })

      } catch (error) {
        console.error(`Error updating inventory for ${item.sku}:`, error)
        errors.push({
          sku: item.sku,
          error: 'Failed to update inventory',
          success: false
        })
      }
    }

    // Check if any products are now below minimum stock
    const lowStockProducts = updateResults.filter(result => result.belowMinStock)

    const response = {
      success: true,
      data: {
        orderId,
        webhookId: webhookId || null,
        client: {
          id: client.id,
          name: client.name,
          slug: client.slug
        },
        summary: {
          totalItems: items.length,
          successful: updateResults.length,
          failed: errors.length,
          totalReduced: updateResults.reduce((sum, item) => sum + item.reduced, 0)
        },
        results: updateResults,
        errors: errors,
        lowStockAlerts: lowStockProducts.map(item => ({
          sku: item.sku,
          productName: item.productName,
          currentStock: item.newStock,
          minStock: productMap.get(item.sku)?.minStock || 0,
          message: `Stock level (${item.newStock}) is below minimum (${productMap.get(item.sku)?.minStock || 0})`
        })),
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in inventory reduction:', error)
    return NextResponse.json(
      { error: 'Failed to reduce inventory' },
      { status: 500 }
    )
  }
}
