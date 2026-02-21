import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// POST /api/guest/auth - Authenticate guest with password (or without if not required)
export async function POST(request: NextRequest) {
  try {
    const { slug, password } = await request.json()

    if (!slug) {
      return NextResponse.json(
        { error: 'Client slug is required' },
        { status: 400 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { slug },
      include: {
        currency: {
          select: {
            code: true,
            symbol: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!client.guestAccessEnabled) {
      return NextResponse.json(
        { error: 'Guest access is not enabled for this catalog' },
        { status: 403 }
      )
    }

    if (client.guestPasswordRequired) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        )
      }

      if (client.guestPassword !== password) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }
    }

    const token = jwt.sign(
      {
        type: 'guest',
        clientId: client.id,
        clientSlug: client.slug,
        clientName: client.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      success: true,
      token,
      client: {
        id: client.id,
        name: client.name,
        slug: client.slug,
        logo: client.logo,
        currency: client.currency
      }
    })
  } catch (error) {
    console.error('Guest authentication error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
