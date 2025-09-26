import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * API Key Management API
 * Handles creation and listing of API keys for clients
 */

// GET /api/admin/api-keys - List API keys for all clients or a specific client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    // Build where clause - if clientId provided, filter by it, otherwise get all
    const whereClause = clientId ? { clientId } : {};

    const apiKeys = await prisma.apiKey.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: apiKeys
    });

  } catch (error: any) {
    console.error('API keys GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/admin/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const { name, clientId, permissions = [], expiresAt } = await request.json();

    if (!name || !clientId) {
      return NextResponse.json(
        { error: 'Name and clientId are required' },
        { status: 400 }
      );
    }

    // Generate unique API key
    const apiKeyValue = 'cat_sk_' + crypto.randomBytes(32).toString('hex');

    // Create API key
    const apiKey = await prisma.apiKey.create({
      data: {
        id: 'api-key-' + Date.now(),
        name,
        key: apiKeyValue,
        clientId,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: apiKey,
      message: 'API key created successfully'
    });

  } catch (error: any) {
    console.error('API keys POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create API key' },
      { status: 500 }
    );
  }
}
