export interface Product {
  id: string
  name: string
  sku: string
  description?: string
  price: number
  category: string
  variations?: ProductVariation[]
  stockLevel: number
  minStock: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariation {
  id: string
  name: string
  value: string
  priceAdjustment?: number
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
  category: string
  variations?: ProductVariation[]
  stockLevel?: number
  minStock?: number
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