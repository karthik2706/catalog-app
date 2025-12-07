import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockStore } from '@/lib/mockStore'
import { UpdateProductRequest } from '@/types'
import { processMediaForEmbedding } from '@/lib/embeddings'
import { generateSignedUrl } from '@/lib/aws'
import jwt from 'jsonwebtoken'
import { rejectGuestTokens } from '@/lib/guest-auth-guard'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

function getUserFromRequest(request: NextRequest): { userId: string; role: string; clientId?: string } | null {
  // Reject guest tokens first
  const guestRejection = rejectGuestTokens(request)
  if (guestRejection) {
    return null
  }
  
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      // Ensure this is a user token (has userId and role)
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
          productMedia: {
            select: {
              isPrimary: true,
              sortOrder: true,
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

      // Generate signed URLs for media files
      const images: any[] = []
      const videos: any[] = []
      const mediaItems: any[] = []
      let thumbnailUrl: string | null = null

      if (product.productMedia && product.productMedia.length > 0) {
        for (const pm of product.productMedia) {
          const media = pm.media
          if (!media || !media.s3Key) continue

          try {
            // Generate signed URL for the media file
            const signedUrl = await generateSignedUrl(media.s3Key, 7 * 24 * 60 * 60) // 7 days
            
            const mediaItem = {
              id: media.id,
              kind: media.kind,
              url: signedUrl,
              s3Key: media.s3Key,
              key: media.s3Key, // For compatibility with refresh-urls API
              width: media.width,
              height: media.height,
              durationMs: media.durationMs,
              status: media.status,
              createdAt: media.createdAt,
              updatedAt: media.updatedAt
            }

            if (media.kind === 'image') {
              images.push(mediaItem)
              // Set thumbnailUrl from first primary image
              if (pm.isPrimary && !thumbnailUrl) {
                thumbnailUrl = signedUrl
              }
            } else if (media.kind === 'video') {
              videos.push({
                ...mediaItem,
                thumbnailUrl: null // Could generate thumbnail URL if needed
              })
            } else {
              mediaItems.push(mediaItem)
            }
          } catch (error) {
            console.error(`Error generating signed URL for media ${media.id}:`, error)
          }
        }
      }

      // Convert BigInt fields to strings for JSON serialization
      const serializedProduct = JSON.parse(JSON.stringify(product, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ))
      
      // Add images, videos, and thumbnailUrl to the response
      return NextResponse.json({
        ...serializedProduct,
        images,
        videos,
        mediaItems,
        thumbnailUrl: thumbnailUrl || serializedProduct.thumbnailUrl
      })
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
    // Explicitly reject guest tokens
    const guestRejection = rejectGuestTokens(request)
    if (guestRejection) {
      return guestRejection
    }
    
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

      // Remove categoryIds, categoryId, clientId, and cost from the update data as we'll handle them separately
      // allowPreorder is now re-enabled since local database is properly synced
      const { categoryIds, categoryId, clientId, cost, ...restUpdateData } = updateData
      
      // Double-check: explicitly remove cost if it still exists
      if ('cost' in restUpdateData) {
        delete restUpdateData.cost
      }

      console.log('Update data after filtering:', {
        categoryIds,
        clientId,
        restUpdateDataKeys: Object.keys(restUpdateData),
        restUpdateData
      })

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...restUpdateData,
          // Handle categories if provided (support both categoryId and categoryIds)
          ...((categoryId || categoryIds) && {
            categories: {
              deleteMany: {}, // Remove all existing category associations
              create: (categoryId ? [categoryId] : categoryIds || []).map((catId: string) => ({
                categoryId: catId
              }))
            }
          }),
          // Handle media updates
          ...(body.images || body.videos ? {
            productMedia: {
              deleteMany: {}, // Remove all existing media associations
              create: [
                // Create media entries for images
                ...(body.images || []).map((img: any, index: number) => ({
                  media: {
                    create: {
                      kind: 'image' as const,
                      s3Key: img.key || img.url,
                      width: 0,
                      height: 0,
                      status: 'completed' as const
                    }
                  },
                  isPrimary: index === 0, // First image is primary
                  sortOrder: index + 1
                })),
                // Create media entries for videos
                ...(body.videos || []).map((vid: any, index: number) => ({
                  media: {
                    create: {
                      kind: 'video' as const,
                      s3Key: vid.key || vid.url,
                      width: 0,
                      height: 0,
                      status: 'completed' as const
                    }
                  },
                  isPrimary: false, // Videos are not primary
                  sortOrder: (body.images?.length || 0) + index + 1
                }))
              ]
            }
          } : {})
        },
        include: {
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
          productMedia: {
            select: {
              isPrimary: true,
              sortOrder: true,
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

      // Process embeddings for newly uploaded media (images and videos) in the background
      if (product.productMedia && product.productMedia.length > 0) {
        // Extract media items from productMedia relationships
        const mediaItems = product.productMedia.map(pm => pm.media)
        // Process embeddings asynchronously (don't wait for completion)
        processMediaForEmbedding(mediaItems).catch(error => {
          console.error('Error processing media embeddings:', error)
        })
      }

      // Convert BigInt fields to strings for JSON serialization
      const serializedProduct = JSON.parse(JSON.stringify(product, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ))
      return NextResponse.json(serializedProduct)
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

// DELETE /api/products/[id] - Permanently delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Explicitly reject guest tokens
    const guestRejection = rejectGuestTokens(request)
    if (guestRejection) {
      return guestRejection
    }
    
    const { id } = await params
    
    // Check user authentication and permissions
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    try {
      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Permission check based on role:
      // - MASTER_ADMIN: can delete any product
      // - ADMIN, USER: can delete products from their own client
      if (user.role === 'MASTER_ADMIN') {
        // MASTER_ADMIN can delete any product
      } else if (user.role === 'ADMIN' || user.role === 'USER') {
        // ADMIN and USER can delete products from their own client
        if (!user.clientId) {
          return NextResponse.json(
            { error: 'Client context required' },
            { status: 403 }
          )
        }
        
        if (product.clientId !== user.clientId) {
          return NextResponse.json(
            { error: 'You can only delete products from your own organization.' },
            { status: 403 }
          )
        }
      } else {
        // Other roles (MANAGER, etc.) don't have delete permissions
        return NextResponse.json(
          { error: 'Insufficient permissions to delete products.' },
          { status: 403 }
        )
      }

      // Permanently delete product and related data
      await prisma.$transaction(async (tx) => {
        // Delete related data first
        // Delete ProductMedia relationships first
        await tx.productMedia.deleteMany({
          where: { productId: id }
        })

        // Delete media files that are no longer associated with any products
        const orphanedMedia = await tx.media.findMany({
          where: {
            productMedia: {
              none: {}
            }
          }
        })

        if (orphanedMedia.length > 0) {
          await tx.media.deleteMany({
            where: {
              id: { in: orphanedMedia.map(m => m.id) }
            }
          })
        }

        await tx.inventoryHistory.deleteMany({
          where: { productId: id }
        })

        await tx.productCategory.deleteMany({
          where: { productId: id }
        })

        // Delete the product itself
        await tx.product.delete({
          where: { id }
        })
      })

      return NextResponse.json({ message: 'Product permanently deleted successfully' })
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