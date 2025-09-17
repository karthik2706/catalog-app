import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get or create default settings
    let settings = await prisma.settings.findFirst()
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.settings.create({
        data: {
          companyName: 'Quick Stock - Inventory Management',
          email: 'admin@company.com',
          phone: '+1 (555) 123-4567',
          address: '123 Business St, City, State 12345',
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
    const body = await request.json()
    
    // Get existing settings or create new ones
    let settings = await prisma.settings.findFirst()
    
    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
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
    } else {
      // Create new settings
      settings = await prisma.settings.create({
        data: {
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
    }
    
    console.log('Settings updated:', settings)
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
