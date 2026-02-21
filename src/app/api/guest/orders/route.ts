import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

interface GuestJWTPayload {
  type: string
  clientId: string
  clientSlug: string
  clientName: string
}

async function getGuestFromRequest(request: NextRequest): Promise<{ clientId: string } | null> {
  let token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    const cookieStore = await cookies()
    const slug = request.nextUrl.searchParams.get('slug')
    if (slug) {
      token = cookieStore.get(`guest_token_${slug}`)?.value || null
    }
  }
  
  if (token) {
    try {
      const secret = process.env.JWT_SECRET
      if (!secret) {
        throw new Error('JWT_SECRET not configured')
      }
      const decoded = jwt.verify(token, secret) as GuestJWTPayload
      if (decoded.type === 'guest') {
        return {
          clientId: decoded.clientId
        }
      }
    } catch (error) {
      console.error('Error decoding guest token:', error)
    }
  }
  return null
}

// Generate unique order number
function generateOrderNumber(clientId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

// POST /api/guest/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const guest = await getGuestFromRequest(request)
    
    if (!guest) {
      return NextResponse.json(
        { error: 'Guest authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      items,
      customer,
      shippingAddress,
      billingAddress,
      subtotal,
      tax,
      shipping,
      total,
      notes
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!customer || !customer.name || !customer.phone) {
      return NextResponse.json(
        { error: 'First name and mobile number are required' },
        { status: 400 }
      )
    }
    
    // Validate phone number format (optional validation)
    if (customer.phone && !/^[\d\s\-\+\(\)]+$/.test(customer.phone)) {
      return NextResponse.json(
        { error: 'Please enter a valid mobile number' },
        { status: 400 }
      )
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      )
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return NextResponse.json(
          { error: 'Each item must have productId, quantity, and price' },
          { status: 400 }
        )
      }
    }

    // Generate order number
    const orderNumber = generateOrderNumber(guest.clientId)

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Get product details for order items
      const productIds = items.map((item: any) => item.productId)
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          clientId: guest.clientId
        },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          stockLevel: true,
          allowPreorder: true
        }
      })

      const productMap = new Map(products.map(p => [p.id, p]))

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          clientId: guest.clientId,
          status: 'PENDING',
          customerName: customer.name,
          customerEmail: customer.email || '',
          customerPhone: customer.phone,
          shippingAddress: shippingAddress as any,
          billingAddress: (billingAddress || shippingAddress) as any,
          notes: notes || null,
          subtotal: subtotal,
          tax: tax || 0,
          shipping: shipping || 0,
          total: total,
          items: {
            create: items.map((item: any) => {
              const product = productMap.get(item.productId)
              if (!product) {
                throw new Error(`Product ${item.productId} not found`)
              }
              return {
                productId: item.productId,
                productName: product.name,
                productSku: product.sku,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity,
                isPreorder: product.allowPreorder === true,
                variations: Array.isArray(item.variations) ? item.variations : undefined,
              }
            })
          }
        },
        include: {
          items: true
        }
      })

      return newOrder
    })

    // TODO: Send notification to admin (implement separately)
    // This will be done after order API is created

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt
      }
    })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

