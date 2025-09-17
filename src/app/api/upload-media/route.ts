import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3_CONFIG, validateFileType, generateS3Key } from '@/lib/aws'
import { processImageFile, processVideoFile, uploadToS3 } from '@/lib/s3-upload'
import jwt from 'jsonwebtoken'

// Configure body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

function getClientIdFromRequest(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  console.log('Token received:', token ? `${token.substring(0, 20)}...` : 'No token')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      console.log('Decoded token:', decoded)
      return decoded.clientId || null
    } catch (error) {
      console.error('Error decoding token:', error)
      console.error('Token length:', token.length)
      console.error('Token starts with:', token.substring(0, 10))
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

    // Check content length before processing
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 413 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const sku = formData.get('sku') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!sku) {
      return NextResponse.json(
        { error: 'Product SKU is required for file organization' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFileType(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let processedFile
    let uploadResult

    try {
      // Determine file type
      let fileType: 'image' | 'video' = 'image'
      if (S3_CONFIG.allowedFileTypes.images.includes(file.type)) {
        fileType = 'image'
        processedFile = await processImageFile(buffer, file.name, file.type)
      } else if (S3_CONFIG.allowedFileTypes.videos.includes(file.type)) {
        fileType = 'video'
        processedFile = await processVideoFile(buffer, file.name, file.type)
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type' },
          { status: 400 }
        )
      }

      // Upload to S3 with proper folder structure
      uploadResult = await uploadToS3(processedFile, clientId, sku, fileType)

      if (!uploadResult.success) {
        return NextResponse.json(
          { error: uploadResult.error || 'Upload failed' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        key: uploadResult.key,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })

    } catch (error) {
      console.error('File processing error:', error)
      return NextResponse.json(
        { error: `File processing failed: ${error.message}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to generate signed URLs for private files
export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600')

    if (!key) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      )
    }

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'quick-stock-media',
      Key: key,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresIn,
    })

  } catch (error) {
    console.error('Signed URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    )
  }
}
