import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

interface GuestJWTPayload {
  type: string
  clientId: string
  clientSlug: string
  clientName: string
}

async function getGuestFromRequest(request: NextRequest): Promise<{ clientId: string } | null> {
  // Try Authorization header first (for client-side requests)
  let token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  // If no token in header, try to get from cookie (for SSR)
  if (!token) {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    if (slug) {
      const cookieStore = await cookies()
      token = cookieStore.get(`guest_token_${slug}`)?.value || null
    }
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as GuestJWTPayload
      if (decoded.type === 'guest') {
        return {
          clientId: decoded.clientId
        }
      }
    } catch (error) {
      console.error('Error decoding guest token:', error)
    }
  }
  return null
}

// Reject all write operations - guest users are read-only
export async function POST() {
  return NextResponse.json(
    { error: 'Guest users have read-only access' },
    { status: 403 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Guest users have read-only access' },
    { status: 403 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Guest users have read-only access' },
    { status: 403 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Guest users have read-only access' },
    { status: 403 }
  )
}

// GET /api/guest/categories - Get categories for guest view
export async function GET(request: NextRequest) {
  try {
    const guest = await getGuestFromRequest(request)
    
    if (!guest) {
      return NextResponse.json(
        { error: 'Guest authentication required' },
        { status: 401 }
      )
    }

    // Get categories from the categories table with full hierarchy
    const categories = await prisma.category.findMany({
      where: {
        clientId: guest.clientId,
        isActive: true,
        parentId: null  // Only fetch parent categories
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        sortOrder: true,
        createdAt: true,
        clientId: true,
        children: {
          where: { isActive: true },
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' }
          ],
          select: {
            id: true,
            name: true,
            description: true,
            parentId: true,
            sortOrder: true,
            createdAt: true,
            clientId: true,
            children: {
              where: { isActive: true },
              orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
              ],
              select: {
                id: true,
                name: true,
                description: true,
                parentId: true,
                sortOrder: true,
                createdAt: true,
                clientId: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching guest categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

