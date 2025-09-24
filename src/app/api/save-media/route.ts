import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

function getClientIdFromRequest(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return decoded.clientId || null
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { s3Key, sku, kind } = await request.json()

    if (!s3Key || !sku || !kind) {
      return NextResponse.json(
        { error: 'S3 key, SKU, and kind are required' },
        { status: 400 }
      )
    }

    // Find the product by SKU to get productId
    const product = await prisma.product.findFirst({
      where: {
        sku: sku,
        clientId: clientId,
      },
      select: {
        id: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Save media to database
    const media = await prisma.media.create({
      data: {
        productId: product.id,
        kind: kind as 'image' | 'video',
        s3Key: s3Key,
        width: 0, // Will be updated later if needed
        height: 0, // Will be updated later if needed
        status: 'completed',
      },
    })

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        s3Key: media.s3Key,
        kind: media.kind,
      },
    })

  } catch (error) {
    console.error('Error saving media:', error)
    return NextResponse.json(
      { error: 'Failed to save media' },
      { status: 500 }
    )
  }
}
