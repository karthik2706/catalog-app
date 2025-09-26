import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateApiKey } from '@/lib/api-key-middleware'
import { generateSignedUrl } from '@/lib/aws'

export async function GET(request: NextRequest) {
  try {
    // Test API key validation directly
    const apiKey = request.headers.get('x-api-key');
    const clientId = request.headers.get('x-client-id');
    
    console.log('Testing API key validation...');
    console.log('API Key:', apiKey);
    console.log('Client ID:', clientId);
    
    // Direct database check
    const directCheck = await prisma.apiKey.findUnique({
      where: { key: apiKey || '' },
      include: { client: true }
    });
    
    console.log('Direct database check result:', directCheck ? 'FOUND' : 'NOT FOUND');
    
    if (!directCheck) {
      return NextResponse.json({ error: 'API key not found' }, { status: 401 });
    }
    
    if (!directCheck.isActive) {
      return NextResponse.json({ error: 'API key is inactive' }, { status: 401 });
    }
    
    if (!directCheck.client.isActive) {
      return NextResponse.json({ error: 'Client is inactive' }, { status: 401 });
    }
    
    const client = directCheck.client;
    
    // Simple test response
    return NextResponse.json({
      products: [
        {
          id: 'test-1',
          sku: 'TEST-001',
          name: 'Test Product',
          description: 'A test product',
          price: '100.00',
          stockLevel: 10,
          minStock: 2,
          allowPreorder: true,
          thumbnailUrl: null,
          categories: []
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      }
    })

  } catch (error) {
    console.error('Public products search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
