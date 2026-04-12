import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { wooRestPing } from '@/lib/woocommerce/client'
import { getCredentialsFromConnection } from '@/lib/woocommerce/sync'
import {
  getIntegrationUser,
  resolveClientId,
  canManageIntegrations,
} from '@/lib/integrations-auth'

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

    const creds = getCredentialsFromConnection(conn)
    await wooRestPing(creds)
    return NextResponse.json({ ok: true, message: 'WooCommerce REST credentials are valid.' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Connection test failed'
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }
}
