import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST /api/guest/set-token - Set guest token in HTTP-only cookie
export async function POST(request: NextRequest) {
  try {
    const { slug, token, client } = await request.json()

    if (!slug || !token) {
      return NextResponse.json(
        { error: 'Slug and token are required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    
    // Set HTTP-only cookie for security
    cookieStore.set(`guest_token_${slug}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    // Also store client info in a separate cookie (non-HTTP-only for client access)
    if (client) {
      cookieStore.set(`guest_client_${slug}`, JSON.stringify(client), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting guest token:', error)
    return NextResponse.json(
      { error: 'Failed to set token' },
      { status: 500 }
    )
  }
}

