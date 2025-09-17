import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

function getClientIdFromRequest(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return decoded.clientId || null
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    // Get client settings
    let settings = await prisma.clientSettings.findUnique({
      where: { clientId }
    })
    
    if (!settings) {
      // Get client info to create default settings
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      })
      
      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }

      // Create default settings for this client
      settings = await prisma.clientSettings.create({
        data: {
          clientId,
          companyName: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          currency: 'USD',
          timezone: 'America/New_York',
          lowStockThreshold: 10,
          autoReorder: false,
          emailNotifications: true,
          smsNotifications: false,
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Update or create client settings
    const settings = await prisma.clientSettings.upsert({
      where: { clientId },
      update: {
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        currency: body.currency,
        timezone: body.timezone,
        lowStockThreshold: body.lowStockThreshold,
        autoReorder: body.autoReorder,
        emailNotifications: body.emailNotifications,
        smsNotifications: body.smsNotifications,
      },
      create: {
        clientId,
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        currency: body.currency,
        timezone: body.timezone,
        lowStockThreshold: body.lowStockThreshold,
        autoReorder: body.autoReorder,
        emailNotifications: body.emailNotifications,
        smsNotifications: body.smsNotifications,
      }
    })
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
