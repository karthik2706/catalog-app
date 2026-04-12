import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { rejectGuestTokens } from '@/lib/guest-auth-guard'

export interface IntegrationUser {
  userId: string
  role: string
  clientId?: string
}

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

export function getIntegrationUser(request: NextRequest): IntegrationUser | null {
  const guestBlock = rejectGuestTokens(request)
  if (guestBlock) return null

  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
    if (decoded.userId && decoded.role) {
      return {
        userId: decoded.userId,
        role: decoded.role,
        clientId: decoded.clientId,
      }
    }
  } catch {
    return null
  }
  return null
}

export function resolveClientId(user: IntegrationUser, bodyClientId?: string): string | null {
  if (user.role === 'MASTER_ADMIN') {
    return bodyClientId || null
  }
  return user.clientId || null
}

export function canManageIntegrations(role: string): boolean {
  return role === 'MASTER_ADMIN' || role === 'ADMIN' || role === 'MANAGER'
}
