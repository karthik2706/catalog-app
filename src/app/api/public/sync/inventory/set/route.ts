import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiKeyPermission } from '@/lib/public-sync'

interface IncomingInventoryItem {
  sku?: string
  stockLevel?: number
  reason?: string
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiKeyPermission(request, 'inventory:write')
    if ('response' in authResult) {
      return authResult.response
    }

    const { apiKey } = authResult
    const body = await request.json()
    const items = Array.isArray(body?.items) ? (body.items as IncomingInventoryItem[]) : []

    if (items.length === 0) {
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

    const results = []
    const errors = []

    for (const item of items) {
      const sku = item.sku?.trim()
      const stockLevel = item.stockLevel

      if (!sku || !Number.isInteger(stockLevel) || stockLevel < 0) {
        errors.push({
          sku: sku || null,
          error: 'Each item requires sku and a non-negative integer stockLevel'
        })
        continue
      }

      const product = await prisma.product.findUnique({
        where: {
          sku_clientId: {
            sku,
            clientId: apiKey.clientId
          }
        }
      })

      if (!product) {
        errors.push({
          sku,
          error: 'Product not found'
        })
        continue
      }

      const delta = stockLevel - product.stockLevel

      const updatedProduct = await prisma.$transaction(async (tx) => {
        const savedProduct = await tx.product.update({
          where: { id: product.id },
          data: { stockLevel }
        })

        if (delta !== 0) {
          await tx.inventoryHistory.create({
            data: {
              productId: product.id,
              quantity: delta,
              type: 'ADJUSTMENT',
              reason: item.reason?.trim() || 'WooCommerce stock sync',
              clientId: apiKey.clientId,
              userId: null
            }
          })
        }

        return savedProduct
      })

      results.push({
        id: updatedProduct.id,
        sku: updatedProduct.sku,
        previousStockLevel: product.stockLevel,
        stockLevel: updatedProduct.stockLevel,
        delta
      })
    }

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        processed: results.length,
        failed: errors.length,
        results,
        errors
      }
    })
  } catch (error) {
    console.error('WooCommerce sync inventory set failed:', error)
    return NextResponse.json(
      { error: 'Failed to set inventory levels' },
      { status: 500 }
    )
  }
}
