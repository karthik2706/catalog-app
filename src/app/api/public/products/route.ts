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
    
    // Get search parameters
    const search = request.nextUrl.searchParams.get('search') || '';
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    console.log('🔍 [PUBLIC_PRODUCTS] Searching for products:', {
      search,
      page,
      limit,
      clientId: client.id
    });
    
    // Query products from database
    const whereClause: any = {
      clientId: client.id,
      isActive: true
    };
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          categories: {
            include: {
              category: true
            }
          },
          mediaItems: {
            where: { isPrimary: true },
            take: 1
          }
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where: whereClause })
    ]);
    
    // Format products for response
    const formattedProducts = products.map(product => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      price: product.price?.toString() || '0.00',
      stockLevel: product.stockLevel || 0,
      minStock: product.minStock || 0,
      allowPreorder: product.allowPreorder || false,
      thumbnailUrl: product.mediaItems[0]?.url || null,
      categories: product.categories.map(pc => ({
        id: pc.category.id,
        name: pc.category.name
      }))
    }));
    
    console.log('🔍 [PUBLIC_PRODUCTS] Found products:', formattedProducts.length);
    
    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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
