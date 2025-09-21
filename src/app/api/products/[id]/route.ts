import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockStore } from '@/lib/mockStore'
import { UpdateProductRequest } from '@/types'
import { processImagesForEmbedding } from '@/lib/embeddings'
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

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    try {
      // Try to fetch from database first
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          categoryRef: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  parentId: true
                }
              }
            }
          },
          inventoryHistory: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(product)
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateProductRequest = await request.json()
    
    // Get user info for clientId
    const user = getUserFromRequest(request)
    if (!user || !user.clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Debug: Log the received data
    console.log('Product update request for ID:', id)
    console.log('Received images:', body.images)
    console.log('Received videos:', body.videos)
    console.log('Received thumbnailUrl:', body.thumbnailUrl)
    
    try {
      // Try to update in database first
      const existingProduct = await prisma.product.findUnique({
        where: { id }
      })

      if (!existingProduct) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Verify the product belongs to the correct client
      if (existingProduct.clientId !== user.clientId) {
        return NextResponse.json(
          { error: 'Unauthorized access to product' },
          { status: 403 }
        )
      }

      // Check if SKU is being changed and if it already exists
      if (body.sku && body.sku !== existingProduct.sku) {
        const skuExists = await prisma.product.findUnique({
          where: { sku: body.sku }
        })

        if (skuExists) {
          return NextResponse.json(
            { error: 'Product with this SKU already exists' },
            { status: 409 }
          )
        }
      }

      // Handle multiple categories if provided
      const updateData: any = {
        ...body,
        updatedAt: new Date()
      }

      // Debug: Log the received data
      console.log('Received update data:', {
        images: body.images,
        videos: body.videos,
        thumbnailUrl: body.thumbnailUrl,
        imagesCount: body.images ? body.images.length : 0,
        videosCount: body.videos ? body.videos.length : 0,
        imagesDetails: body.images ? body.images.map((m: any) => ({ 
          fileName: m.fileName, 
          hasUrl: !!m.url, 
          hasKey: !!m.key 
        })) : [],
        videosDetails: body.videos ? body.videos.map((m: any) => ({ 
          fileName: m.fileName, 
          hasUrl: !!m.url, 
          hasKey: !!m.key 
        })) : []
      })

      // Remove categoryIds from the update data as we'll handle it separately
      const { categoryIds, ...restUpdateData } = updateData

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...restUpdateData,
          // Handle multiple categories
          ...(categoryIds && {
            categories: {
              deleteMany: {}, // Remove all existing category associations
              create: categoryIds.map((categoryId: string) => ({
                categoryId
              }))
            }
          }),
          // Handle media updates
          ...(body.images || body.videos ? {
            media: {
              deleteMany: {}, // Remove all existing media associations
              create: [
                // Create media entries for images
                ...(body.images || []).map((img: any) => ({
                  kind: 'image' as const,
                  s3Key: img.key || img.url,
                  width: 0,
                  height: 0,
                  status: 'completed' as const
                })),
                // Create media entries for videos
                ...(body.videos || []).map((vid: any) => ({
                  kind: 'video' as const,
                  s3Key: vid.key || vid.url,
                  width: 0,
                  height: 0,
                  status: 'completed' as const
                }))
              ]
            }
          } : {})
        },
        include: {
          categoryRef: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  parentId: true
                }
              }
            }
          },
          inventoryHistory: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          },
          media: {
            select: {
              id: true,
              kind: true,
              s3Key: true,
              width: true,
              height: true,
              durationMs: true,
              status: true,
              error: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      })

      // Debug: Log what was actually saved
      console.log('Product updated successfully:', {
        id: product.id,
        imagesCount: product.images ? JSON.parse(JSON.stringify(product.images)).length : 0,
        videosCount: product.videos ? JSON.parse(JSON.stringify(product.videos)).length : 0,
        thumbnailUrl: product.thumbnailUrl,
        imagesDetails: product.images ? JSON.parse(JSON.stringify(product.images)).map((m: any) => ({ 
          fileName: m.fileName, 
          hasUrl: !!m.url, 
          hasKey: !!m.key 
        })) : [],
        videosDetails: product.videos ? JSON.parse(JSON.stringify(product.videos)).map((m: any) => ({ 
          fileName: m.fileName, 
          hasUrl: !!m.url, 
          hasKey: !!m.key 
        })) : []
      })

      // Process embeddings for newly uploaded images in the background
      if (product.media && product.media.length > 0) {
        const imageMedia = product.media.filter((media: any) => media.kind === 'image')
        if (imageMedia.length > 0) {
          // Process embeddings asynchronously (don't wait for completion)
          processImagesForEmbedding(imageMedia).catch(error => {
            console.error('Error processing image embeddings:', error)
          })
        }
      }

      return NextResponse.json(product)
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Soft delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    try {
      // Try to delete from database first
      const product = await prisma.product.findUnique({
        where: { id }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Soft delete by setting isActive to false
      await prisma.product.update({
        where: { id },
        data: { isActive: false }
      })

      return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}