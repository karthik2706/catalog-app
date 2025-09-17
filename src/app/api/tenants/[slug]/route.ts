import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const client = await prisma.client.findUnique({
      where: { slug },
      include: {
        settings: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (!client.isActive) {
      return NextResponse.json({ error: 'Client account is inactive' }, { status: 403 })
    }

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        slug: client.slug,
        domain: client.domain,
        email: client.email,
        phone: client.phone,
        address: client.address,
        logo: client.logo,
        settings: client.settings,
        isActive: client.isActive,
        plan: client.plan,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      settings: client.settings,
    })
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
