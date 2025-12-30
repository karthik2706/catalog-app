export interface CartItem {
  id: string
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  thumbnailUrl?: string
  imageUrl?: string
}

export interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

