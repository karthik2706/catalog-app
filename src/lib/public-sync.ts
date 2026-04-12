import { NextRequest, NextResponse } from 'next/server'
import { AuthenticatedApiKey, authenticateApiKey, hasPermission } from '@/lib/api-key-middleware'

export function getClientSlugFromRequest(request: NextRequest): string | null {
  return request.nextUrl.searchParams.get('client')
}

export async function requireApiKeyPermission(
  request: NextRequest,
  permission: string
): Promise<
  | { apiKey: AuthenticatedApiKey; clientSlug: string }
  | { response: NextResponse }
> {
  const authResult = await authenticateApiKey(request)
  if (authResult.response) {
    return { response: authResult.response }
  }

  const { apiKey } = authResult
  const clientSlug = getClientSlugFromRequest(request)

  if (!clientSlug) {
    return {
      response: NextResponse.json(
        { error: 'Client slug is required. Use ?client=your-client-slug' },
        { status: 400 }
      )
    }
  }

  if (apiKey.client.slug !== clientSlug) {
    return {
      response: NextResponse.json(
        { error: 'Client slug does not match API key client' },
        { status: 403 }
      )
    }
  }

  if (!hasPermission(apiKey, permission)) {
    return {
      response: NextResponse.json(
        { error: `Missing required permission: ${permission}` },
        { status: 403 }
      )
    }
  }

  return {
    apiKey,
    clientSlug
  }
}
