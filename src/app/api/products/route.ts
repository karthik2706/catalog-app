import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateProductRequest, ProductFilters } from '@/types'
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
        clientId: decoded.clientId
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

// GET /api/products - Get all products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For super admin, show all products; for regular users, show client-specific products
    const isSuperAdmin = user.role === 'SUPER_ADMIN'
    const whereClause = isSuperAdmin ? {} : { clientId: user.clientId }

    const { searchParams } = new URL(request.url)
    
    const filters: ProductFilters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      lowStock: searchParams.get('lowStock') === 'true' ? true : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    }

    try {
      // Try to fetch from database first
      const skip = ((filters.page || 1) - 1) * (filters.limit || 10)
      const take = filters.limit || 10

      // Build where clause with tenant isolation
      const where: any = {
        ...whereClause, // Use the appropriate where clause for super admin or client
        isActive: true,
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ]
      }

      if (filters.category) {
        where.categoryId = filters.category
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {}
        if (filters.minPrice !== undefined) {
          where.price.gte = filters.minPrice
        }
        if (filters.maxPrice !== undefined) {
          where.price.lte = filters.maxPrice
        }
      }

      if (filters.inStock) {
        where.stockLevel = { gt: 0 }
      }

      // Note: lowStock filtering will be done after fetching data
      // since Prisma doesn't easily support comparing two fields in the same table

      // Build orderBy clause
      const orderBy: any = {}
      orderBy[filters.sortBy || 'name'] = filters.sortOrder || 'asc'

      const [allProducts, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            categoryRef: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    parentId: true
                  }
                }
              }
            },
            inventoryHistory: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        }),
        prisma.product.count({ where })
      ])

      // Filter for low stock items if requested
      let products = allProducts
      let filteredTotal = total
      if (filters.lowStock) {
        products = allProducts.filter(product => 
          product.stockLevel !== null && 
          product.minStock !== null && 
          product.stockLevel <= product.minStock
        )
        filteredTotal = products.length
      }

      return NextResponse.json({
        products,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: filteredTotal,
          pages: Math.ceil(filteredTotal / (filters.limit || 10))
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: CreateProductRequest = await request.json()
    
    // Determine clientId based on user role
    let clientId: string
    if (user.role === 'SUPER_ADMIN') {
      // For super admin, require a clientId in the request body
      if (!body.clientId) {
        return NextResponse.json(
          { error: 'Client ID required for super admin' },
          { status: 400 }
        )
      }
      clientId = body.clientId
    } else if (!user.clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    } else {
      clientId = user.clientId
    }
    
    // Validate required fields
    if (!body.name || !body.sku || !body.price || !body.categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku, price, categoryId' },
        { status: 400 }
      )
    }

    try {
      // Try to create in database first
      // Check if SKU already exists within the client
      const existingProduct = await prisma.product.findFirst({
        where: { 
          sku: body.sku,
          clientId 
        }
      })

      if (existingProduct) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 409 }
        )
      }

      // Get category name for backward compatibility
      const category = await prisma.category.findFirst({
        where: { id: body.categoryId, clientId }
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        )
      }

      const product = await prisma.product.create({
        data: {
          name: body.name,
          sku: body.sku,
          description: body.description,
          price: body.price,
          category: category.name, // For backward compatibility
          categoryId: body.categoryId,
          variations: body.variations || [],
          stockLevel: body.stockLevel || 0,
          minStock: body.minStock || 0,
          clientId, // Ensure tenant isolation
          // Media fields
          images: body.images || [],
          videos: body.videos || [],
          thumbnailUrl: body.thumbnailUrl || null,
          categories: body.categoryIds ? {
            create: body.categoryIds.map((categoryId: string) => ({
              categoryId
            }))
          } : undefined
        },
        include: {
          categoryRef: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  parentId: true
                }
              }
            }
          },
          inventoryHistory: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        }
      })

      return NextResponse.json(product, { status: 201 })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}