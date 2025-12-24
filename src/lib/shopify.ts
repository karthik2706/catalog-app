/**
 * Shopify API Client Library
 * Handles all interactions with Shopify Admin API
 */

interface ShopifyProduct {
  id: number
  title: string
  body_html?: string
  vendor?: string
  product_type?: string
  handle?: string
  status?: 'active' | 'archived' | 'draft'
  variants: ShopifyVariant[]
  images: ShopifyImage[]
  created_at?: string
  updated_at?: string
}

interface ShopifyVariant {
  id: number
  product_id: number
  title: string
  price: string
  sku?: string
  inventory_quantity?: number
  inventory_management?: string
  inventory_policy?: 'deny' | 'continue'
  compare_at_price?: string
  barcode?: string
  weight?: number
  weight_unit?: string
  requires_shipping?: boolean
  taxable?: boolean
  created_at?: string
  updated_at?: string
}

interface ShopifyImage {
  id: number
  product_id: number
  position: number
  src: string
  width: number
  height: number
  alt?: string
  created_at?: string
  updated_at?: string
}

interface ShopifyInventoryLevel {
  inventory_item_id: number
  location_id: number
  available: number
  updated_at?: string
}

interface ShopifyOrder {
  id: number
  order_number: number
  email?: string
  financial_status?: string
  fulfillment_status?: string
  line_items: ShopifyLineItem[]
  created_at: string
  updated_at: string
}

interface ShopifyLineItem {
  id: number
  variant_id: number
  product_id: number
  sku?: string
  title: string
  quantity: number
  price: string
  fulfillment_status?: string
}

interface ShopifyWebhook {
  id: number
  address: string
  topic: string
  format: 'json' | 'xml'
  created_at?: string
  updated_at?: string
}

interface ShopifyCollection {
  id: number
  title: string
  handle?: string
  body_html?: string
  sort_order?: 'alpha' | 'best-selling' | 'created' | 'created-desc' | 'manual' | 'price-asc' | 'price-desc'
  template_suffix?: string
  published_at?: string
  updated_at?: string
  published_scope?: 'web' | 'global'
}

export class ShopifyClient {
  private shopDomain: string
  private accessToken: string
  private baseUrl: string

  constructor(shopDomain: string, accessToken: string) {
    // Remove https:// if present and ensure .myshopify.com
    this.shopDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!this.shopDomain.includes('.myshopify.com')) {
      this.shopDomain = `${this.shopDomain}.myshopify.com`
    }
    this.accessToken = accessToken
    this.baseUrl = `https://${this.shopDomain}/admin/api/2024-01`
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    queryParams?: Record<string, string | number>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    const headers: HeadersInit = {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url.toString(), options)

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `Shopify API error: ${response.status} ${response.statusText}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.errors?.base?.[0] || errorJson.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data as T
  }

  /**
   * Test connection to Shopify
   */
  async testConnection(): Promise<{ success: boolean; shop?: any }> {
    try {
      const shop = await this.request<any>('GET', '/shop.json')
      return { success: true, shop: shop.shop }
    } catch (error) {
      return { 
        success: false, 
        shop: undefined 
      }
    }
  }

  /**
   * Create or update a product in Shopify
   */
  async createOrUpdateProduct(productData: {
    title: string
    body_html?: string
    vendor?: string
    product_type?: string
    variants: Array<{
      price: string
      sku?: string
      inventory_quantity?: number
      inventory_management?: string
      inventory_policy?: 'deny' | 'continue'
      compare_at_price?: string
    }>
    images?: Array<{
      src: string
      alt?: string
    }>
  }): Promise<ShopifyProduct> {
    const response = await this.request<{ product: ShopifyProduct }>(
      'POST',
      '/products.json',
      { product: productData }
    )
    return response.product
  }

  /**
   * Update an existing product in Shopify
   */
  async updateProduct(
    shopifyProductId: number,
    productData: Partial<ShopifyProduct>
  ): Promise<ShopifyProduct> {
    const response = await this.request<{ product: ShopifyProduct }>(
      'PUT',
      `/products/${shopifyProductId}.json`,
      { product: productData }
    )
    return response.product
  }

  /**
   * Get a product by Shopify ID
   */
  async getProduct(shopifyProductId: number): Promise<ShopifyProduct> {
    const response = await this.request<{ product: ShopifyProduct }>(
      'GET',
      `/products/${shopifyProductId}.json`
    )
    return response.product
  }

  /**
   * Search for a product by SKU
   */
  async findProductBySku(sku: string): Promise<ShopifyProduct | null> {
    try {
      const response = await this.request<{ products: ShopifyProduct[] }>(
        'GET',
        '/products.json',
        undefined,
        { sku }
      )
      return response.products?.[0] || null
    } catch (error) {
      return null
    }
  }

  /**
   * Update inventory level for a variant
   */
  async updateInventoryLevel(
    inventoryItemId: number,
    locationId: number,
    quantity: number
  ): Promise<ShopifyInventoryLevel> {
    const response = await this.request<{ inventory_level: ShopifyInventoryLevel }>(
      'POST',
      '/inventory_levels/set.json',
      {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: quantity
      }
    )
    return response.inventory_level
  }

  /**
   * Get inventory levels for a variant
   */
  async getInventoryLevels(inventoryItemId: number): Promise<ShopifyInventoryLevel[]> {
    const response = await this.request<{ inventory_levels: ShopifyInventoryLevel[] }>(
      'GET',
      '/inventory_levels.json',
      undefined,
      { inventory_item_ids: inventoryItemId }
    )
    return response.inventory_levels || []
  }

  /**
   * Get all locations (needed for inventory updates)
   */
  async getLocations(): Promise<Array<{ id: number; name: string; active: boolean }>> {
    const response = await this.request<{ locations: Array<{ id: number; name: string; active: boolean }> }>(
      'GET',
      '/locations.json'
    )
    return response.locations || []
  }

  /**
   * Get orders (for inventory sync from Shopify)
   */
  async getOrders(
    limit: number = 50,
    status: 'open' | 'closed' | 'cancelled' | 'any' = 'any',
    created_at_min?: string
  ): Promise<ShopifyOrder[]> {
    const params: Record<string, string | number> = { limit, status }
    if (created_at_min) {
      params.created_at_min = created_at_min
    }

    const response = await this.request<{ orders: ShopifyOrder[] }>(
      'GET',
      '/orders.json',
      undefined,
      params
    )
    return response.orders || []
  }

  /**
   * Create a webhook
   */
  async createWebhook(
    topic: string,
    address: string,
    format: 'json' | 'xml' = 'json'
  ): Promise<ShopifyWebhook> {
    const response = await this.request<{ webhook: ShopifyWebhook }>(
      'POST',
      '/webhooks.json',
      {
        webhook: {
          topic,
          address,
          format
        }
      }
    )
    return response.webhook
  }

  /**
   * List existing webhooks
   */
  async listWebhooks(): Promise<ShopifyWebhook[]> {
    const response = await this.request<{ webhooks: ShopifyWebhook[] }>(
      'GET',
      '/webhooks.json'
    )
    return response.webhooks || []
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: number): Promise<void> {
    await this.request('DELETE', `/webhooks/${webhookId}.json`)
  }

  /**
   * Create or find a collection (custom collection) by title
   * Returns the collection ID
   */
  async createOrFindCollection(title: string): Promise<number> {
    try {
      // First, try to find existing collection by title
      const collections = await this.listCollections()
      const existing = collections.find(c => c.title.toLowerCase() === title.toLowerCase())
      
      if (existing) {
        return existing.id
      }

      // Create new collection if not found
      const handle = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      const response = await this.request<{ custom_collection: ShopifyCollection }>(
        'POST',
        '/custom_collections.json',
        {
          custom_collection: {
            title,
            handle,
            published: true,
            published_scope: 'web'
          }
        }
      )
      
      return response.custom_collection.id
    } catch (error: any) {
      console.error(`Error creating/finding collection "${title}":`, error)
      throw error
    }
  }

  /**
   * List all custom collections
   */
  async listCollections(): Promise<ShopifyCollection[]> {
    try {
      const response = await this.request<{ custom_collections: ShopifyCollection[] }>(
        'GET',
        '/custom_collections.json',
        undefined,
        { limit: 250 }
      )
      return response.custom_collections || []
    } catch (error) {
      console.error('Error listing collections:', error)
      return []
    }
  }

  /**
   * Add a product to a collection
   */
  async addProductToCollection(productId: number, collectionId: number): Promise<void> {
    try {
      await this.request(
        'POST',
        '/collects.json',
        {
          collect: {
            product_id: productId,
            collection_id: collectionId
          }
        }
      )
    } catch (error: any) {
      // If product is already in collection, that's okay
      if (!error.message?.includes('already exists') && !error.message?.includes('422')) {
        console.error(`Error adding product ${productId} to collection ${collectionId}:`, error)
        throw error
      }
    }
  }

  /**
   * Remove a product from a collection
   */
  async removeProductFromCollection(productId: number, collectionId: number): Promise<void> {
    try {
      // First, find the collect (relationship) ID
      const collects = await this.request<{ collects: Array<{ id: number; product_id: number; collection_id: number }> }>(
        'GET',
        '/collects.json',
        undefined,
        { product_id: productId, collection_id: collectionId }
      )
      
      if (collects.collects && collects.collects.length > 0) {
        await this.request('DELETE', `/collects/${collects.collects[0].id}.json`)
      }
    } catch (error) {
      console.error(`Error removing product ${productId} from collection ${collectionId}:`, error)
      // Don't throw - this is not critical
    }
  }

  /**
   * Get all collections a product belongs to
   */
  async getProductCollections(productId: number): Promise<number[]> {
    try {
      const collects = await this.request<{ collects: Array<{ collection_id: number }> }>(
        'GET',
        '/collects.json',
        undefined,
        { product_id: productId }
      )
      return collects.collects?.map(c => c.collection_id) || []
    } catch (error) {
      console.error(`Error getting collections for product ${productId}:`, error)
      return []
    }
  }
}

/**
 * Helper function to create Shopify product data from Stock Mind product
 */
export function createShopifyProductData(
  product: {
    name: string
    sku: string
    description?: string | null
    price: number
    stockLevel: number
    category?: string | null
    thumbnailUrl?: string | null
    images?: Array<{ url: string; altText?: string | null }>
  }
): {
  title: string
  body_html?: string
  vendor?: string
  product_type?: string
  variants: Array<{
    price: string
    sku: string
    inventory_quantity: number
    inventory_management: string
    inventory_policy: 'deny' | 'continue'
  }>
  images?: Array<{
    src: string
    alt?: string
  }>
} {
  const images = product.images || []
  if (product.thumbnailUrl && !images.find(img => img.url === product.thumbnailUrl)) {
    images.unshift({ url: product.thumbnailUrl })
  }

  return {
    title: product.name,
    body_html: product.description || undefined,
    product_type: product.category || undefined,
    variants: [
      {
        price: product.price.toFixed(2),
        sku: product.sku,
        inventory_quantity: product.stockLevel,
        inventory_management: 'shopify',
        inventory_policy: 'deny', // Don't allow overselling
      }
    ],
    images: images.length > 0 ? images.map(img => ({
      src: img.url,
      alt: img.altText || product.name
    })) : undefined
  }
}

/**
 * Verify Shopify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  const hash = hmac.update(body, 'utf8').digest('base64')
  return hash === signature
}

