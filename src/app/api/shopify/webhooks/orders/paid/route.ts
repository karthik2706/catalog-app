import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature } from '@/lib/shopify'

// POST /api/shopify/webhooks/orders/paid - Handle order paid webhook
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

    // Order payment is already processed in orders/create
    // This webhook is mainly for tracking/logging
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing paid webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

