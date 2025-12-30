import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

// GET /api/orders/[id] - Get order details
export async function GET(
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

    const where: any = { id }

    // Filter by client if not super admin
    if (user.role !== 'MASTER_ADMIN' && user.clientId) {
      where.clientId = user.clientId
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                thumbnailUrl: true,
                productMedia: {
                  where: {
                    media: {
                      kind: 'image'
                    }
                  },
                  include: {
                    media: {
                      select: {
                        id: true,
                        s3Key: true,
                        kind: true
                      }
                    }
                  },
                  take: 1,
                  orderBy: {
                    isPrimary: 'desc'
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Generate signed URL for payment proof if exists
    let paymentProofUrl: string | null = null
    if (order.paymentProofUrl) {
      try {
        // Check if it's already a full URL
        if (order.paymentProofUrl.startsWith('http://') || order.paymentProofUrl.startsWith('https://')) {
          paymentProofUrl = order.paymentProofUrl
        } else {
          // Generate signed URL for S3 key
          paymentProofUrl = await generateSignedUrl(order.paymentProofUrl, 7 * 24 * 60 * 60) // 7 days
        }
      } catch (error) {
        console.error('Error generating signed URL for payment proof:', error)
      }
    }

    // Process items to generate signed URLs for product thumbnails
    const processedItems = await Promise.all(
      order.items.map(async (item) => {
        if (!item.product) {
          return item
        }

        let thumbnailUrl = item.product.thumbnailUrl

        // If no thumbnailUrl, try to get from productMedia
        if (!thumbnailUrl && item.product.productMedia && item.product.productMedia.length > 0) {
          const firstImage = item.product.productMedia[0]?.media
          if (firstImage?.s3Key) {
            thumbnailUrl = firstImage.s3Key
          }
        }

        if (!thumbnailUrl) {
          return {
            ...item,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              thumbnailUrl: null
            }
          }
        }

        // Check if thumbnailUrl is already a full URL
        if (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) {
          return {
            ...item,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              thumbnailUrl: thumbnailUrl
            }
          }
        }

        // If it's an S3 key, generate signed URL
        try {
          const signedUrl = await generateSignedUrl(thumbnailUrl, 7 * 24 * 60 * 60) // 7 days
          return {
            ...item,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              thumbnailUrl: signedUrl
            }
          }
        } catch (error) {
          console.error('Error generating signed URL for thumbnail:', error)
          return {
            ...item,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              thumbnailUrl: null
            }
          }
        }
      })
    )

    return NextResponse.json({
      order: {
        ...order,
        paymentProofUrl: paymentProofUrl || order.paymentProofUrl,
        items: processedItems
      }
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
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

    // Only admin and manager can update orders
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, notes, paymentUTR, paymentTransactionNumber, paymentProofUrl } = body

    const where: any = { id }

    // Filter by client if not super admin
    if (user.role !== 'MASTER_ADMIN' && user.clientId) {
      where.clientId = user.clientId
    }

    const updateData: any = {}
    if (status) {
      const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }
      updateData.status = status
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }
    if (paymentUTR !== undefined) {
      updateData.paymentUTR = paymentUTR || null
    }
    if (paymentTransactionNumber !== undefined) {
      updateData.paymentTransactionNumber = paymentTransactionNumber || null
    }
    if (paymentProofUrl !== undefined) {
      updateData.paymentProofUrl = paymentProofUrl || null
    }

    // Fetch current order to check status change
    const currentOrder = await prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                stockLevel: true
              }
            }
          }
        }
      }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const oldStatus = currentOrder.status
    const newStatus = status || oldStatus

    // Use transaction to ensure atomicity of order update and inventory changes
    const order = await prisma.$transaction(async (tx) => {
      // Handle inventory updates based on status changes
      if (status && status !== oldStatus) {
        // Status is changing to CONFIRMED - reduce inventory
        if (newStatus === 'CONFIRMED' && oldStatus !== 'CONFIRMED') {
          for (const item of currentOrder.items) {
            if (!item.productId) continue

            // Fetch current product stock
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stockLevel: true }
            })

            if (!product) continue

            // Calculate new stock level (reduce by quantity)
            const newStockLevel = Math.max(0, product.stockLevel - item.quantity)

            // Update product stock
            await tx.product.update({
              where: { id: item.productId },
              data: { stockLevel: newStockLevel }
            })

            // Create inventory history record
            await tx.inventoryHistory.create({
              data: {
                productId: item.productId,
                quantity: -item.quantity, // Negative for reduction
                type: 'SALE',
                reason: `Order ${currentOrder.orderNumber} - Status changed to CONFIRMED`,
                clientId: currentOrder.clientId,
                userId: user.userId || null
              }
            })
          }
        }

        // Status is changing from CONFIRMED to CANCELLED - restore inventory
        if (newStatus === 'CANCELLED' && oldStatus === 'CONFIRMED') {
          for (const item of currentOrder.items) {
            if (!item.productId) continue

            // Fetch current product stock
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stockLevel: true }
            })

            if (!product) continue

            // Calculate new stock level (restore quantity)
            const newStockLevel = product.stockLevel + item.quantity

            // Update product stock
            await tx.product.update({
              where: { id: item.productId },
              data: { stockLevel: newStockLevel }
            })

            // Create inventory history record
            await tx.inventoryHistory.create({
              data: {
                productId: item.productId,
                quantity: item.quantity, // Positive for restoration
                type: 'RETURN',
                reason: `Order ${currentOrder.orderNumber} - Status changed from CONFIRMED to CANCELLED`,
                clientId: currentOrder.clientId,
                userId: user.userId || null
              }
            })
          }
        }
      }

      // Update the order
      const updatedOrder = await tx.order.update({
        where,
        data: updateData,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  thumbnailUrl: true,
                  productMedia: {
                    where: {
                      media: {
                        kind: 'image'
                      }
                    },
                    include: {
                      media: {
                        select: {
                          id: true,
                          s3Key: true,
                          kind: true
                        }
                      }
                    },
                    take: 1,
                    orderBy: {
                      isPrimary: 'desc'
                    }
                  }
                }
              }
            }
          },
          client: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      })

      // Generate signed URL for payment proof if exists
      let paymentProofUrl: string | null = null
      if (updatedOrder.paymentProofUrl) {
        try {
          if (updatedOrder.paymentProofUrl.startsWith('http://') || updatedOrder.paymentProofUrl.startsWith('https://')) {
            paymentProofUrl = updatedOrder.paymentProofUrl
          } else {
            paymentProofUrl = await generateSignedUrl(updatedOrder.paymentProofUrl, 7 * 24 * 60 * 60) // 7 days
          }
        } catch (error) {
          console.error('Error generating signed URL for payment proof:', error)
        }
      }

      return {
        ...updatedOrder,
        paymentProofUrl: paymentProofUrl || updatedOrder.paymentProofUrl
      }
    })

    // Process items to generate signed URLs for product thumbnails
    const processedItems = await Promise.all(
      order.items.map(async (item) => {
        if (!item.product) {
          return item
        }

        let thumbnailUrl = item.product.thumbnailUrl

        // If no thumbnailUrl, try to get from productMedia
        if (!thumbnailUrl && item.product.productMedia && item.product.productMedia.length > 0) {
          const firstImage = item.product.productMedia[0]?.media
          if (firstImage?.s3Key) {
            thumbnailUrl = firstImage.s3Key
          }
        }

        if (!thumbnailUrl) {
          return {
            ...item,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              thumbnailUrl: null
            }
          }
        }

        // Check if thumbnailUrl is already a full URL
        if (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) {
          return {
            ...item,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              thumbnailUrl: thumbnailUrl
            }
          }
        }

        // If it's an S3 key, generate signed URL
        try {
          const signedUrl = await generateSignedUrl(thumbnailUrl, 7 * 24 * 60 * 60) // 7 days
          return {
            ...item,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              thumbnailUrl: signedUrl
            }
          }
        } catch (error) {
          console.error('Error generating signed URL for thumbnail:', error)
          return {
            ...item,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              thumbnailUrl: null
            }
          }
        }
      })
    )

    // Generate signed URL for payment proof if exists
    let paymentProofSignedUrl: string | null = null
    if (order.paymentProofUrl) {
      try {
        if (order.paymentProofUrl.startsWith('http://') || order.paymentProofUrl.startsWith('https://')) {
          paymentProofSignedUrl = order.paymentProofUrl
        } else {
          paymentProofSignedUrl = await generateSignedUrl(order.paymentProofUrl, 7 * 24 * 60 * 60) // 7 days
        }
      } catch (error) {
        console.error('Error generating signed URL for payment proof:', error)
      }
    }

    return NextResponse.json({
      order: {
        ...order,
        paymentProofUrl: paymentProofSignedUrl || order.paymentProofUrl,
        items: processedItems
      }
    })
  } catch (error: any) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    )
  }
}

