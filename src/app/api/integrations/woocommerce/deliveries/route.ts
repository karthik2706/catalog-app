import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIntegrationUser, resolveClientId } from '@/lib/integrations-auth'

export async function GET(request: NextRequest) {
  const user = getIntegrationUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const connectionId = searchParams.get('connectionId')
  if (!connectionId) {
    return NextResponse.json({ error: 'connectionId query required' }, { status: 400 })
  }

  const clientId = resolveClientId(user, searchParams.get('clientId') || undefined)
  const conn = await prisma.wooCommerceConnection.findFirst({
    where:
      user.role === 'MASTER_ADMIN' && !clientId
        ? { id: connectionId }
        : { id: connectionId, clientId: clientId! },
  })
  if (!conn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const rows = await prisma.wooWebhookDelivery.findMany({
    where: { connectionId: conn.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      deliveryId: true,
      topic: true,
      resourceId: true,
      status: true,
      errorMessage: true,
      attempts: true,
      createdAt: true,
      processedAt: true,
    },
  })

  return NextResponse.json({ deliveries: rows })
}
