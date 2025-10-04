import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import sharp from 'sharp'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { generateProductMediaFileName } from '@/lib/unique-naming'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

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

// GET /api/media - Get media files for a product
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
    const productId = searchParams.get('productId')
    const kind = searchParams.get('kind')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Verify product belongs to client
    const product = await prisma.product.findFirst({
      where: { id: productId, clientId },
      select: { id: true, sku: true, name: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Build where clause using ProductMedia junction table
    const where: any = {}
    if (kind) where.kind = kind
    if (status) where.status = status

    const [mediaFiles, total] = await Promise.all([
      prisma.media.findMany({
        where: {
          ...where,
          productMedia: {
            some: {
              productId: productId
            }
          }
        },
        include: {
          productMedia: {
            where: { productId },
            orderBy: [
              { isPrimary: 'desc' },
              { sortOrder: 'asc' }
            ]
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.media.count({ 
        where: {
          ...where,
          productMedia: {
            some: {
              productId: productId
            }
          }
        }
      })
    ])

    // Generate signed URLs for media files
    const mediaWithUrls = await Promise.all(
      mediaFiles.map(async (media) => {
        let url = null
        let thumbnailUrl = null

        try {
          // Generate signed URL for main file
          const getObjectCommand = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: media.s3Key
          })
          url = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 })

          // Generate thumbnail URL if it's an image
          if (media.kind === 'image') {
            const thumbnailKey = media.s3Key.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '_thumb.$1')
            try {
              const getThumbnailCommand = new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: thumbnailKey
              })
              thumbnailUrl = await getSignedUrl(s3Client, getThumbnailCommand, { expiresIn: 3600 })
            } catch (error) {
              // Thumbnail doesn't exist, use main image
              thumbnailUrl = url
            }
          }
        } catch (error) {
          console.error('Error generating signed URL:', error)
        }

        return {
          ...media,
          url,
          thumbnailUrl
        }
      })
    )

    return NextResponse.json({
      mediaFiles: mediaWithUrls,
      product,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching media files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media files' },
      { status: 500 }
    )
  }
}

// POST /api/media - Upload new media file
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const productId = formData.get('productId') as string
    const sku = formData.get('sku') as string

    if (!file || !productId || !sku) {
      return NextResponse.json(
        { error: 'File, product ID, and SKU are required' },
        { status: 400 }
      )
    }

    // Verify product belongs to client
    const product = await prisma.product.findFirst({
      where: { id: productId, clientId },
      select: { id: true, sku: true, name: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Determine file type
    const fileType = file.type.startsWith('image/') ? 'image' :
                    file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'audio' : 'document'

    // Generate S3 key with unique naming
    const uniqueFileName = generateProductMediaFileName(file.name, fileType, sku, clientId)
    const s3Key = `clients/${clientId}/products/${sku}/media/${fileType}/${uniqueFileName}`

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer())
    
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        'client-id': clientId,
        'file-type': fileType,
        'original-name': file.name,
        'product-sku': sku
      }
    })

    await s3Client.send(putObjectCommand)

    // Process image if it's an image file
    let width: number | undefined
    let height: number | undefined
    let thumbnailS3Key: string | undefined

    if (fileType === 'image') {
      try {
        const image = sharp(buffer)
        const metadata = await image.metadata()
        width = metadata.width
        height = metadata.height

        // Create thumbnail
        const thumbnailBuffer = await image
          .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer()

        thumbnailS3Key = s3Key.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '_thumb.jpg')
        
        const putThumbnailCommand = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: thumbnailS3Key,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          Metadata: {
            'client-id': clientId,
            'file-type': 'thumbnail',
            'original-name': file.name,
            'product-sku': sku
          }
        })

        await s3Client.send(putThumbnailCommand)
      } catch (error) {
        console.error('Error processing image:', error)
      }
    }

    // Get next sort order from ProductMedia junction table
    const lastProductMedia = await prisma.productMedia.findFirst({
      where: { productId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    const nextSortOrder = (lastProductMedia?.sortOrder || 0) + 1

    // Create media record (without productId)
    const media = await prisma.media.create({
      data: {
        kind: fileType,
        s3Key,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        width,
        height,
        status: 'completed'
      }
    })

    // Check if this is the first media file for this product
    const mediaCount = await prisma.productMedia.count({ where: { productId } })
    const isPrimary = mediaCount === 0

    // Create ProductMedia junction record
    const productMedia = await prisma.productMedia.create({
      data: {
        productId,
        mediaId: media.id,
        sortOrder: nextSortOrder,
        isPrimary
      }
    })

    return NextResponse.json({
      success: true,
      media: {
        ...media,
        thumbnailS3Key,
        productMedia: productMedia
      }
    })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
