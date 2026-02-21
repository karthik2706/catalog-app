import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
}

function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return decoded
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

/**
 * POST /api/media/register-bulk
 * Register an already-uploaded file (via presigned URL) in the Media table.
 * Body: { key, fileName, fileType, fileSize, mimeType }
 */
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const clientId = user.clientId
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { key, fileName, fileType, fileSize, mimeType } = body
    if (!key || !fileName || !fileType) {
      return NextResponse.json(
        { error: 'key, fileName, and fileType are required' },
        { status: 400 }
      )
    }

    if (!key.startsWith(`clients/${clientId}/`)) {
      return NextResponse.json({ error: 'Invalid key for this client' }, { status: 400 })
    }

    const mediaRecord = await prisma.media.create({
      data: {
        kind: fileType,
        s3Key: key,
        originalName: fileName,
        mimeType: mimeType || 'application/octet-stream',
        fileSize: Number(fileSize) || 0,
        width: undefined,
        height: undefined,
        durationMs: undefined,
        altText: null,
        caption: null,
        status: 'completed',
        error: null,
      },
    })

    const bucket = process.env.S3_BUCKET_NAME
    const region = process.env.AWS_REGION || 'us-east-2'
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`

    return NextResponse.json({
      success: true,
      result: {
        id: mediaRecord.id,
        name: fileName,
        type: fileType,
        size: Number(fileSize) || 0,
        s3Key: key,
        url,
      },
    })
  } catch (error) {
    console.error('Register bulk error:', error)
    return NextResponse.json(
      { error: 'Failed to register media' },
      { status: 500 }
    )
  }
}
