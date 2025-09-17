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
      include: { settings: true },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (!client.settings) {
      // Create default settings if they don't exist
      const settings = await prisma.clientSettings.create({
        data: {
          clientId: client.id,
          companyName: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
        },
      })
      return NextResponse.json(settings)
    }

    return NextResponse.json(client.settings)
  } catch (error) {
    console.error('Error fetching client settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const data = await request.json()

    const client = await prisma.client.findUnique({
      where: { slug },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const settings = await prisma.clientSettings.upsert({
      where: { clientId: client.id },
      update: {
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        currency: data.currency,
        timezone: data.timezone,
        lowStockThreshold: data.lowStockThreshold,
        autoReorder: data.autoReorder,
        emailNotifications: data.emailNotifications,
        smsNotifications: data.smsNotifications,
      },
      create: {
        clientId: client.id,
        companyName: data.companyName || client.name,
        email: data.email || client.email,
        phone: data.phone || client.phone,
        address: data.address || client.address,
        currency: data.currency || 'USD',
        timezone: data.timezone || 'America/New_York',
        lowStockThreshold: data.lowStockThreshold || 10,
        autoReorder: data.autoReorder || false,
        emailNotifications: data.emailNotifications || true,
        smsNotifications: data.smsNotifications || false,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating client settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
