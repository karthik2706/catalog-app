import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface GuestJWTPayload {
  type?: string
  userId?: string
  email?: string
  role?: string
  clientId?: string
  clientSlug?: string
  clientName?: string
}

/**
 * Check if a token is a guest token
 */
export function isGuestToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as GuestJWTPayload
    // Guest tokens have type: 'guest' and don't have userId or role
    return decoded.type === 'guest' && !decoded.userId && !decoded.role
  } catch {
    return false
  }
}

/**
 * Extract token from request (header or cookie)
 */
export function extractTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return null
}

/**
 * Guard function to reject guest tokens in non-guest routes
 * Use this in write operations (POST, PUT, PATCH, DELETE) to ensure guests can't modify data
 */
export function rejectGuestTokens(request: NextRequest): NextResponse | null {
  const token = extractTokenFromRequest(request)
  
  if (token && isGuestToken(token)) {
    return NextResponse.json(
      { error: 'Guest users have read-only access. This operation requires authenticated user access.' },
      { status: 403 }
    )
  }
  
  return null
}

/**
 * Enhanced getUserFromRequest that explicitly rejects guest tokens
 * Use this in non-guest API routes to ensure only authenticated users can access
 */
export function getUserFromRequestWithGuestRejection(
  request: NextRequest
): { userId: string; role: string; clientId?: string } | null {
  const token = extractTokenFromRequest(request)
  
  // Explicitly reject guest tokens
  if (token && isGuestToken(token)) {
    return null
  }
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
      
      // Ensure this is a user token (has userId and role, not a guest token)
      if (decoded.userId && decoded.role && decoded.type !== 'guest') {
        return {
          userId: decoded.userId,
          role: decoded.role,
          clientId: decoded.clientId
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  
  return null
}

