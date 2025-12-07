import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

interface GuestJWTPayload {
  type: string
  clientId: string
  clientSlug: string
  clientName: string
}

/**
 * Get guest token from cookies (server-side)
 */
export async function getGuestTokenFromCookie(slug: string): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(`guest_token_${slug}`)?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as GuestJWTPayload
    if (decoded.type === 'guest' && decoded.clientSlug === slug) {
      return token
    }
  } catch (error) {
    // Token invalid
    return null
  }
  return null
}

/**
 * Get guest token from cookies (client-side via API)
 */
export async function getGuestTokenClient(slug: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/guest/get-token?slug=${encodeURIComponent(slug)}`)
    if (!response.ok) return null
    const data = await response.json()
    return data.token || null
  } catch (error) {
    return null
  }
}

