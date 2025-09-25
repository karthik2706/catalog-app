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

    const clientId = user.clientId
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const { mediaIds, productId, isPrimary } = await request.json()

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return NextResponse.json(
        { error: 'Media IDs are required' },
        { status: 400 }
      )
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
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
      await prisma.media.updateMany({
        where: {
          productId: productId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      })
    }

    // Assign media to product
    const updatePromises = mediaAssets.map((asset, index) => 
      prisma.media.update({
        where: { id: asset.id },
        data: {
          productId: productId,
          isPrimary: isPrimary && index === 0, // Only first asset is primary if isPrimary is true
          sortOrder: index,
          updatedAt: new Date()
        }
      })
    )

    await Promise.all(updatePromises)

    // Get updated media assets with product info
    const updatedMedia = await prisma.media.findMany({
      where: { id: { in: mediaIds } },
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
        caption: true,
        isPrimary: true,
        sortOrder: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${mediaAssets.length} media assets to product`,
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku
      },
      assignedMedia: updatedMedia.map(asset => ({
        ...asset,
        url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${asset.s3Key}`,
        thumbnailUrl: asset.kind === 'image' 
          ? `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${asset.s3Key}`
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

    const clientId = user.clientId
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const mediaIds = searchParams.get('mediaIds')?.split(',')
    const productId = searchParams.get('productId')

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
      select: { id: true, originalName: true, productId: true }
    })

    if (mediaAssets.length !== mediaIds.length) {
      return NextResponse.json(
        { error: 'Some media assets not found or not accessible' },
        { status: 404 }
      )
    }

    // If productId is provided, verify the media belongs to that product
    if (productId) {
      const invalidMedia = mediaAssets.filter(asset => asset.productId !== productId)
      if (invalidMedia.length > 0) {
        return NextResponse.json(
          { error: 'Some media assets do not belong to the specified product' },
          { status: 400 }
        )
      }
    }

    // Unassign media from products
    await prisma.media.updateMany({
      where: {
        id: { in: mediaIds }
      },
      data: {
        productId: null,
        isPrimary: false,
        sortOrder: 0,
        updatedAt: new Date()
      }
    })

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
