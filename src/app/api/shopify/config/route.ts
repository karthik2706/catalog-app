import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { rejectGuestTokens } from '@/lib/guest-auth-guard'
import { ShopifyClient } from '@/lib/shopify'

// Local helper function to extract user from JWT token

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
          clientId: decoded.clientId || null
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

// GET /api/shopify/config - Get Shopify configuration
export async function GET(request: NextRequest) {
  try {
    const guestRejection = rejectGuestTokens(request)
    if (guestRejection) {
      return guestRejection
    }

    const user = getUserFromRequest(request)
    
    if (!user || !user.clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const integration = await prisma.shopifyIntegration.findUnique({
      where: { clientId: user.clientId },
      select: {
        id: true,
        shopDomain: true,
        isActive: true,
        autoSync: true,
        syncInventory: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        lastSyncError: true,
        createdAt: true,
        updatedAt: true,
        // Don't return sensitive tokens
      }
    })

    return NextResponse.json({
      integration: integration || null
    })
  } catch (error) {
    console.error('Error fetching Shopify config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Shopify configuration' },
      { status: 500 }
    )
  }
}

// POST /api/shopify/config - Create or update Shopify configuration
export async function POST(request: NextRequest) {
  try {
    const guestRejection = rejectGuestTokens(request)
    if (guestRejection) {
      return guestRejection
    }

    const user = getUserFromRequest(request)
    
    if (!user || !user.clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Any authenticated user can configure Shopify integration for their own client
    // (Similar to how settings work - client-specific configuration)

    const body = await request.json()
    const { shopDomain, accessToken, autoSync, syncInventory, webhookSecret } = body

    if (!shopDomain || !accessToken) {
      return NextResponse.json(
        { error: 'Shop domain and access token are required' },
        { status: 400 }
      )
    }

    // Test the connection
    const shopifyClient = new ShopifyClient(shopDomain, accessToken)
    const connectionTest = await shopifyClient.testConnection()

    if (!connectionTest.success) {
      return NextResponse.json(
        { error: 'Failed to connect to Shopify. Please check your credentials.' },
        { status: 400 }
      )
    }

    // Create or update integration
    const integration = await prisma.shopifyIntegration.upsert({
      where: { clientId: user.clientId },
      update: {
        shopDomain,
        accessToken, // In production, encrypt this
        autoSync: autoSync !== undefined ? autoSync : true,
        syncInventory: syncInventory !== undefined ? syncInventory : true,
        webhookSecret: webhookSecret || null,
        isActive: true,
        lastSyncStatus: null,
        lastSyncError: null,
      },
      create: {
        clientId: user.clientId,
        shopDomain,
        accessToken, // In production, encrypt this
        autoSync: autoSync !== undefined ? autoSync : true,
        syncInventory: syncInventory !== undefined ? syncInventory : true,
        webhookSecret: webhookSecret || null,
        isActive: true,
      }
    })

    // Set up webhooks if syncInventory is enabled
    if (syncInventory) {
      try {
        await setupShopifyWebhooks(shopifyClient, user.clientId, webhookSecret)
      } catch (error) {
        console.error('Error setting up webhooks:', error)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        shopDomain: integration.shopDomain,
        isActive: integration.isActive,
        autoSync: integration.autoSync,
        syncInventory: integration.syncInventory,
        lastSyncAt: integration.lastSyncAt,
        lastSyncStatus: integration.lastSyncStatus,
      },
      shop: connectionTest.shop
    })
  } catch (error: any) {
    console.error('Error saving Shopify config:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save Shopify configuration' },
      { status: 500 }
    )
  }
}

// DELETE /api/shopify/config - Delete Shopify configuration
export async function DELETE(request: NextRequest) {
  try {
    const guestRejection = rejectGuestTokens(request)
    if (guestRejection) {
      return guestRejection
    }

    const user = getUserFromRequest(request)
    
    if (!user || !user.clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Any authenticated user can delete Shopify integration for their own client

    // Get integration to clean up webhooks
    const integration = await prisma.shopifyIntegration.findUnique({
      where: { clientId: user.clientId }
    })

    if (integration) {
      // Clean up webhooks
      try {
        const shopifyClient = new ShopifyClient(integration.shopDomain, integration.accessToken)
        const webhooks = await shopifyClient.listWebhooks()
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
        
        for (const webhook of webhooks) {
          if (webhook.address.startsWith(baseUrl)) {
            await shopifyClient.deleteWebhook(webhook.id)
          }
        }
      } catch (error) {
        console.error('Error cleaning up webhooks:', error)
        // Continue with deletion even if webhook cleanup fails
      }

      await prisma.shopifyIntegration.delete({
        where: { clientId: user.clientId }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Shopify config:', error)
    return NextResponse.json(
      { error: 'Failed to delete Shopify configuration' },
      { status: 500 }
    )
  }
}

/**
 * Set up Shopify webhooks for inventory sync
 */
async function setupShopifyWebhooks(
  shopifyClient: ShopifyClient,
  clientId: string,
  webhookSecret?: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
  const webhookBase = `${baseUrl}/api/shopify/webhooks`

  // List existing webhooks
  const existingWebhooks = await shopifyClient.listWebhooks()
  
  // Webhooks we need
  const requiredWebhooks = [
    { topic: 'orders/create', address: `${webhookBase}/orders/create` },
    { topic: 'orders/updated', address: `${webhookBase}/orders/updated` },
    { topic: 'orders/fulfilled', address: `${webhookBase}/orders/fulfilled` },
    { topic: 'orders/paid', address: `${webhookBase}/orders/paid` },
  ]

  // Delete old webhooks for this client
  for (const webhook of existingWebhooks) {
    if (webhook.address.includes(`/shopify/webhooks`) && webhook.address.includes(`clientId=${clientId}`)) {
      await shopifyClient.deleteWebhook(webhook.id)
    }
  }

  // Create new webhooks
  for (const { topic, address } of requiredWebhooks) {
    const webhookAddress = `${address}?clientId=${clientId}`
    try {
      await shopifyClient.createWebhook(topic, webhookAddress, 'json')
    } catch (error) {
      console.error(`Error creating webhook for ${topic}:`, error)
      // Continue with other webhooks
    }
  }
}

