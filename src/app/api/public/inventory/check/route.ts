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
    const { items } = body

    // Validate required fields
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
        minStock: true,
        price: true,
        category: true,
        isActive: true
      }
    })

    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.sku, p]))

    // Check availability for each item
    const availabilityResults = []
    const unavailableItems = []
    const lowStockItems = []

    for (const item of items) {
      const product = productMap.get(item.sku)
      
      if (!product) {
        unavailableItems.push({
          sku: item.sku,
          error: 'Product not found',
          available: false
        })
        availabilityResults.push({
          sku: item.sku,
          available: false,
          error: 'Product not found',
          stockLevel: 0,
          requested: item.quantity,
          shortfall: item.quantity
        })
        continue
      }

      const isAvailable = product.stockLevel >= item.quantity
      const shortfall = Math.max(0, item.quantity - product.stockLevel)
      const isLowStock = product.stockLevel < product.minStock

      availabilityResults.push({
        sku: item.sku,
        productName: product.name,
        available: isAvailable,
        stockLevel: product.stockLevel,
        requested: item.quantity,
        shortfall: shortfall,
        isLowStock: isLowStock,
        minStock: product.minStock,
        price: product.price,
        category: product.category
      })

      if (!isAvailable) {
        unavailableItems.push({
          sku: item.sku,
          productName: product.name,
          error: 'Insufficient stock',
          available: false,
          stockLevel: product.stockLevel,
          requested: item.quantity,
          shortfall: shortfall
        })
      }

      if (isLowStock) {
        lowStockItems.push({
          sku: item.sku,
          productName: product.name,
          stockLevel: product.stockLevel,
          minStock: product.minStock,
          message: `Stock level (${product.stockLevel}) is below minimum (${product.minStock})`
        })
      }
    }

    // Calculate summary
    const summary = {
      totalItems: items.length,
      availableItems: availabilityResults.filter(r => r.available).length,
      unavailableItems: unavailableItems.length,
      lowStockItems: lowStockItems.length,
      totalRequested: items.reduce((sum, item) => sum + item.quantity, 0),
      totalAvailable: availabilityResults.reduce((sum, r) => sum + (r.available ? r.requested : 0), 0),
      totalShortfall: availabilityResults.reduce((sum, r) => sum + r.shortfall, 0)
    }

    const response = {
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          slug: client.slug
        },
        summary: summary,
        availability: availabilityResults,
        unavailableItems: unavailableItems,
        lowStockAlerts: lowStockItems,
        allItemsAvailable: unavailableItems.length === 0,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error checking inventory availability:', error)
    return NextResponse.json(
      { error: 'Failed to check inventory availability' },
      { status: 500 }
    )
  }
}
