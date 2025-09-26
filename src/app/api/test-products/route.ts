import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TEST_PRODUCTS] Test products endpoint called');
    
    // Return a simple test response without any database calls
    return NextResponse.json({
      success: true,
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
    });
    
  } catch (error: any) {
    console.error('❌ [TEST_PRODUCTS] Error:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
