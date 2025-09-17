import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  
  // Extract subdomain from hostname
  const subdomain = hostname.split('.')[0]
  
  // Skip middleware for static files and API routes that don't need tenant context
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/admin/') ||
    pathname === '/admin'
  ) {
    return NextResponse.next()
  }

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      
      if (decoded.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
      return NextResponse.next()
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Handle tenant-specific routes
  if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
    // This is a tenant subdomain
    const response = NextResponse.next()
    
    // Add tenant context to headers for API routes
    response.headers.set('x-tenant-slug', subdomain)
    
    return response
  }

  // Handle main domain - allow access to dashboard for authenticated users
  if (pathname === '/') {
    // Let the client-side authentication handle the redirect logic
    // This allows the dashboard to load and then redirect if needed
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
