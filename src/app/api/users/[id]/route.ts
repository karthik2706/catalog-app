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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, role, clientId } = body

    // Get current user from token
    const currentUser = getUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization check
    if (currentUser.role === 'USER') {
      // Regular users can only update their own profile
      if (currentUser.userId !== id) {
        return NextResponse.json({ error: 'Unauthorized: Can only update your own profile' }, { status: 403 })
      }
    } else if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') {
      // Admin and Manager can only update users from their own company
      if (existingUser.clientId !== currentUser.clientId) {
        return NextResponse.json({ error: 'Unauthorized: Can only update users from your company' }, { status: 403 })
      }
    }
    // MASTER_ADMIN can update any user

    // Check if email is being changed and if it already exists within the same client
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email,
          clientId: clientId || existingUser.clientId
        }
      })

      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists in this company' }, { status: 400 })
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || existingUser.name,
        email: email || existingUser.email,
        role: role || existingUser.role,
        clientId: clientId || existingUser.clientId,
      },
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
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get current user from token
    const currentUser = getUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization check
    if (currentUser.role === 'USER') {
      // Regular users cannot delete any users
      return NextResponse.json({ error: 'Unauthorized: Cannot delete users' }, { status: 403 })
    } else if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') {
      // Admin and Manager can only delete users from their own company
      if (user.clientId !== currentUser.clientId) {
        return NextResponse.json({ error: 'Unauthorized: Can only delete users from your company' }, { status: 403 })
      }
    }
    // MASTER_ADMIN can delete any user

    // Check if user has any inventory history
    const inventoryHistory = await prisma.inventoryHistory.findFirst({
      where: { userId: id }
    })

    if (inventoryHistory) {
      return NextResponse.json({ 
        error: 'Cannot delete user with inventory history' 
      }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
