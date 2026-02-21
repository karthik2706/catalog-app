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

// POST /api/media/assign - Assign media assets to products
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { mediaIds, productId, isPrimary } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Resolve clientId: use from JWT, or for MASTER_ADMIN get from product
    let clientId = user.clientId
    if (!clientId && user.role === 'MASTER_ADMIN') {
      const productForClient = await prisma.product.findUnique({
        where: { id: productId },
        select: { clientId: true }
      })
      if (productForClient) clientId = productForClient.clientId
    }
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Verify product belongs to client
    const product = await prisma.product.findFirst({
      where: { id: productId, clientId },
      select: { id: true, name: true, sku: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Allow empty mediaIds to mean "unassign all media from this product"
    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      await prisma.productMedia.deleteMany({
        where: { productId: productId }
      })
      return NextResponse.json({
        success: true,
        message: 'Successfully unassigned all media from product',
        product: { id: product.id, name: product.name, sku: product.sku },
        assignedMedia: []
      })
    }

    // Verify media assets belong to client
    const mediaAssets = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        s3Key: {
          startsWith: `clients/${clientId}/media/`
        }
      },
      select: { id: true, originalName: true, kind: true }
    })

    if (mediaAssets.length !== mediaIds.length) {
      return NextResponse.json(
        { error: 'Some media assets not found or not accessible' },
        { status: 404 }
      )
    }

    // If setting as primary, first unset any existing primary media for this product
    if (isPrimary) {
      await prisma.productMedia.updateMany({
        where: {
          productId: productId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      })
    }

    // Assign media to product using the junction table
    const assignmentPromises = mediaAssets.map((asset, index) =>
      prisma.productMedia.upsert({
        where: {
          productId_mediaId: {
            productId: productId,
            mediaId: asset.id
          }
        },
        update: {
          isPrimary: isPrimary && index === 0, // Only first asset is primary if isPrimary is true
          sortOrder: index,
          updatedAt: new Date()
        },
        create: {
          productId: productId,
          mediaId: asset.id,
          isPrimary: isPrimary && index === 0,
          sortOrder: index
        }
      })
    )

    await Promise.all(assignmentPromises)

    // Get updated media assets with product info from junction table
    const updatedMedia = await prisma.productMedia.findMany({
      where: { 
        mediaId: { in: mediaIds },
        productId: productId
      },
      select: {
        isPrimary: true,
        sortOrder: true,
        media: {
          select: {
            id: true,
            kind: true,
            s3Key: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            width: true,
            height: true,
            altText: true,
            caption: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    })

    // Check if environment variables are available
    if (!process.env.S3_BUCKET_NAME || !process.env.AWS_REGION) {
      return NextResponse.json(
        { error: 'S3 configuration missing' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${mediaAssets.length} media assets to product`,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku
      },
      assignedMedia: updatedMedia.map(assignment => ({
        ...assignment.media,
        isPrimary: assignment.isPrimary,
        sortOrder: assignment.sortOrder,
        url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${assignment.media.s3Key}`,
        thumbnailUrl: assignment.media.kind === 'image' 
          ? `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${assignment.media.s3Key}`
          : null
      }))
    })

  } catch (error) {
    console.error('Error assigning media:', error)
    return NextResponse.json(
      { error: 'Failed to assign media assets' },
      { status: 500 }
    )
  }
}

// DELETE /api/media/assign - Unassign media assets from products
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const mediaIds = searchParams.get('mediaIds')?.split(',')
    const productId = searchParams.get('productId')

    // Resolve clientId for MASTER_ADMIN when productId is provided
    let clientId = user.clientId
    if (!clientId && user.role === 'MASTER_ADMIN' && productId) {
      const productForClient = await prisma.product.findUnique({
        where: { id: productId },
        select: { clientId: true }
      })
      if (productForClient) clientId = productForClient.clientId
    }
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    if (!mediaIds || mediaIds.length === 0) {
      return NextResponse.json(
        { error: 'Media IDs are required' },
        { status: 400 }
      )
    }

    // Verify media assets belong to client
    const mediaAssets = await prisma.media.findMany({
      where: {
        id: { in: mediaIds },
        s3Key: {
          startsWith: `clients/${clientId}/media/`
        }
      },
      select: { id: true, originalName: true }
    })

    if (mediaAssets.length !== mediaIds.length) {
      return NextResponse.json(
        { error: 'Some media assets not found or not accessible' },
        { status: 404 }
      )
    }

    // Unassign media from products using the junction table
    if (productId) {
      // Remove specific product-media associations
      await prisma.productMedia.deleteMany({
        where: {
          mediaId: { in: mediaIds },
          productId: productId
        }
      })
    } else {
      // Remove all product associations for these media items
      await prisma.productMedia.deleteMany({
        where: {
          mediaId: { in: mediaIds }
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully unassigned ${mediaAssets.length} media assets`,
      unassignedMedia: mediaAssets.map(asset => ({
        id: asset.id,
        name: asset.originalName
      }))
    })

  } catch (error) {
    console.error('Error unassigning media:', error)
    return NextResponse.json(
      { error: 'Failed to unassign media assets' },
      { status: 500 }
    )
  }
}
