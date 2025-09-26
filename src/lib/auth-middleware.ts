import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  clientId?: string
}

export interface AuthResult {
  user?: AuthenticatedUser
  response?: NextResponse
}

/**
 * Authorize super admin access
 */
export async function authorizeSuperAdmin(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return {
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    })

    if (!user) {
      return {
        response: NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        )
      }
    }

    if (!user.isActive) {
      return {
        response: NextResponse.json(
          { error: 'Account is inactive' },
          { status: 401 }
        )
      }
    }

    // Check if user is master admin
    if (user.role !== 'MASTER_ADMIN') {
      return {
        response: NextResponse.json(
          { error: 'Master admin access required' },
          { status: 403 }
        )
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.client?.id
      }
    }
  } catch (error) {
    console.error('Super admin authorization error:', error)
    return {
      response: NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
  }
}

/**
 * Authorize user access with specific role requirements
 */
export async function authorizeUser(
  request: NextRequest,
  options: {
    requiredRole?: string
    requireActiveUser?: boolean
    requireActiveClient?: boolean
  } = {}
): Promise<AuthResult> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return {
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    })

    if (!user) {
      return {
        response: NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        )
      }
    }

    if (options.requireActiveUser && !user.isActive) {
      return {
        response: NextResponse.json(
          { error: 'Account is inactive' },
          { status: 401 }
        )
      }
    }

    if (options.requireActiveClient && (!user.client || !user.client.isActive)) {
      return {
        response: NextResponse.json(
          { error: 'Client account is inactive' },
          { status: 401 }
        )
      }
    }

    if (options.requiredRole && user.role !== options.requiredRole) {
      return {
        response: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.client?.id
      }
    }
  } catch (error) {
    console.error('User authorization error:', error)
    return {
      response: NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
  }
}
