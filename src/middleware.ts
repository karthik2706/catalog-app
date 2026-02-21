import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow bulk upload up to 100MB (must match api/media/bulk-upload and Vercel/server body limit)
  if (request.nextUrl.pathname === '/api/media/bulk-upload') {
    const contentLength = request.headers.get('content-length')
    const maxSizeMB = 100
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024)
      if (sizeInMB > maxSizeMB) {
        return NextResponse.json(
          {
            error: 'Request too large',
            message: 'Upload size exceeds server limits',
            maxSize: `${maxSizeMB}MB`,
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