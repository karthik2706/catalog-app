import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { backfillProductsPage, getCredentialsFromConnection } from '@/lib/woocommerce/sync'
import {
  getIntegrationUser,
  resolveClientId,
  canManageIntegrations,
} from '@/lib/integrations-auth'

const PER_PAGE = 50
const MAX_PAGES_PER_REQUEST = 8

export async function POST(request: NextRequest) {
  let connectionIdForError = ''
  try {
    const user = getIntegrationUser(request)
    if (!user || !canManageIntegrations(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const connectionId = String(body.connectionId || '')
    connectionIdForError = connectionId
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
    if (!conn.isActive) {
      return NextResponse.json({ error: 'Connection is disabled' }, { status: 400 })
    }

    if (body.reset === true) {
      await prisma.wooCommerceConnection.update({
        where: { id: conn.id },
        data: { backfillPage: 1, backfillComplete: false, lastFullSyncError: null },
      })
    }

    const fresh = await prisma.wooCommerceConnection.findUniqueOrThrow({ where: { id: conn.id } })
    const creds = getCredentialsFromConnection(fresh)

    let page = body.reset === true ? 1 : fresh.backfillPage
    let totalProcessed = 0
    let hasMore = true
    let pages = 0

    while (hasMore && pages < MAX_PAGES_PER_REQUEST) {
      const { processed, hasMore: more } = await backfillProductsPage(fresh, creds, page, PER_PAGE)
      totalProcessed += processed
      hasMore = more
      pages += 1
      if (!more) {
        await prisma.wooCommerceConnection.update({
          where: { id: fresh.id },
          data: {
            backfillPage: 1,
            backfillComplete: true,
            lastFullSyncAt: new Date(),
            lastFullSyncError: null,
          },
        })
        break
      }
      page += 1
      await prisma.wooCommerceConnection.update({
        where: { id: fresh.id },
        data: { backfillPage: page, backfillComplete: false, lastFullSyncError: null },
      })
    }

    const updated = await prisma.wooCommerceConnection.findUnique({ where: { id: fresh.id } })

    return NextResponse.json({
      processedInBatch: totalProcessed,
      backfillComplete: updated?.backfillComplete ?? false,
      nextPage: updated?.backfillPage ?? page,
      message: updated?.backfillComplete
        ? 'Full catalog sync finished.'
        : 'Batch processed. Call again until backfillComplete is true.',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Backfill failed'
    console.error(e)
    if (connectionIdForError) {
      await prisma.wooCommerceConnection.updateMany({
        where: { id: connectionIdForError },
        data: { lastFullSyncError: msg.slice(0, 2000) },
      })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
