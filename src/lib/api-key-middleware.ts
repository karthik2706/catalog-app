import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from './api-key-service';

export interface AuthenticatedApiKey {
  id: string;
  name: string;
  key: string;
  clientId: string;
  permissions: string[];
  client: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
}

/**
 * API Key Authentication Middleware
 * Validates API keys for protected endpoints
 */
export async function authenticateApiKey(request: NextRequest): Promise<{
  apiKey: AuthenticatedApiKey;
  response?: NextResponse;
} | { apiKey: null; response: NextResponse }> {
  try {
    const apiKey = request.headers.get('x-api-key');
    const clientId = request.headers.get('x-client-id');

    console.log('🔍 [API_KEY_MIDDLEWARE] Received API key:', apiKey);
    console.log('🔍 [API_KEY_MIDDLEWARE] Received Client ID:', clientId);

    if (!apiKey) {
      console.log('❌ [API_KEY_MIDDLEWARE] No API key provided');
      return {
        apiKey: null,
        response: NextResponse.json(
          { error: 'API key is required' },
          { status: 401 }
        )
      };
    }

    console.log('🔍 [API_KEY_MIDDLEWARE] Calling validateApiKey...');
    const validation = await validateApiKey(apiKey);
    console.log('🔍 [API_KEY_MIDDLEWARE] Validation result:', validation);

    if (!validation.isValid) {
      return {
        apiKey: null,
        response: NextResponse.json(
          { error: validation.error || 'Invalid API key' },
          { status: 401 }
        )
      };
    }

    // If client ID is provided, verify it matches the API key's client
    if (clientId && validation.apiKey!.clientId !== clientId) {
      return {
        apiKey: null,
        response: NextResponse.json(
          { error: 'Client ID mismatch' },
          { status: 403 }
        )
      };
    }

    return {
      apiKey: {
        id: validation.apiKey!.id,
        name: validation.apiKey!.name,
        key: validation.apiKey!.key,
        clientId: validation.apiKey!.clientId,
        permissions: validation.apiKey!.permissions,
        client: {
          id: validation.apiKey!.client.id,
          name: validation.apiKey!.client.name,
          slug: validation.apiKey!.client.slug,
          isActive: validation.apiKey!.client.isActive
        }
      }
    };

  } catch (error) {
    console.error('API key authentication error:', error);
    return {
      apiKey: null,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    };
  }
}

/**
 * Check if API key has required permissions
 */
export function hasPermission(apiKey: AuthenticatedApiKey, permission: string): boolean {
  return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
}

/**
 * Check if API key has any of the required permissions
 */
export function hasAnyPermission(apiKey: AuthenticatedApiKey, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(apiKey, permission));
}
