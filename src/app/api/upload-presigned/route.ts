import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3_CONFIG, validateFileType, generateS3Key } from '@/lib/aws'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

function getUserFromRequest(request: NextRequest): { userId: string; role: string; clientId?: string } | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return {
        userId: decoded.userId,
        role: decoded.role,
        clientId: decoded.clientId
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

function getClientIdFromRequest(request: NextRequest): string | null {
  const user = getUserFromRequest(request)
  if (!user) {
    return null
  }
  
  // For super admin, we need to get clientId from the request body
  if (user.role === 'SUPER_ADMIN') {
    // We'll handle this in the main function
    return null
  }
  
  return user.clientId || null
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { fileName, fileType, fileSize, sku, clientId: requestClientId } = body

    // Determine clientId based on user role
    let clientId: string
    if (user.role === 'SUPER_ADMIN') {
      // For super admin, require a clientId in the request body
      if (!requestClientId) {
        return NextResponse.json(
          { error: 'Client ID required for super admin' },
          { status: 400 }
        )
      }
      clientId = requestClientId
    } else if (!user.clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    } else {
      clientId = user.clientId
    }

    if (!fileName || !fileType || !sku) {
      return NextResponse.json(
        { error: 'fileName, fileType, and sku are required' },
        { status: 400 }
      )
    }

    // Validate file type
    const mockFile = { name: fileName, type: fileType, size: fileSize } as File
    const validation = validateFileType(mockFile)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Determine file type category
    let fileTypeCategory: 'image' | 'video' = 'image'
    if (S3_CONFIG.allowedFileTypes.images.includes(fileType)) {
      fileTypeCategory = 'image'
    } else if (S3_CONFIG.allowedFileTypes.videos.includes(fileType)) {
      fileTypeCategory = 'video'
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // Generate S3 key
    const s3Key = generateS3Key(fileName, clientId, sku, fileTypeCategory)

    // Create S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })

    // Generate pre-signed URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'quick-stock-media',
      Key: s3Key,
      ContentType: fileType,
      Metadata: {
        'original-name': fileName,
        'client-id': clientId,
        'product-sku': sku,
        'file-type': fileTypeCategory,
      },
    })

    const signedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 // 1 hour
    })

    return NextResponse.json({
      success: true,
      signedUrl,
      key: s3Key,
      fileName,
      fileType,
      fileSize,
    })

  } catch (error) {
    console.error('Pre-signed URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate pre-signed URL' },
      { status: 500 }
    )
  }
}
