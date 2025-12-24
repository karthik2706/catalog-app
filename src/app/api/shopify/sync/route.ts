import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { rejectGuestTokens } from '@/lib/guest-auth-guard'
import { ShopifyClient, createShopifyProductData } from '@/lib/shopify'
import { generateSignedUrl } from '@/lib/aws'

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

// POST /api/shopify/sync - Manual sync trigger
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

    const body = await request.json()
    const { productIds, syncAll = false } = body

    // Get Shopify integration
    const integration = await prisma.shopifyIntegration.findUnique({
      where: { 
        clientId: user.clientId,
        isActive: true
      }
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Shopify integration not configured or inactive' },
        { status: 400 }
      )
    }

    const shopifyClient = new ShopifyClient(integration.shopDomain, integration.accessToken)

    // Update sync status
    await prisma.shopifyIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncStatus: 'pending',
        lastSyncError: null,
      }
    })

    let syncedProducts = []
    let errors = []

    try {
      if (syncAll) {
        // Sync all active products
        const products = await prisma.product.findMany({
          where: {
            clientId: user.clientId,
            isActive: true,
          },
          include: {
            productMedia: {
              include: {
                media: true
              },
              orderBy: {
                sortOrder: 'asc'
              },
              take: 10 // Limit to first 10 images
            },
            categories: {
              include: {
                category: true
              }
            }
          }
        })

        for (const product of products) {
          try {
            const result = await syncProductToShopify(product, shopifyClient, integration.id)
            syncedProducts.push(result)
          } catch (error: any) {
            errors.push({
              productId: product.id,
              sku: product.sku,
              error: error.message
            })
          }
        }
      } else if (productIds && Array.isArray(productIds)) {
        // Sync specific products
        for (const productId of productIds) {
          try {
            const product = await prisma.product.findFirst({
              where: {
                id: productId,
                clientId: user.clientId,
              },
              include: {
                productMedia: {
                  include: {
                    media: true
                  },
                  orderBy: {
                    sortOrder: 'asc'
                  },
                  take: 10
                },
                categories: {
                  include: {
                    category: true
                  }
                }
              }
            })

            if (!product) {
              errors.push({
                productId,
                error: 'Product not found'
              })
              continue
            }

            const result = await syncProductToShopify(product, shopifyClient, integration.id)
            syncedProducts.push(result)
          } catch (error: any) {
            errors.push({
              productId,
              error: error.message
            })
          }
        }
      } else {
        return NextResponse.json(
          { error: 'Either productIds array or syncAll=true is required' },
          { status: 400 }
        )
      }

      // Update sync status
      await prisma.shopifyIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: errors.length === 0 ? 'success' : 'error',
          lastSyncError: errors.length > 0 ? JSON.stringify(errors) : null,
        }
      })

      return NextResponse.json({
        success: true,
        synced: syncedProducts.length,
        errors: errors.length,
        results: {
          synced: syncedProducts,
          errors: errors
        }
      })
    } catch (error: any) {
      await prisma.shopifyIntegration.update({
        where: { id: integration.id },
        data: {
          lastSyncStatus: 'error',
          lastSyncError: error.message,
        }
      })

      throw error
    }
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync products' },
      { status: 500 }
    )
  }
}

/**
 * Sync a single product to Shopify
 */
async function syncProductToShopify(
  product: any,
  shopifyClient: ShopifyClient,
  integrationId: string
): Promise<{ productId: string; shopifyProductId: number; shopifyVariantId: number }> {
  // Get product images with signed URLs
  const images = await Promise.all(
    product.productMedia
      .filter((pm: any) => pm.media.kind === 'image')
      .map(async (pm: any) => {
        try {
          const url = await generateSignedUrl(pm.media.s3Key, 7 * 24 * 60 * 60)
          return {
            url,
            altText: pm.media.altText || product.name
          }
        } catch (error) {
          console.error('Error generating signed URL:', error)
          return null
        }
      })
  )

  const validImages = images.filter(img => img !== null) as Array<{ url: string; altText: string }>

  // Get all categories for this product
  const productCategories = product.categories?.map((pc: any) => pc.category?.name).filter(Boolean) || []
  const primaryCategory = productCategories[0] || product.category

  // Prepare product data
  const shopifyProductData = createShopifyProductData({
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: Number(product.price),
    stockLevel: product.stockLevel,
    category: primaryCategory,
    thumbnailUrl: product.thumbnailUrl,
    images: validImages
  })

  let shopifyProduct
  let shopifyVariantId: number

  if (product.shopifyProductId) {
    // Update existing product
    shopifyProduct = await shopifyClient.updateProduct(
      Number(product.shopifyProductId),
      shopifyProductData
    )
    shopifyVariantId = shopifyProduct.variants[0]?.id || 0
  } else {
    // Create new product
    shopifyProduct = await shopifyClient.createOrUpdateProduct(shopifyProductData)
    shopifyVariantId = shopifyProduct.variants[0]?.id || 0
  }

  // Update product with Shopify IDs
  await prisma.product.update({
    where: { id: product.id },
    data: {
      shopifyProductId: String(shopifyProduct.id),
      shopifyVariantId: String(shopifyVariantId),
    }
  })

  // Update inventory level
  if (shopifyVariantId && product.stockLevel !== undefined) {
    try {
      const locations = await shopifyClient.getLocations()
      const primaryLocation = locations.find(loc => loc.active) || locations[0]
      
      if (primaryLocation) {
        const inventoryItemId = shopifyProduct.variants[0]?.id
        if (inventoryItemId) {
          await shopifyClient.updateInventoryLevel(
            inventoryItemId,
            primaryLocation.id,
            product.stockLevel
          )
        }
      }
    } catch (error) {
      console.error('Error updating inventory level:', error)
      // Don't fail the sync if inventory update fails
    }
  }

  // Sync categories to Shopify collections
  if (productCategories.length > 0) {
    try {
      // Get current collections for this product
      const currentCollectionIds = await shopifyClient.getProductCollections(shopifyProduct.id)
      
      // Create or find collections for each category
      const targetCollectionIds: number[] = []
      for (const categoryName of productCategories) {
        if (categoryName) {
          try {
            const collectionId = await shopifyClient.createOrFindCollection(categoryName)
            targetCollectionIds.push(collectionId)
          } catch (error) {
            console.error(`Error creating/finding collection for category "${categoryName}":`, error)
          }
        }
      }

      // Add product to target collections
      for (const collectionId of targetCollectionIds) {
        if (!currentCollectionIds.includes(collectionId)) {
          try {
            await shopifyClient.addProductToCollection(shopifyProduct.id, collectionId)
          } catch (error) {
            console.error(`Error adding product to collection ${collectionId}:`, error)
          }
        }
      }

      // Remove product from collections it's no longer in
      // (Only remove from collections that match our category names)
      const allCollections = await shopifyClient.listCollections()
      const categoryCollectionIds = allCollections
        .filter(c => productCategories.some((cat: string) => cat && c.title.toLowerCase() === cat.toLowerCase()))
        .map(c => c.id)

      for (const collectionId of currentCollectionIds) {
        if (!targetCollectionIds.includes(collectionId) && categoryCollectionIds.includes(collectionId)) {
          try {
            await shopifyClient.removeProductFromCollection(shopifyProduct.id, collectionId)
          } catch (error) {
            console.error(`Error removing product from collection ${collectionId}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Error syncing categories to Shopify collections:', error)
      // Don't fail the sync if collection update fails
    }
  }

  return {
    productId: product.id,
    shopifyProductId: shopifyProduct.id,
    shopifyVariantId: shopifyVariantId
  }
}

