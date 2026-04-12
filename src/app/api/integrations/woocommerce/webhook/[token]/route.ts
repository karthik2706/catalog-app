import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { verifyWooCommerceWebhookSignature } from '@/lib/woocommerce/webhook-signature'
import { processWebhookPayload, extractResourceId } from '@/lib/woocommerce/sync'

export const runtime = 'nodejs'

function parseResourceFromHeader(request: NextRequest): number | null {
  const raw = (request.headers.get('x-wc-webhook-resource') || '').trim()
  if (!raw) return null
  const tail = raw.match(/(\d+)\s*$/)
  if (tail) return parseInt(tail[1], 10)
  if (/^\d+$/.test(raw)) return parseInt(raw, 10)
  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const rawBody = await request.text()

  const connection = await prisma.wooCommerceConnection.findUnique({
    where: { deliveryToken: token },
  })

  if (!connection) {
    return NextResponse.json({ error: 'Unknown webhook endpoint' }, { status: 404 })
  }

  if (!connection.isActive) {
    return NextResponse.json({ ok: true, disabled: true })
  }

  const sig = request.headers.get('x-wc-webhook-signature')
  if (!verifyWooCommerceWebhookSignature(rawBody, sig, connection.webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const topic = (request.headers.get('x-wc-webhook-topic') || '').trim()
  if (!topic) {
    return NextResponse.json({ error: 'Missing topic' }, { status: 400 })
  }

  let payload: unknown = {}
  if (rawBody.trim()) {
    try {
      payload = JSON.parse(rawBody)
    } catch {
      payload = {}
    }
  }

  const deliveryId =
    request.headers.get('x-wc-webhook-delivery-id')?.trim() ||
    `fallback-${connection.id}-${topic}-${Buffer.from(rawBody).toString('base64url').slice(0, 48)}`

  const completed = await prisma.wooWebhookDelivery.findFirst({
    where: { deliveryId, status: 'COMPLETED' },
  })
  if (completed) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const resourceIdFallback = parseResourceFromHeader(request)

  let deliveryRowId: string
  try {
    const created = await prisma.wooWebhookDelivery.create({
      data: {
        connectionId: connection.id,
        deliveryId,
        topic,
        resourceId: extractResourceId(payload) ?? resourceIdFallback,
        payload: payload as Prisma.InputJsonValue,
        status: 'PROCESSING',
        attempts: 1,
      },
    })
    deliveryRowId = created.id
  } catch {
    const dup = await prisma.wooWebhookDelivery.findUnique({ where: { deliveryId } })
    if (!dup) {
      return NextResponse.json({ error: 'Delivery log failed' }, { status: 500 })
    }
    if (dup.status === 'COMPLETED') {
      return NextResponse.json({ ok: true, duplicate: true })
    }
    deliveryRowId = dup.id
    await prisma.wooWebhookDelivery.update({
      where: { id: dup.id },
      data: { attempts: { increment: 1 }, status: 'PROCESSING' },
    })
  }

  try {
    const result = await processWebhookPayload({
      connection,
      topic,
      payload,
      resourceIdFallback,
    })

    await prisma.wooWebhookDelivery.update({
      where: { id: deliveryRowId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        errorMessage: result.handled ? null : `No-op topic: ${topic}`,
      },
    })

    return NextResponse.json({ ok: true, handled: result.handled })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Processing failed'
    await prisma.wooWebhookDelivery.update({
      where: { id: deliveryRowId },
      data: {
        status: 'FAILED',
        errorMessage: msg.slice(0, 4000),
        processedAt: new Date(),
      },
    })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
