import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireApiKeyPermission } from '@/lib/public-sync'

interface IncomingProduct {
  sku?: string
  name?: string
  description?: string
  price?: number
  stockLevel?: number
  minStock?: number
  category?: string
  isActive?: boolean
  allowPreorder?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiKeyPermission(request, 'products:write')
    if ('response' in authResult) {
      return authResult.response
    }

    const { apiKey } = authResult
    const body = await request.json()
    const products = Array.isArray(body?.products) ? (body.products as IncomingProduct[]) : []

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'Products array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (products.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 products allowed per request' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const product of products) {
      const sku = product.sku?.trim()
      const name = product.name?.trim()
      const category = product.category?.trim() || 'Uncategorized'

      if (!sku || !name || typeof product.price !== 'number') {
        errors.push({
          sku: sku || null,
          error: 'Each product requires sku, name, and numeric price'
        })
        continue
      }

      if (product.stockLevel !== undefined && (!Number.isInteger(product.stockLevel) || product.stockLevel < 0)) {
        errors.push({
          sku,
          error: 'stockLevel must be a non-negative integer'
        })
        continue
      }

      if (product.minStock !== undefined && (!Number.isInteger(product.minStock) || product.minStock < 0)) {
        errors.push({
          sku,
          error: 'minStock must be a non-negative integer'
        })
        continue
      }

      const savedProduct = await prisma.product.upsert({
        where: {
          sku_clientId: {
            sku,
            clientId: apiKey.clientId
          }
        },
        update: {
          name,
          description: product.description || '',
          price: product.price,
          stockLevel: product.stockLevel ?? undefined,
          minStock: product.minStock ?? undefined,
          category,
          isActive: product.isActive ?? true,
          allowPreorder: product.allowPreorder ?? false
        },
        create: {
          sku,
          clientId: apiKey.clientId,
          name,
          description: product.description || '',
          price: product.price,
          stockLevel: product.stockLevel ?? 0,
          minStock: product.minStock ?? 0,
          category,
          isActive: product.isActive ?? true,
          allowPreorder: product.allowPreorder ?? false
        }
      })

      results.push({
        id: savedProduct.id,
        sku: savedProduct.sku,
        updatedAt: savedProduct.updatedAt
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
    console.error('WooCommerce sync product upsert failed:', error)
    return NextResponse.json(
      { error: 'Failed to upsert sync products' },
      { status: 500 }
    )
  }
}
