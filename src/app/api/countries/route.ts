import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🌍 [COUNTRIES API] Starting countries fetch...')
    
    const countries = await prisma.country.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log(`🌍 [COUNTRIES API] Found ${countries.length} countries:`, countries.map(c => `${c.name} (${c.code})`))
    
    const response = NextResponse.json(countries)
    
    // Disable caching for this endpoint
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response
  } catch (error) {
    console.error('❌ [COUNTRIES API] Error fetching countries:', error)
    return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 })
  }
}
