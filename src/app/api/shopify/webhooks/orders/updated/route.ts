import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/shopify'

// POST /api/shopify/webhooks/orders/updated - Handle order update webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-shopify-hmac-sha256')
    const clientId = request.nextUrl.searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const integration = await prisma.shopifyIntegration.findUnique({
      where: { clientId }
    })

    if (!integration || !integration.isActive || !integration.syncInventory) {
      return NextResponse.json({ received: true })
    }

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

    // Process order updates (e.g., cancellations, refunds)
    await processOrderUpdateForInventory(order, clientId)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing order update webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

async function processOrderUpdateForInventory(order: any, clientId: string): Promise<void> {
  // Handle order cancellations - restore inventory
  if (order.cancelled_at && order.line_items) {
    for (const lineItem of order.line_items) {
      if (!lineItem.variant_id || !lineItem.quantity) {
        continue
      }

      const product = await prisma.product.findFirst({
        where: {
          clientId,
          shopifyVariantId: String(lineItem.variant_id),
          isActive: true
        }
      })

      if (!product) {
        continue
      }

      // Restore inventory
      const newStockLevel = product.stockLevel + lineItem.quantity

      await prisma.$transaction([
        prisma.product.update({
          where: { id: product.id },
          data: { stockLevel: newStockLevel }
        }),
        prisma.inventoryHistory.create({
          data: {
            productId: product.id,
            clientId,
            quantity: lineItem.quantity,
            type: 'RETURN',
            reason: `Shopify order #${order.order_number || order.id} cancelled`,
          }
        })
      ])
    }
  }
}

