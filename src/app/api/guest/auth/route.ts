import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// POST /api/guest/auth - Authenticate guest with password
export async function POST(request: NextRequest) {
  try {
    const { slug, password } = await request.json()

    if (!slug || !password) {
      return NextResponse.json(
        { error: 'Client slug and password are required' },
        { status: 400 }
      )
    }

    // Find client by slug
    const client = await prisma.client.findUnique({
      where: { slug }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if guest access is enabled
    if (!client.guestAccessEnabled) {
      return NextResponse.json(
        { error: 'Guest access is not enabled for this catalog' },
        { status: 403 }
      )
    }

    // Verify password
    if (client.guestPassword !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate guest token
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
        logo: client.logo
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

