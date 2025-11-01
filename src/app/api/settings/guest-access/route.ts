import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
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

function getBaseUrl(request: NextRequest): string {
  // Try NEXTAUTH_URL first (set in production)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  // Try NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Derive from request headers
  const host = request.headers.get('host')
  
  if (host) {
    // Determine protocol from headers (Vercel sets x-forwarded-proto)
    let protocol = 'https' // Default to https for production
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const forwardedSsl = request.headers.get('x-forwarded-ssl')
    
    if (forwardedProto) {
      protocol = forwardedProto.split(',')[0].trim()
    } else if (forwardedSsl === 'on') {
      protocol = 'https'
    } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
      protocol = 'http' // Use http for localhost
    }
    
    return `${protocol}://${host}`
  }
  
  // Fallback for development
  return 'http://localhost:3000'
}

// GET /api/settings/guest-access - Get guest access settings
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For super admin, return default/empty settings
    if (user.role === 'MASTER_ADMIN') {
      return NextResponse.json({
        guestAccessEnabled: false,
        hasPassword: false,
        slug: null,
        name: null,
        guestUrl: null
      })
    }

    // For regular users, clientId is required
    if (!user.clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { id: user.clientId },
      select: {
        guestAccessEnabled: true,
        guestPassword: true,
        slug: true,
        name: true
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const baseUrl = getBaseUrl(request)
    
    return NextResponse.json({
      guestAccessEnabled: client.guestAccessEnabled,
      hasPassword: !!client.guestPassword,
      slug: client.slug,
      name: client.name,
      guestUrl: client.slug ? `${baseUrl}/guest/${client.slug}` : null
    })
  } catch (error) {
    console.error('Error fetching guest access settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/guest-access - Update guest access settings
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For super admin, guest access is not applicable
    if (user.role === 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: 'Guest access is not available for super admin' },
        { status: 403 }
      )
    }

    // For regular users, clientId is required
    if (!user.clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    const { guestAccessEnabled, guestPassword } = await request.json()

    // Validate inputs
    if (typeof guestAccessEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid guestAccessEnabled value' },
        { status: 400 }
      )
    }

    // Update client settings
    const updatedClient = await prisma.client.update({
      where: { id: user.clientId },
      data: {
        guestAccessEnabled,
        ...(guestPassword && { guestPassword })
      },
      select: {
        guestAccessEnabled: true,
        slug: true,
        name: true
      }
    })

    const baseUrl = getBaseUrl(request)
    
    return NextResponse.json({
      success: true,
      guestAccessEnabled: updatedClient.guestAccessEnabled,
      slug: updatedClient.slug,
      guestUrl: updatedClient.slug ? `${baseUrl}/guest/${updatedClient.slug}` : null
    })
  } catch (error) {
    console.error('Error updating guest access settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

