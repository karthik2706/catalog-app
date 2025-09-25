import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import jwt from 'jsonwebtoken'

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

// POST /api/media/bulk-upload - Bulk upload media files to client folder
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const clientId = user.clientId
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const folder = formData.get('folder') as string || 'general'

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadResults = []
    const errors = []

    for (const file of files) {
      try {
        // Validate file
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
          errors.push(`${file.name}: File too large (max 50MB)`)
          continue
        }

        // Determine file type
        const fileType = file.type.startsWith('image/') ? 'image' :
                        file.type.startsWith('video/') ? 'video' :
                        file.type.startsWith('audio/') ? 'audio' : 'document'

        // Generate S3 key for client-specific folder
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop()
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const s3Key = `clients/${clientId}/media/${folder}/${fileType}/${timestamp}-${sanitizedFileName}`

        // Upload to S3
        const buffer = Buffer.from(await file.arrayBuffer())
        
        // Sanitize metadata values for S3 (only allow alphanumeric, hyphens, underscores, and dots)
        const sanitizeMetadata = (value: string) => {
          return value.replace(/[^a-zA-Z0-9\-_.]/g, '_').substring(0, 1024) // S3 metadata limit
        }

        const putObjectCommand = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            'client-id': sanitizeMetadata(clientId),
            'file-type': sanitizeMetadata(fileType),
            'original-name': sanitizeMetadata(file.name),
            'folder': sanitizeMetadata(folder)
          }
        })

        await s3Client.send(putObjectCommand)

        // Get image dimensions if it's an image
        let width: number | undefined
        let height: number | undefined
        let durationMs: number | undefined
        let thumbnailUrl: string | undefined

        if (fileType === 'image') {
          try {
            const sharp = require('sharp')
            const metadata = await sharp(buffer).metadata()
            width = metadata.width
            height = metadata.height
          } catch (error) {
            console.warn('Could not extract image dimensions:', error)
          }
        } else if (fileType === 'video') {
          // For videos, we could extract duration and dimensions using ffmpeg
          // For now, we'll leave them undefined
          durationMs = undefined
          
          // Generate a simple thumbnail URL (first frame)
          // In a production environment, you'd want to use ffmpeg to extract a proper thumbnail
          thumbnailUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/media/thumbnail/${encodeURIComponent(s3Key)}`
        }

        // Create media record in database
        const mediaRecord = await prisma.media.create({
          data: {
            productId: null, // null for unassigned media
            kind: fileType,
            s3Key: s3Key,
            originalName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            width: width,
            height: height,
            durationMs: durationMs,
            altText: null,
            caption: null,
            sortOrder: 0,
            isPrimary: false,
            status: 'completed',
            error: null
          }
        })

        uploadResults.push({
          id: mediaRecord.id,
          name: file.name,
          type: fileType,
          size: file.size,
          s3Key: s3Key,
          url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`,
          width: width,
          height: height,
          status: 'success'
        })

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        errors.push(`${file.name}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadResults.length,
      total: files.length,
      results: uploadResults,
      errors: errors
    })

  } catch (error) {
    console.error('Bulk upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}
