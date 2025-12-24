import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/shopify'

// POST /api/shopify/webhooks/orders/create - Handle order creation webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256')
    const shopDomain = request.headers.get('x-shopify-shop-domain')
    const clientId = request.nextUrl.searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Get integration to verify webhook
    const integration = await prisma.shopifyIntegration.findUnique({
      where: { clientId }
    })

    if (!integration || !integration.isActive || !integration.syncInventory) {
      return NextResponse.json({ received: true })
    }

    // Verify webhook signature if secret is set
    if (integration.webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, integration.webhookSecret)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        )
      }
    }

    const order = JSON.parse(body)

    // Process order line items to update inventory
    await processOrderForInventory(order, clientId)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing order webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

async function processOrderForInventory(order: any, clientId: string): Promise<void> {
  if (!order.line_items || order.line_items.length === 0) {
    return
  }

  for (const lineItem of order.line_items) {
    if (!lineItem.variant_id || !lineItem.quantity) {
      continue
    }

    // Find product by Shopify variant ID
    const product = await prisma.product.findFirst({
      where: {
        clientId,
        shopifyVariantId: String(lineItem.variant_id),
        isActive: true
      }
    })

    if (!product) {
      console.warn(`Product not found for Shopify variant ${lineItem.variant_id}`)
      continue
    }

    // Reduce inventory
    const newStockLevel = Math.max(0, product.stockLevel - lineItem.quantity)

    await prisma.$transaction([
      // Update product stock
      prisma.product.update({
        where: { id: product.id },
        data: { stockLevel: newStockLevel }
      }),
      // Create inventory history record
      prisma.inventoryHistory.create({
        data: {
          productId: product.id,
          clientId,
          quantity: -lineItem.quantity,
          type: 'SALE',
          reason: `Shopify order #${order.order_number || order.id}`,
        }
      })
    ])
  }
}

