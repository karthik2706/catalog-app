import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST /api/guest/logout - Clear guest token cookies
export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json()

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    
    // Delete cookies
    cookieStore.delete(`guest_token_${slug}`)
    cookieStore.delete(`guest_client_${slug}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging out guest:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}

