import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TEST_PRISMA] Testing Prisma connection');
    
    // Test basic Prisma connection
    await prisma.$connect();
    console.log('🔍 [TEST_PRISMA] Prisma connected');
    
    // Test API key lookup
    const apiKey = 'cat_sk_d2d906dd5b9c28e4d7bbe8e58f140603de86de5f096bfdfaf6192064210a29ae';
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { client: true }
    });
    
    console.log('🔍 [TEST_PRISMA] API key lookup result:', apiKeyRecord ? 'FOUND' : 'NOT FOUND');
    
    if (apiKeyRecord) {
      console.log('🔍 [TEST_PRISMA] API key details:', {
        id: apiKeyRecord.id,
        isActive: apiKeyRecord.isActive,
        clientActive: apiKeyRecord.client.isActive
      });
    }
    
    return NextResponse.json({
      success: true,
      prismaConnected: true,
      apiKeyFound: !!apiKeyRecord,
      apiKeyDetails: apiKeyRecord ? {
        id: apiKeyRecord.id,
        isActive: apiKeyRecord.isActive,
        clientActive: apiKeyRecord.client.isActive
      } : null
    });
    
  } catch (error: any) {
    console.error('❌ [TEST_PRISMA] Error:', error.message);
    console.error('❌ [TEST_PRISMA] Stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
