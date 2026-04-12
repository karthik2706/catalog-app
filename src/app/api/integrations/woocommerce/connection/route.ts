import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encryptSecret, randomToken } from '@/lib/woo-crypto'
import { normalizeSiteUrl } from '@/lib/woocommerce/client'
import {
  getIntegrationUser,
  resolveClientId,
  canManageIntegrations,
} from '@/lib/integrations-auth'

export async function GET(request: NextRequest) {
  try {
    const user = getIntegrationUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const queryClientId = searchParams.get('clientId') || undefined
    const clientId =
      user.role === 'MASTER_ADMIN'
        ? queryClientId || user.clientId || undefined
        : user.clientId || undefined
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client context required. Pass ?clientId= for master admin.' },
        { status: 400 }
      )
    }

    const rows = await prisma.wooCommerceConnection.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        siteUrl: true,
        isActive: true,
        deliveryToken: true,
        lastFullSyncAt: true,
        lastFullSyncError: true,
        backfillPage: true,
        backfillComplete: true,
        registeredWebhookIds: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { productMaps: true, webhookDeliveries: true } },
      },
    })

    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      (request.headers.get('x-forwarded-proto') && request.headers.get('host')
        ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('host')}`
        : '')

    return NextResponse.json({
      connections: rows.map((r) => ({
        ...r,
        webhookUrl: base
          ? `${base}/api/integrations/woocommerce/webhook/${r.deliveryToken}`
          : null,
        consumerKeyMasked: '••••••••',
        consumerSecretMasked: '••••••••',
      })),
    })
  } catch (e: unknown) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to list connections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getIntegrationUser(request)
    if (!user || !canManageIntegrations(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const clientId = resolveClientId(user, body.clientId)
    if (!clientId) {
      return NextResponse.json({ error: 'clientId required for this user' }, { status: 400 })
    }

    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'WooCommerce store'
    const siteUrl = normalizeSiteUrl(String(body.siteUrl || ''))
    const consumerKey = String(body.consumerKey || '').trim()
    const consumerSecret = String(body.consumerSecret || '').trim()

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json({ error: 'consumerKey and consumerSecret are required' }, { status: 400 })
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const webhookSecret = randomToken(32)
    const deliveryToken = randomToken(32)

    const row = await prisma.wooCommerceConnection.create({
      data: {
        name,
        clientId,
        siteUrl,
        consumerKeyEnc: encryptSecret(consumerKey),
        consumerSecretEnc: encryptSecret(consumerSecret),
        webhookSecret,
        deliveryToken,
      },
      select: {
        id: true,
        name: true,
        siteUrl: true,
        deliveryToken: true,
        isActive: true,
        createdAt: true,
      },
    })

    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host') || 'localhost:3000'}`

    return NextResponse.json({
      connection: row,
      webhookUrl: `${base}/api/integrations/woocommerce/webhook/${row.deliveryToken}`,
      message:
        'Store connection created. Register webhooks from the integrations page and run a full sync.',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create connection'
    console.error(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
