import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import jwt from 'jsonwebtoken'
import { generateBulkUploadFileName } from '@/lib/unique-naming'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

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
 * POST /api/media/presigned-bulk
 * Get a presigned URL for uploading a single large file directly to S3 (bypasses Vercel 4.5MB body limit).
 * Body: { folder, fileName, fileType, fileSize, mimeType }
 * fileType: 'image' | 'video' | 'audio' | 'document'
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
    const { folder = 'general', fileName, fileType, fileSize, mimeType } = body
    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image', 'video', 'audio', 'document']
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ error: 'Invalid fileType' }, { status: 400 })
    }

    const sizeBytes = Number(fileSize) || 0
    if (sizeBytes > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 50MB per file)' },
        { status: 400 }
      )
    }

    const uniqueFileName = generateBulkUploadFileName(fileName, fileType, folder, clientId)
    const s3Key = `clients/${clientId}/media/${folder}/${fileType}/${uniqueFileName}`

    const sanitize = (v: string) => String(v).replace(/[^a-zA-Z0-9\-_.]/g, '_').substring(0, 1024)
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: mimeType || (fileType === 'video' ? 'video/mp4' : 'application/octet-stream'),
      Metadata: {
        'client-id': sanitize(clientId),
        'file-type': sanitize(fileType),
        'original-name': sanitize(fileName),
        'folder': sanitize(folder),
      },
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return NextResponse.json({
      success: true,
      signedUrl,
      key: s3Key,
      fileName,
      fileType,
    })
  } catch (error) {
    console.error('Presigned bulk error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
