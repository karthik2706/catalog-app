import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface DataQualityIssue {
  id: string
  type: 'missing_field' | 'invalid_value' | 'inconsistent_data' | 'orphaned_record' | 'duplicate_data'
  severity: 'low' | 'medium' | 'high' | 'critical'
  entity: string
  entityId: string
  field: string
  description: string
  currentValue?: any
  expectedValue?: any
  suggestion?: string
}

export interface DataQualityReport {
  overallScore: number
  totalRecords: number
  totalIssues: number
  issuesByType: Record<string, number>
  issuesBySeverity: Record<string, number>
  issues: DataQualityIssue[]
  recommendations: string[]
}

export class DataQualityAnalyzer {
  private issues: DataQualityIssue[] = []

  private addIssue(issue: Omit<DataQualityIssue, 'id'>) {
    this.issues.push({
      id: `issue_${this.issues.length + 1}`,
      ...issue
    })
  }

  async analyzeProducts(): Promise<void> {
    console.log('Analyzing products data quality...')
    
    // Check for missing required fields
    const productsWithoutName = await prisma.product.findMany({
      where: { 
        name: { equals: '' }
      },
      select: { id: true, name: true, sku: true }
    })

    productsWithoutName.forEach(product => {
      this.addIssue({
        type: 'missing_field',
        severity: 'critical',
        entity: 'Product',
        entityId: product.id,
        field: 'name',
        description: 'Product name is missing or empty',
        currentValue: product.name,
        expectedValue: 'Non-empty string',
        suggestion: 'Add a descriptive product name'
      })
    })

    // Check for missing SKUs
    const productsWithoutSku = await prisma.product.findMany({
      where: { 
        sku: { equals: '' }
      },
      select: { id: true, name: true, sku: true }
    })

    productsWithoutSku.forEach(product => {
      this.addIssue({
        type: 'missing_field',
        severity: 'critical',
        entity: 'Product',
        entityId: product.id,
        field: 'sku',
        description: 'Product SKU is missing or empty',
        currentValue: product.sku,
        expectedValue: 'Unique SKU string',
        suggestion: 'Generate a unique SKU for this product'
      })
    })

    // Check for invalid prices
    const productsWithInvalidPrice = await prisma.product.findMany({
      where: { 
        price: { lt: 0 }
      },
      select: { id: true, name: true, sku: true, price: true }
    })

    productsWithInvalidPrice.forEach(product => {
      this.addIssue({
        type: 'invalid_value',
        severity: 'high',
        entity: 'Product',
        entityId: product.id,
        field: 'price',
        description: 'Product price is invalid (negative or null)',
        currentValue: product.price,
        expectedValue: 'Positive number',
        suggestion: 'Set a valid positive price'
      })
    })

    // Check for invalid stock levels
    const productsWithInvalidStock = await prisma.product.findMany({
      where: { 
        stockLevel: { lt: 0 }
      },
      select: { id: true, name: true, sku: true, stockLevel: true }
    })

    productsWithInvalidStock.forEach(product => {
      this.addIssue({
        type: 'invalid_value',
        severity: 'medium',
        entity: 'Product',
        entityId: product.id,
        field: 'stockLevel',
        description: 'Product stock level is negative',
        currentValue: product.stockLevel,
        expectedValue: 'Non-negative number',
        suggestion: 'Adjust stock level to zero or positive value'
      })
    })

    // Check for products without categories
    const productsWithoutCategory = await prisma.product.findMany({
      where: { 
        OR: [
          { categoryId: null },
          { categoryId: '' }
        ]
      },
      select: { id: true, name: true, sku: true, categoryId: true }
    })

    productsWithoutCategory.forEach(product => {
      this.addIssue({
        type: 'missing_field',
        severity: 'medium',
        entity: 'Product',
        entityId: product.id,
        field: 'categoryId',
        description: 'Product is not assigned to any category',
        currentValue: product.categoryId,
        expectedValue: 'Valid category ID',
        suggestion: 'Assign product to an appropriate category'
      })
    })
  }

  async analyzeCategories(): Promise<void> {
    console.log('Analyzing categories data quality...')
    
    // Check for missing category names
    const categoriesWithoutName = await prisma.category.findMany({
      where: { 
        name: { equals: '' }
      },
      select: { id: true, name: true, description: true }
    })

    categoriesWithoutName.forEach(category => {
      this.addIssue({
        type: 'missing_field',
        severity: 'critical',
        entity: 'Category',
        entityId: category.id,
        field: 'name',
        description: 'Category name is missing or empty',
        currentValue: category.name,
        expectedValue: 'Non-empty string',
        suggestion: 'Add a descriptive category name'
      })
    })

    // Check for orphaned categories (categories without products)
    const categoriesWithoutProducts = await prisma.category.findMany({
      where: {
        products: {
          none: {}
        }
      },
      select: { id: true, name: true }
    })

    categoriesWithoutProducts.forEach(category => {
      this.addIssue({
        type: 'orphaned_record',
        severity: 'low',
        entity: 'Category',
        entityId: category.id,
        field: 'products',
        description: 'Category has no associated products',
        currentValue: 0,
        expectedValue: 'At least one product',
        suggestion: 'Either add products to this category or consider removing it'
      })
    })
  }

  async analyzeUsers(): Promise<void> {
    console.log('Analyzing users data quality...')
    
    // Check for missing emails
    const usersWithoutEmail = await prisma.user.findMany({
      where: { 
        email: { equals: '' }
      },
      select: { id: true, email: true, name: true }
    })

    usersWithoutEmail.forEach(user => {
      this.addIssue({
        type: 'missing_field',
        severity: 'critical',
        entity: 'User',
        entityId: user.id,
        field: 'email',
        description: 'User email is missing or empty',
        currentValue: user.email,
        expectedValue: 'Valid email address',
        suggestion: 'Add a valid email address'
      })
    })

    // Check for invalid email formats
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    })

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    allUsers.forEach(user => {
      if (user.email && !emailRegex.test(user.email)) {
        this.addIssue({
          type: 'invalid_value',
          severity: 'high',
          entity: 'User',
          entityId: user.id,
          field: 'email',
          description: 'User email format is invalid',
          currentValue: user.email,
          expectedValue: 'Valid email format',
          suggestion: 'Correct the email format'
        })
      }
    })
  }

  async analyzeMedia(): Promise<void> {
    console.log('Analyzing media data quality...')
    
    // Check for missing original names
    const mediaWithoutOriginalName = await prisma.media.findMany({
      where: { 
        originalName: { equals: '' }
      },
      select: { id: true, originalName: true, kind: true, productId: true }
    })

    mediaWithoutOriginalName.forEach(media => {
      this.addIssue({
        type: 'missing_field',
        severity: 'medium',
        entity: 'Media',
        entityId: media.id,
        field: 'originalName',
        description: 'Media file original name is missing',
        currentValue: media.originalName,
        expectedValue: 'Original filename',
        suggestion: 'Add the original filename'
      })
    })

    // Check for missing MIME types
    const mediaWithoutMimeType = await prisma.media.findMany({
      where: { 
        mimeType: { equals: '' }
      },
      select: { id: true, mimeType: true, kind: true, productId: true }
    })

    mediaWithoutMimeType.forEach(media => {
      this.addIssue({
        type: 'missing_field',
        severity: 'medium',
        entity: 'Media',
        entityId: media.id,
        field: 'mimeType',
        description: 'Media MIME type is missing',
        currentValue: media.mimeType,
        expectedValue: 'Valid MIME type',
        suggestion: 'Add the correct MIME type'
      })
    })

    // Check for images without dimensions
    const imagesWithoutDimensions = await prisma.media.findMany({
      where: { 
        kind: 'image',
        OR: [
          { width: null },
          { height: null }
        ]
      },
      select: { id: true, width: true, height: true, originalName: true, productId: true }
    })

    imagesWithoutDimensions.forEach(media => {
      this.addIssue({
        type: 'missing_field',
        severity: 'low',
        entity: 'Media',
        entityId: media.id,
        field: 'dimensions',
        description: 'Image dimensions are missing',
        currentValue: `${media.width}x${media.height}`,
        expectedValue: 'Width and height values',
        suggestion: 'Extract and store image dimensions'
      })
    })

    // Check for orphaned media (media without products)
    const orphanedMedia = await prisma.media.findMany({
      where: {
        product: null
      },
      select: { id: true, originalName: true, kind: true, productId: true }
    })

    orphanedMedia.forEach(media => {
      this.addIssue({
        type: 'orphaned_record',
        severity: 'medium',
        entity: 'Media',
        entityId: media.id,
        field: 'productId',
        description: 'Media file is not associated with any product',
        currentValue: media.productId,
        expectedValue: 'Valid product ID',
        suggestion: 'Associate with a product or remove the media file'
      })
    })
  }

  async analyzeInventory(): Promise<void> {
    console.log('Analyzing inventory data quality...')
    
    // Note: type field is required in InventoryHistory model, so no need to check for null types

    // Check for inventory records with zero quantity
    const inventoryWithZeroQuantity = await prisma.inventoryHistory.findMany({
      where: { 
        quantity: 0
      },
      select: { id: true, type: true, quantity: true, productId: true }
    })

    inventoryWithZeroQuantity.forEach(inventory => {
      this.addIssue({
        type: 'invalid_value',
        severity: 'low',
        entity: 'InventoryHistory',
        entityId: inventory.id,
        field: 'quantity',
        description: 'Inventory record has zero quantity',
        currentValue: inventory.quantity,
        expectedValue: 'Non-zero quantity',
        suggestion: 'Verify if zero quantity is intentional'
      })
    })
  }

  async generateReport(): Promise<DataQualityReport> {
    console.log('Generating data quality report...')
    
    // Calculate statistics
    const totalRecords = await this.getTotalRecords()
    const issuesByType = this.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const issuesBySeverity = this.issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate overall score
    const criticalIssues = issuesBySeverity.critical || 0
    const highIssues = issuesBySeverity.high || 0
    const mediumIssues = issuesBySeverity.medium || 0
    const lowIssues = issuesBySeverity.low || 0

    const overallScore = Math.max(0, 100 - (criticalIssues * 20 + highIssues * 10 + mediumIssues * 5 + lowIssues * 2))

    // Generate recommendations
    const recommendations = this.generateRecommendations()

    return {
      overallScore: Math.round(overallScore),
      totalRecords,
      totalIssues: this.issues.length,
      issuesByType,
      issuesBySeverity,
      issues: this.issues,
      recommendations
    }
  }

  private async getTotalRecords(): Promise<number> {
    const [products, categories, users, media, inventory] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.user.count(),
      prisma.media.count(),
      prisma.inventoryHistory.count()
    ])

    return products + categories + users + media + inventory
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []

    const criticalIssues = this.issues.filter(issue => issue.severity === 'critical')
    const highIssues = this.issues.filter(issue => issue.severity === 'high')

    if (criticalIssues.length > 0) {
      recommendations.push('🚨 Address critical issues immediately - these affect core functionality')
    }

    if (highIssues.length > 0) {
      recommendations.push('⚠️ Fix high-priority issues to improve data integrity')
    }

    const missingFieldIssues = this.issues.filter(issue => issue.type === 'missing_field')
    if (missingFieldIssues.length > 0) {
      recommendations.push('📝 Implement data validation to prevent missing required fields')
    }

    const invalidValueIssues = this.issues.filter(issue => issue.type === 'invalid_value')
    if (invalidValueIssues.length > 0) {
      recommendations.push('✅ Add input validation and data type checking')
    }

    const orphanedIssues = this.issues.filter(issue => issue.type === 'orphaned_record')
    if (orphanedIssues.length > 0) {
      recommendations.push('🔗 Review and clean up orphaned records')
    }

    if (this.issues.length === 0) {
      recommendations.push('🎉 Excellent! Your data quality is perfect')
    }

    return recommendations
  }

  async runFullAnalysis(): Promise<DataQualityReport> {
    console.log('🔍 Starting comprehensive data quality analysis...')
    
    this.issues = [] // Reset issues array
    
    await Promise.all([
      this.analyzeProducts(),
      this.analyzeCategories(),
      this.analyzeUsers(),
      this.analyzeMedia(),
      this.analyzeInventory()
    ])

    return await this.generateReport()
  }
}

export async function runDataQualityCheck(): Promise<DataQualityReport> {
  const analyzer = new DataQualityAnalyzer()
  return await analyzer.runFullAnalysis()
}
