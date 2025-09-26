import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/products - Get all products for admin management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const clientId = searchParams.get('clientId') || '';

    const where: any = {
      isActive: true
    };

    // Filter by client if specified
    if (clientId && clientId !== 'all') {
      where.clientId = clientId;
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    // Ensure price is returned as a number (Prisma Decimal fields are returned as strings)
    const formattedProducts = products.map(product => ({
      ...product,
      price: parseFloat(product.price.toString())
    }));

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Admin products GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, sku, description, price, category, stockLevel, minStock, allowPreorder, clientId } = data;

    // Validate required fields
    if (!name || !sku || !price || !category || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku, price, category, clientId' },
        { status: 400 }
      );
    }

    // Check if SKU already exists for this client
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku,
        clientId
      }
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists for this client' },
        { status: 400 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description: description || '',
        price: parseFloat(price),
        category,
        stockLevel: stockLevel || 0,
        minStock: minStock || 0,
        allowPreorder: allowPreorder || false,
        clientId,
        isActive: true
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      product,
      message: 'Product created successfully'
    });

  } catch (error: any) {
    console.error('Admin products POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
