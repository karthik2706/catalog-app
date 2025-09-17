import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, role, clientId } = body

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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

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
