import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockStore } from '@/lib/mockStore'
import { CreateProductRequest, ProductFilters } from '@/types'

// GET /api/products - Get all products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
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

      // Build where clause
      const where: any = {
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
        where.category = filters.category
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
    const body: CreateProductRequest = await request.json()
    
    // Validate required fields
    if (!body.name || !body.sku || !body.price || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku, price, category' },
        { status: 400 }
      )
    }

    try {
      // Try to create in database first
      // Check if SKU already exists
      const existingProduct = await prisma.product.findUnique({
        where: { sku: body.sku }
      })

      if (existingProduct) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 409 }
        )
      }

      const product = await prisma.product.create({
        data: {
          name: body.name,
          sku: body.sku,
          description: body.description,
          price: body.price,
          category: body.category,
          variations: body.variations || [],
          stockLevel: body.stockLevel || 0,
          minStock: body.minStock || 0,
        },
        include: {
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