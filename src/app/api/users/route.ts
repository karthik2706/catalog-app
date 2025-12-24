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
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    let decoded: JWTPayload | null = null
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      } catch (error) {
        console.error('Error decoding token:', error)
      }
    }

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Build where clause based on user role
    let where: any = {}
    
    if (decoded.role === 'MASTER_ADMIN') {
      // Super admins can see all users
      where = {}
    } else if (decoded.role === 'ADMIN' || decoded.role === 'MANAGER') {
      // Admin and Manager users can see all users from their company
      where = { clientId: decoded.clientId }
    } else if (decoded.role === 'USER') {
      // Regular users can only see their own details
      where = { 
        clientId: decoded.clientId,
        id: decoded.userId 
      }
    } else {
      // Unknown role - default to own client only
      where = { clientId: decoded.clientId }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clientId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, clientId } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ 
        error: 'Name, email, password, and role are required' 
      }, { status: 400 })
    }

    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    let decoded: JWTPayload | null = null
    if (token) {
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      } catch (error) {
        console.error('Error decoding token:', error)
      }
    }

    // Determine the client ID based on user role
    let targetClientId = clientId
    if (decoded?.role !== 'MASTER_ADMIN') {
      // Non-super admins can only create users for their own client
      targetClientId = decoded?.clientId || null
    }

    // Check if user already exists within the client
    const existingUser = await prisma.user.findFirst({
      where: { 
        email,
        clientId: targetClientId
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists in this company' }, { status: 400 })
    }

    // Hash password
    const bcrypt = require('bcrypt')
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role.toUpperCase(),
        clientId: targetClientId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clientId: true,
        isActive: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
