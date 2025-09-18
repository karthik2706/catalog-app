import { NextRequest, NextResponse } from 'next/server'
import { refreshMediaUrls } from '@/lib/aws'

export async function POST(request: NextRequest) {
  try {
    const { media } = await request.json()
    
    if (!media || !Array.isArray(media)) {
      return NextResponse.json(
        { error: 'Media array is required' },
        { status: 400 }
      )
    }

    console.log('Refreshing media URLs for', media.length, 'items')
    const refreshedMedia = await refreshMediaUrls(media)
    
    return NextResponse.json({ media: refreshedMedia })
  } catch (error: any) {
    console.error('Error refreshing media URLs:', error)
    return NextResponse.json(
      { error: 'Failed to refresh media URLs' },
      { status: 500 }
    )
  }
}
