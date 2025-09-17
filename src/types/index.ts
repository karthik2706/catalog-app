export interface Product {
  id: string
  name: string
  sku: string
  description?: string
  price: number
  categoryId: string
  categoryRef?: {
    id: string
    name: string
    description?: string
  }
  categories?: {
    id: string
    category: {
      id: string
      name: string
      description?: string
      parentId?: string
    }
  }[]
  variations?: ProductVariation[]
  stockLevel: number
  minStock: number
  isActive: boolean
  
  // Media fields
  media?: MediaFile[]
  images?: MediaFile[]
  videos?: MediaFile[]
  thumbnailUrl?: string
  
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariation {
  id: string
  name: string
  value: string
  priceAdjustment?: number
}

export interface MediaFile {
  id: string
  url: string
  thumbnailUrl?: string
  key: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: Date
}

export interface InventoryHistory {
  id: string
  productId: string
  quantity: number
  type: InventoryType
  reason?: string
  userId?: string
  createdAt: Date
  product?: Product
  user?: User
}

export interface User {
  id: string
  email: string
  name?: string
  role: Role
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  address?: string
  countryId?: string
  currencyId?: string
  isActive: boolean
  plan: string
  createdAt: Date
  updatedAt: Date
  country?: {
    id: string
    name: string
    code: string
  }
  currency?: {
    id: string
    name: string
    code: string
    symbol: string
  }
  _count?: {
    users: number
    products: number
  }
}

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER'
}

export enum InventoryType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
  TRANSFER = 'TRANSFER'
}

export interface CreateProductRequest {
  name: string
  sku: string
  description?: string
  price: number
  categoryId: string
  categoryIds?: string[] // For multiple categories
  variations?: ProductVariation[]
  stockLevel?: number
  minStock?: number
  images?: MediaFile[]
  videos?: MediaFile[]
  thumbnailUrl?: string
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  isActive?: boolean
}

export interface InventoryUpdateRequest {
  productId: string
  quantity: number
  type: InventoryType
  reason?: string
}

export interface ProductFilters {
  search?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  lowStock?: boolean
  sortBy?: 'name' | 'price' | 'stockLevel' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}