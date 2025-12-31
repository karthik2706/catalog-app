import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { generateSignedUrl } from '@/lib/aws'
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
      const secret = process.env.JWT_SECRET
      if (!secret) {
        throw new Error('JWT_SECRET not configured')
      }
      const decoded = jwt.verify(token, secret) as JWTPayload
      if (decoded.userId && decoded.role) {
        return {
          userId: decoded.userId,
          role: decoded.role,
          clientId: decoded.clientId
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

// POST /api/orders/[id]/payment-proof - Upload payment proof file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has permission to upload payment proof
    const isAdmin = user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'MASTER_ADMIN'
    
    // Regular users can upload payment proof for any order
    // Admins can upload for orders in their client (or any order for MASTER_ADMIN)
    const where: any = { id }
    
    // Only filter by client for admins (not MASTER_ADMIN)
    // Regular users can upload payment proof for any order
    if (isAdmin && user.role !== 'MASTER_ADMIN' && user.clientId) {
      where.clientId = user.clientId
    }

    // Verify order exists and user has access
    const order = await prisma.order.findFirst({
      where,
      select: { id: true, orderNumber: true, clientId: true }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Validate file type (images and PDFs only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed' },
        { status: 400 }
      )
    }

    // Check AWS configuration
    if (!process.env.S3_BUCKET_NAME) {
      return NextResponse.json(
        { error: 'S3_BUCKET_NAME environment variable is not configured' },
        { status: 500 }
      )
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials are not configured' },
        { status: 500 }
      )
    }

    // Generate S3 key
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'bin'
    const sanitizedOrderNumber = order.orderNumber.replace(/[^a-zA-Z0-9]/g, '-')
    const fileName = `payment-proof-${sanitizedOrderNumber}-${timestamp}.${fileExtension}`
    const s3Key = `clients/${order.clientId}/orders/${sanitizedOrderNumber}/payment-proof/${fileName}`

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Sanitize file name for metadata (remove invalid characters for HTTP headers)
    // HTTP headers can't contain certain characters like newlines, tabs, etc.
    const sanitizedFileName = file.name
      .replace(/[\r\n\t]/g, ' ') // Replace newlines and tabs with spaces
      .replace(/[^\x20-\x7E]/g, '') // Remove non-printable ASCII characters
      .trim()
      .substring(0, 255) // Limit length
    
    try {
      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          'client-id': order.clientId,
          'order-id': order.id,
          'order-number': order.orderNumber,
          'file-type': 'payment-proof',
          'original-name': sanitizedFileName
        }
      })

      await s3Client.send(putObjectCommand)
    } catch (s3Error: any) {
      console.error('S3 upload error:', s3Error)
      return NextResponse.json(
        { 
          error: 'Failed to upload file to S3',
          message: process.env.NODE_ENV === 'development' ? s3Error.message : 'Please check AWS configuration'
        },
        { status: 500 }
      )
    }

    // Generate signed URL for the uploaded file (max 7 days for S3 presigned URLs)
    const signedUrl = await generateSignedUrl(s3Key, 7 * 24 * 60 * 60) // 7 days expiry

    // Update order with payment proof URL
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { paymentProofUrl: s3Key },
      select: {
        id: true,
        paymentProofUrl: true
      }
    })

    return NextResponse.json({
      success: true,
      paymentProofUrl: signedUrl,
      s3Key: s3Key
    })
  } catch (error: any) {
    console.error('Error uploading payment proof:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload payment proof' },
      { status: 500 }
    )
  }
}

