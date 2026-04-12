/** Partial WooCommerce REST product / variation shape */
export interface WooProduct {
  id: number
  name: string
  type: string
  sku: string
  status: string
  description?: string
  short_description?: string
  regular_price?: string
  sale_price?: string
  on_sale?: boolean
  manage_stock?: boolean
  stock_quantity?: number | string | null
  stock_status?: string
  date_modified_gmt?: string
  images?: { id?: number; src?: string; alt?: string; name?: string }[]
  categories?: { id: number; name: string; slug: string; parent?: number }[]
  parent_id?: number
}

export interface WooCredentials {
  siteUrl: string
  consumerKey: string
  consumerSecret: string
}
