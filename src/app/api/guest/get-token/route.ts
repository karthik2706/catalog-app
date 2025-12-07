import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// GET /api/guest/get-token - Get guest token from cookie
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const token = cookieStore.get(`guest_token_${slug}`)?.value
    const clientCookie = cookieStore.get(`guest_client_${slug}`)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No token found' },
        { status: 401 }
      )
    }

    let client = null
    if (clientCookie) {
      try {
        client = JSON.parse(clientCookie)
      } catch (e) {
        // Ignore parse errors
      }
    }

    return NextResponse.json({
      token,
      client
    })
  } catch (error) {
    console.error('Error getting guest token:', error)
    return NextResponse.json(
      { error: 'Failed to get token' },
      { status: 500 }
    )
  }
}

