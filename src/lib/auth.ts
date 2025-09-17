import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AuthUser {
  userId: string
  email: string
  role: string
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }
  } catch (error) {
    return null
  }
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return null
  }

  return verifyToken(token)
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = getAuthUser(request)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return handler(request, user)
  }
}

export function requireAdmin(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = getAuthUser(request)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (user.role !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return handler(request, user)
  }
}