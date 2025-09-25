import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle 413 errors for bulk upload endpoint
  if (request.nextUrl.pathname === '/api/media/bulk-upload') {
    const contentLength = request.headers.get('content-length')
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024)
      
      // Vercel has a 4.5MB limit for serverless functions
      if (sizeInMB > 4.5) {
        return NextResponse.json(
          {
            error: 'Request too large',
            message: 'Upload size exceeds Vercel serverless function limits',
            maxSize: '4.5MB',
            currentSize: `${sizeInMB.toFixed(2)}MB`,
            suggestion: 'Please reduce file size or upload files individually'
          },
          { status: 413 }
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/media/bulk-upload'
}