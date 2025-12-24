/**
 * Shopify Sync Helper
 * Handles automatic syncing of products to Shopify
 */

import { prisma } from './prisma'
import { ShopifyClient, createShopifyProductData } from './shopify'
import { generateSignedUrl } from './aws'

/**
 * Sync a product to Shopify if auto-sync is enabled
 * This is called after product create/update
 */
export async function syncProductToShopifyIfEnabled(
  productId: string,
  clientId: string
): Promise<void> {
  try {
    // Check if Shopify integration is active and auto-sync is enabled
    const integration = await prisma.shopifyIntegration.findUnique({
      where: {
        clientId,
        isActive: true,
        autoSync: true,
      }
    })

    if (!integration) {
      return // No sync needed
    }

    // Get product with all necessary data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        productMedia: {
          include: {
            media: true
          },
          where: {
            media: {
              kind: 'image'
            }
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

    if (!product || !product.isActive) {
      return
    }

    const shopifyClient = new ShopifyClient(integration.shopDomain, integration.accessToken)

    // Get product images with signed URLs
    const images = await Promise.all(
      product.productMedia.map(async (pm) => {
        try {
          const url = await generateSignedUrl(pm.media.s3Key, 7 * 24 * 60 * 60)
          return {
            url,
            altText: pm.media.altText || product.name
          }
        } catch (error) {
          console.error('Error generating signed URL for Shopify sync:', error)
          return null
        }
      })
    )

    const validImages = images.filter(img => img !== null) as Array<{ url: string; altText: string }>

    // Get all categories for this product
    const productCategories = product.categories?.map(pc => pc.category?.name).filter(Boolean) || []
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
        console.error('Error updating inventory level in Shopify sync:', error)
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
          .filter(c => productCategories.some(cat => cat && c.title.toLowerCase() === cat.toLowerCase()))
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
  } catch (error) {
    console.error('Error syncing product to Shopify:', error)
    // Don't throw - we don't want to fail product creation/update if sync fails
  }
}

