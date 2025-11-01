import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface GuestJWTPayload {
  type: string
  clientId: string
  clientSlug: string
  clientName: string
}

function getGuestFromRequest(request: NextRequest): { clientId: string } | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
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

// GET /api/guest/categories - Get categories for guest view
export async function GET(request: NextRequest) {
  try {
    const guest = getGuestFromRequest(request)
    
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

