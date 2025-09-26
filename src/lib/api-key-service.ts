import { prisma } from './prisma';
import crypto from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  secret?: string;
  clientId: string;
  isActive: boolean;
  permissions: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyRequest {
  name: string;
  clientId: string;
  permissions?: string[];
  expiresAt?: Date;
}

export interface ApiKeyValidationResult {
  isValid: boolean;
  apiKey?: ApiKey;
  error?: string;
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  const prefix = 'cat_sk_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return prefix + randomBytes;
}

/**
 * Create a new API key for a client
 */
export async function createApiKey(data: CreateApiKeyRequest): Promise<ApiKey> {
  const { name, clientId, permissions = [], expiresAt } = data;

  // Check if client exists
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  if (!client) {
    throw new Error('Client not found');
  }

  // Generate unique API key
  let key: string;
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    key = generateApiKey();
    const existing = await prisma.apiKey.findUnique({
      where: { key }
    });
    
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique API key');
  }

  // Create API key
  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      key: key!,
      clientId,
      permissions,
      expiresAt,
      isActive: true
    }
  });

  return apiKey;
}

/**
 * Validate an API key
 */
export async function validateApiKey(key: string): Promise<ApiKeyValidationResult> {
  try {
    console.log('🔍 [API_KEY_VALIDATION] Validating key:', key);
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });

    console.log('🔍 [API_KEY_VALIDATION] Found API key:', apiKey ? 'YES' : 'NO');
    if (apiKey) {
      console.log('🔍 [API_KEY_VALIDATION] API key details:', {
        id: apiKey.id,
        isActive: apiKey.isActive,
        clientActive: apiKey.client.isActive,
        expiresAt: apiKey.expiresAt
      });
    }

    if (!apiKey) {
      console.log('❌ [API_KEY_VALIDATION] API key not found');
      return {
        isValid: false,
        error: 'Invalid API key'
      };
    }

    if (!apiKey.isActive) {
      return {
        isValid: false,
        error: 'API key is inactive'
      };
    }

    if (!apiKey.client.isActive) {
      return {
        isValid: false,
        error: 'Client is inactive'
      };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return {
        isValid: false,
        error: 'API key has expired'
      };
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    });

    return {
      isValid: true,
      apiKey
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return {
      isValid: false,
      error: 'API key validation failed'
    };
  }
}

/**
 * Get API keys for a client
 */
export async function getClientApiKeys(clientId: string): Promise<ApiKey[]> {
  return await prisma.apiKey.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Deactivate an API key
 */
export async function deactivateApiKey(keyId: string): Promise<void> {
  await prisma.apiKey.update({
    where: { id: keyId },
    data: { isActive: false }
  });
}

/**
 * Delete an API key
 */
export async function deleteApiKey(keyId: string): Promise<void> {
  await prisma.apiKey.delete({
    where: { id: keyId }
  });
}
