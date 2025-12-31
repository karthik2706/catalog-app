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

function getUserFromRequest(request: NextRequest): { userId: string; role: string; clientId?: string } | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return {
        userId: decoded.userId,
        role: decoded.role,
        clientId: decoded.clientId
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (dbError: any) {
      console.error('Database connection error:', dbError)
      // Return default settings if database is unavailable
      return NextResponse.json({
        client: {
          currency: { code: 'USD', symbol: '$' }
        }
      })
    }

    // For super admin, return global settings or default settings
    if (user.role === 'MASTER_ADMIN') {
      const defaultSettings = {
        companyName: 'Stock Mind Platform',
        email: 'admin@stockmind.com',
        phone: '',
        address: '',
        timezone: 'America/New_York',
        lowStockThreshold: 10,
        autoReorder: false,
        emailNotifications: true,
        smsNotifications: false,
        isSuperAdmin: true
      }
      return NextResponse.json(defaultSettings)
    }

    // For regular users, get client-specific settings
    if (!user.clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    // Get client settings with client info
    let settings = await prisma.clientSettings.findUnique({
      where: { clientId: user.clientId },
      include: {
        client: {
          include: {
            country: true,
            currency: true
          }
        }
      }
    })
    
    if (!settings) {
      // Get client info to create default settings
      const client = await prisma.client.findUnique({
        where: { id: user.clientId }
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
          clientId: user.clientId,
          companyName: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
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
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For super admin, settings are read-only
    if (user.role === 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: 'Super admin settings are read-only' },
        { status: 403 }
      )
    }

    // For regular users, update client-specific settings
    if (!user.clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Update or create client settings
    const settings = await prisma.clientSettings.upsert({
      where: { clientId: user.clientId },
      update: {
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        timezone: body.timezone,
        lowStockThreshold: body.lowStockThreshold,
        autoReorder: body.autoReorder,
        emailNotifications: body.emailNotifications,
        smsNotifications: body.smsNotifications,
      },
      create: {
        clientId: user.clientId,
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        address: body.address,
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
