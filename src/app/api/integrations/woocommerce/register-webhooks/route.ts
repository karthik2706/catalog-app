import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { wooRestFetch } from '@/lib/woocommerce/client'
import { getCredentialsFromConnection } from '@/lib/woocommerce/sync'
import {
  getIntegrationUser,
  resolveClientId,
  canManageIntegrations,
} from '@/lib/integrations-auth'

const TOPICS = [
  'product.created',
  'product.updated',
  'product.deleted',
  'product.restored',
  'product.trashed',
  'product.variation.created',
  'product.variation.updated',
  'product.variation.deleted',
] as const

interface WooWebhook {
  id: number
  name: string
  topic: string
  delivery_url: string
}

export async function POST(request: NextRequest) {
  try {
    const user = getIntegrationUser(request)
    if (!user || !canManageIntegrations(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const connectionId = String(body.connectionId || '')
    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId required' }, { status: 400 })
    }

    const clientId = resolveClientId(user, body.clientId)
    const conn = await prisma.wooCommerceConnection.findFirst({
      where:
        user.role === 'MASTER_ADMIN' && !clientId
          ? { id: connectionId }
          : { id: connectionId, clientId: clientId! },
    })
    if (!conn) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host') || 'localhost:3000'}`
    const deliveryUrl = `${base}/api/integrations/woocommerce/webhook/${conn.deliveryToken}`

    const creds = getCredentialsFromConnection(conn)

    const prevIds = (conn.registeredWebhookIds as number[] | null) || []
    for (const wid of prevIds) {
      try {
        await wooRestFetch(creds, `/webhooks/${wid}`, { method: 'DELETE' })
      } catch {
        /* stale id */
      }
    }

    const createdIds: number[] = []
    for (const topic of TOPICS) {
      const created = await wooRestFetch<WooWebhook>(creds, '/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          name: `StockMind ${topic}`,
          topic,
          delivery_url: deliveryUrl,
          secret: conn.webhookSecret,
          status: 'active',
        }),
      })
      if (created?.id) createdIds.push(created.id)
    }

    await prisma.wooCommerceConnection.update({
      where: { id: conn.id },
      data: { registeredWebhookIds: createdIds as unknown as Prisma.InputJsonValue },
    })

    return NextResponse.json({
      ok: true,
      registered: createdIds.length,
      deliveryUrl,
      webhookIds: createdIds,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Webhook registration failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
