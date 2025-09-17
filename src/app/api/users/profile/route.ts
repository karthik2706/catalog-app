import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function GET() {
  try {
    // This would typically get the current user from JWT token
    // For now, we'll return a mock response since we don't have full auth implementation
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, currentPassword, newPassword } = body

    // For now, we'll update the user by email as a mock implementation
    // In a real app, you'd get the user ID from the JWT token
    const existingUser = await prisma.user.findFirst({
      where: { email: email || 'staff@company.com' }
    })
    
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate current password if changing password
    if (newPassword && currentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, existingUser.password)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {
      name: name || existingUser.name,
      email: email || existingUser.email,
    }

    // Hash new password if provided
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
