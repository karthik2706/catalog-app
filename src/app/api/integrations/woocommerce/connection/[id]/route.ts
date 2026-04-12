import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encryptSecret } from '@/lib/woo-crypto'
import { normalizeSiteUrl } from '@/lib/woocommerce/client'
import {
  getIntegrationUser,
  resolveClientId,
  canManageIntegrations,
} from '@/lib/integrations-auth'

async function assertOwnsConnection(
  user: NonNullable<ReturnType<typeof getIntegrationUser>>,
  connectionId: string
) {
  const clientId = resolveClientId(user)
  if (!clientId && user.role !== 'MASTER_ADMIN') return null
  const where =
    user.role === 'MASTER_ADMIN' && !user.clientId
      ? { id: connectionId }
      : { id: connectionId, clientId: clientId! }
  const row = await prisma.wooCommerceConnection.findFirst({ where })
  return row
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getIntegrationUser(request)
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const { id } = await params
  const row = await assertOwnsConnection(user, id)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (request.headers.get('host')
      ? `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`
      : '')

  return NextResponse.json({
    connection: {
      id: row.id,
      name: row.name,
      siteUrl: row.siteUrl,
      isActive: row.isActive,
      lastFullSyncAt: row.lastFullSyncAt,
      lastFullSyncError: row.lastFullSyncError,
      backfillPage: row.backfillPage,
      backfillComplete: row.backfillComplete,
      webhookUrl: base ? `${base}/api/integrations/woocommerce/webhook/${row.deliveryToken}` : null,
    },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getIntegrationUser(request)
  if (!user || !canManageIntegrations(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const existing = await assertOwnsConnection(user, id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))

  const patch: {
    name?: string
    isActive?: boolean
    siteUrl?: string
    consumerKeyEnc?: string
    consumerSecretEnc?: string
  } = {}

  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim()
  if (typeof body.isActive === 'boolean') patch.isActive = body.isActive
  if (body.siteUrl) {
    try {
      patch.siteUrl = normalizeSiteUrl(String(body.siteUrl))
    } catch {
      return NextResponse.json({ error: 'Invalid siteUrl' }, { status: 400 })
    }
  }
  if (body.consumerKey && body.consumerSecret) {
    patch.consumerKeyEnc = encryptSecret(String(body.consumerKey).trim())
    patch.consumerSecretEnc = encryptSecret(String(body.consumerSecret).trim())
  }

  const row = await prisma.wooCommerceConnection.update({
    where: { id },
    data: patch,
  })
  return NextResponse.json({ connection: row })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getIntegrationUser(request)
  if (!user || !canManageIntegrations(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const existing = await assertOwnsConnection(user, id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.wooCommerceConnection.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
