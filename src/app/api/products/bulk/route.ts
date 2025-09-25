import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

function getUserFromRequest(request: NextRequest): { userId: string; role: string; clientId?: string } | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return {
        userId: decoded.userId,
        role: decoded.role,
        clientId: decoded.clientId || null
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

// POST /api/products/bulk - Bulk import products
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const clientId = user.clientId
    
    // For SUPER_ADMIN, clientId can be null (they can access all clients)
    // For other roles, clientId is required
    if (!clientId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('JSON parsing error:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const { products, overwrite = false } = body

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Products array is required' },
        { status: 400 }
      )
    }

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products to import' },
        { status: 400 }
      )
    }

    // Clean the products data to remove any potential circular references
    const cleanProducts = products.map((product: any) => {
      // Create a clean copy with only the expected fields
      return {
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: product.price,
        category: product.category,
        subcategory: product.subcategory,
        stockLevel: product.stockLevel,
        minStock: product.minStock,
        isActive: product.isActive,
        variations: product.variations
      }
    })

    // Validate required fields
    for (let i = 0; i < cleanProducts.length; i++) {
      const product = cleanProducts[i]
      if (!product.name || !product.sku) {
        return NextResponse.json(
          { error: `Product ${i + 1}: Name and SKU are required` },
          { status: 400 }
        )
      }
    }

    // Check for duplicate SKUs within the import batch
    const skus = cleanProducts.map(p => p.sku)
    const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index)
    if (duplicateSkus.length > 0) {
      return NextResponse.json(
        { error: `Duplicate SKUs found in import: ${duplicateSkus.join(', ')}` },
        { status: 400 }
      )
    }

    // Check for existing SKUs in database
    const existingProducts = await prisma.product.findMany({
      where: {
        clientId,
        sku: {
          in: skus
        }
      },
      select: { sku: true }
    })

    if (existingProducts.length > 0 && !overwrite) {
      const existingSkus = existingProducts.map(p => p.sku)
      return NextResponse.json(
        { 
          error: 'Duplicate SKUs found',
          duplicateSKUs: existingSkus,
          requiresOverwrite: true
        },
        { status: 409 }
      )
    }

    // Process categories and subcategories - find or create them
    const categoryMap = new Map<string, string>()
    const subcategoryMap = new Map<string, string>()
    const allCategories = new Set<string>()
    const allSubcategories = new Set<{name: string, parent: string}>()
    
    // Collect all categories and subcategories from products
    cleanProducts.forEach(product => {
      if (product.category) {
        allCategories.add(product.category)
        if (product.subcategory) {
          allSubcategories.add({
            name: product.subcategory,
            parent: product.category
          })
        }
      }
    })

    // Helper function to find category by case-insensitive name
    const findCategoryByName = async (name: string, parentId?: string) => {
      const categories = await prisma.category.findMany({
        where: {
          clientId,
          parentId: parentId || null,
          name: {
            mode: 'insensitive',
            equals: name
          }
        }
      })
      return categories[0] // Return first match
    }

    // Find existing categories (case-insensitive)
    const existingCategories = await prisma.category.findMany({
      where: {
        clientId,
        parentId: null, // Only top-level categories
        name: {
          mode: 'insensitive',
          in: Array.from(allCategories)
        }
      }
    })

    // Map existing categories (case-insensitive)
    for (const category of existingCategories) {
      // Find the original case from the import data
      const originalName = Array.from(allCategories).find(
        name => name.toLowerCase() === category.name.toLowerCase()
      )
      if (originalName) {
        categoryMap.set(originalName, category.id)
      }
    }

    // Create missing categories
    const missingCategories = Array.from(allCategories).filter(
      name => !Array.from(categoryMap.keys()).some(
        existing => existing.toLowerCase() === name.toLowerCase()
      )
    )

    for (const categoryName of missingCategories) {
      const category = await prisma.category.create({
        data: {
          name: categoryName,
          clientId,
          isActive: true,
          parentId: null
        }
      })
      categoryMap.set(categoryName, category.id)
    }

    // Process subcategories
    for (const subcat of allSubcategories) {
      const parentCategoryId = categoryMap.get(subcat.parent)
      if (!parentCategoryId) continue

      // Check if subcategory already exists (case-insensitive)
      const existingSubcategory = await findCategoryByName(subcat.name, parentCategoryId)
      
      if (existingSubcategory) {
        // Use existing subcategory
        subcategoryMap.set(`${subcat.parent}|${subcat.name}`, existingSubcategory.id)
      } else {
        // Create new subcategory
        const subcategory = await prisma.category.create({
          data: {
            name: subcat.name,
            clientId,
            isActive: true,
            parentId: parentCategoryId
          }
        })
        subcategoryMap.set(`${subcat.parent}|${subcat.name}`, subcategory.id)
      }
    }

    // Create or update products
    const processedProducts = []
    
    for (const productData of cleanProducts) {
      // Determine which category to use (subcategory if available, otherwise main category)
      let categoryId: string
      let categoryName: string
      
      if (productData.subcategory) {
        const subcategoryKey = `${productData.category}|${productData.subcategory}`
        categoryId = subcategoryMap.get(subcategoryKey)
        categoryName = productData.subcategory
      } else {
        categoryId = categoryMap.get(productData.category)
        categoryName = productData.category
      }
      
      if (!categoryId) {
        return NextResponse.json(
          { error: `Category not found: ${productData.category}${productData.subcategory ? ` > ${productData.subcategory}` : ''}` },
          { status: 400 }
        )
      }

      const productDataToSave = {
        name: productData.name,
        sku: productData.sku,
        description: productData.description || '',
        price: Number(productData.price),
        category: categoryName, // Use the actual category name (subcategory if available)
        stockLevel: Number(productData.stockLevel) || 0,
        minStock: Number(productData.minStock) || 0,
        isActive: productData.isActive !== undefined ? productData.isActive : true,
        clientId,
        variations: productData.variations || [],
      }

      let product

      if (overwrite) {
        // Check if product exists and update or create
        const existingProduct = await prisma.product.findFirst({
          where: {
            clientId,
            sku: productData.sku
          }
        })

        if (existingProduct) {
          // Update existing product
          // First, delete existing category relationships
          await prisma.productCategory.deleteMany({
            where: { productId: existingProduct.id }
          })

          // Update the product
          product = await prisma.product.update({
            where: { id: existingProduct.id },
            data: productDataToSave,
            include: {
              categories: {
                include: {
                  category: true
                }
              }
            }
          })

          // Create new category relationship
          await prisma.productCategory.create({
            data: {
              productId: product.id,
              categoryId: categoryId
            }
          })
        } else {
          // Create new product
          product = await prisma.product.create({
            data: {
              ...productDataToSave,
              categories: {
                create: {
                  categoryId: categoryId
                }
              }
            },
            include: {
              categories: {
                include: {
                  category: true
                }
              }
            }
          })
        }
      } else {
        // Create new product only
        product = await prisma.product.create({
          data: {
            ...productDataToSave,
            categories: {
              create: {
                categoryId: categoryId
              }
            }
          },
          include: {
            categories: {
              include: {
                category: true
              }
            }
          }
        })
      }

      processedProducts.push(product)
    }

    return NextResponse.json({
      message: `Successfully imported ${processedProducts.length} products`,
      products: processedProducts
    }, { status: 201 })

  } catch (error) {
    console.error('Error importing products:', error)
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/bulk - Bulk delete products
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin or higher permissions
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin or higher role required to delete products.' },
        { status: 403 }
      )
    }

    const clientId = user.clientId
    
    // For SUPER_ADMIN, clientId can be null (they can access all clients)
    // For other roles, clientId is required
    if (!clientId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error('JSON parsing error:', error)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const { productIds } = body

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      )
    }

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'No products to delete' },
        { status: 400 }
      )
    }

    if (productIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 products can be deleted at once' },
        { status: 400 }
      )
    }

    // Verify all products exist and belong to the client (if not SUPER_ADMIN)
    const whereClause: any = {
      id: {
        in: productIds
      }
    }
    
    // For non-SUPER_ADMIN users, filter by clientId
    if (user.role !== 'SUPER_ADMIN' && clientId) {
      whereClause.clientId = clientId
    }
    
    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        sku: true,
        name: true,
        clientId: true
      }
    })

    if (products.length !== productIds.length) {
      const errorMessage = user.role === 'SUPER_ADMIN' 
        ? 'Some products not found' 
        : 'Some products not found or don\'t belong to your organization'
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    }

    // Permanently delete products and related data
    const deletedProducts = await prisma.$transaction(async (tx) => {
      // First, delete related data
      await tx.media.deleteMany({
        where: {
          productId: {
            in: productIds
          }
        }
      })

      await tx.inventoryHistory.deleteMany({
        where: {
          productId: {
            in: productIds
          }
        }
      })

      await tx.productCategory.deleteMany({
        where: {
          productId: {
            in: productIds
          }
        }
      })

      // Then delete the products themselves
      const deleteWhereClause: any = {
        id: {
          in: productIds
        }
      }
      
      // For non-SUPER_ADMIN users, filter by clientId
      if (user.role !== 'SUPER_ADMIN' && clientId) {
        deleteWhereClause.clientId = clientId
      }
      
      const result = await tx.product.deleteMany({
        where: deleteWhereClause
      })

      return result
    })

    return NextResponse.json({
      message: `Successfully deleted ${deletedProducts.count} products`,
      deletedCount: deletedProducts.count,
      deletedProducts: products.map(p => ({ id: p.id, sku: p.sku, name: p.name }))
    })

  } catch (error) {
    console.error('Error deleting products:', error)
    return NextResponse.json(
      { error: 'Failed to delete products' },
      { status: 500 }
    )
  }
}
