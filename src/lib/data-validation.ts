import { z } from 'zod'

// Product validation schema
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Product name too long'),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU too long'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  stockLevel: z.number().int().min(0, 'Stock level cannot be negative'),
  minStock: z.number().int().min(0, 'Minimum stock cannot be negative'),
  isActive: z.boolean().default(true)
})

// Category validation schema
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255, 'Category name too long'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0)
})

// User validation schema
export const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']),
  clientId: z.string().optional(),
  isActive: z.boolean().default(true)
})

// Media validation schema
export const mediaSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  kind: z.enum(['image', 'video', 'audio', 'document']),
  originalName: z.string().min(1, 'Original name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  durationMs: z.number().int().positive().optional(),
  altText: z.string().optional(),
  caption: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending')
})

// Inventory history validation schema
export const inventoryHistorySchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  type: z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'TRANSFER']),
  quantity: z.number().int('Quantity must be an integer'),
  reason: z.string().optional(),
  notes: z.string().optional()
})

// Validation functions
export function validateProduct(data: any) {
  try {
    return { success: true, data: productSchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}

export function validateCategory(data: any) {
  try {
    return { success: true, data: categorySchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}

export function validateUser(data: any) {
  try {
    return { success: true, data: userSchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}

export function validateMedia(data: any) {
  try {
    return { success: true, data: mediaSchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}

export function validateInventoryHistory(data: any) {
  try {
    return { success: true, data: inventoryHistorySchema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}

// Data cleaning functions
export function cleanProductData(data: any) {
  return {
    name: data.name?.trim() || '',
    sku: data.sku?.trim().toUpperCase() || '',
    description: data.description?.trim() || null,
    price: parseFloat(data.price) || 0,
    categoryId: data.categoryId || null,
    stockLevel: parseInt(data.stockLevel) || 0,
    minStock: parseInt(data.minStock) || 0,
    isActive: Boolean(data.isActive)
  }
}

export function cleanCategoryData(data: any) {
  return {
    name: data.name?.trim() || '',
    description: data.description?.trim() || null,
    parentId: data.parentId || null,
    isActive: Boolean(data.isActive),
    sortOrder: parseInt(data.sortOrder) || 0
  }
}

export function cleanUserData(data: any) {
  return {
    email: data.email?.trim().toLowerCase() || '',
    name: data.name?.trim() || '',
    role: data.role || 'USER',
    clientId: data.clientId || null,
    isActive: Boolean(data.isActive)
  }
}

export function cleanMediaData(data: any) {
  return {
    productId: data.productId || '',
    kind: data.kind || 'image',
    originalName: data.originalName?.trim() || '',
    mimeType: data.mimeType || '',
    fileSize: parseInt(data.fileSize) || 0,
    width: data.width ? parseInt(data.width) : null,
    height: data.height ? parseInt(data.height) : null,
    durationMs: data.durationMs ? parseInt(data.durationMs) : null,
    altText: data.altText?.trim() || null,
    caption: data.caption?.trim() || null,
    sortOrder: parseInt(data.sortOrder) || 0,
    isPrimary: Boolean(data.isPrimary),
    status: data.status || 'pending'
  }
}

// Data quality checks
export function checkDataIntegrity(data: any, type: string) {
  const issues: string[] = []

  switch (type) {
    case 'product':
      if (!data.name || data.name.trim() === '') {
        issues.push('Product name is required')
      }
      if (!data.sku || data.sku.trim() === '') {
        issues.push('Product SKU is required')
      }
      if (data.price <= 0) {
        issues.push('Product price must be positive')
      }
      if (data.stockLevel < 0) {
        issues.push('Stock level cannot be negative')
      }
      break

    case 'category':
      if (!data.name || data.name.trim() === '') {
        issues.push('Category name is required')
      }
      break

    case 'user':
      if (!data.email || data.email.trim() === '') {
        issues.push('User email is required')
      }
      if (!data.name || data.name.trim() === '') {
        issues.push('User name is required')
      }
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (data.email && !emailRegex.test(data.email)) {
        issues.push('Invalid email format')
      }
      break

    case 'media':
      if (!data.originalName || data.originalName.trim() === '') {
        issues.push('Media original name is required')
      }
      if (!data.mimeType || data.mimeType.trim() === '') {
        issues.push('Media MIME type is required')
      }
      if (data.fileSize <= 0) {
        issues.push('File size must be positive')
      }
      break
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

// Duplicate detection
export async function checkForDuplicates(entity: string, field: string, value: any, excludeId?: string) {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  try {
    const whereClause: any = { [field]: value }
    if (excludeId) {
      whereClause.id = { not: excludeId }
    }

    const count = await prisma[entity as keyof typeof prisma].count({
      where: whereClause
    })

    return count > 0
  } catch (error) {
    console.error('Error checking for duplicates:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}
