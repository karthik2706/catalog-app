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

function getClientIdFromRequest(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return decoded.clientId || null
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    // Get categories from the categories table for this client with hierarchy
    // Only fetch parent categories (parentId is null), children will be fetched via relation
    const categories = await prisma.category.findMany({
      where: {
        clientId,
        isActive: true,
        parentId: null  // Only fetch parent categories
      },
      orderBy: [
        { parentId: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        sortOrder: true,
        createdAt: true,
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            parentId: true,
            sortOrder: true,
            createdAt: true
          },
          orderBy: [
            { sortOrder: 'asc' },
            { name: 'asc' }
          ]
        }
      }
    })
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { category, name, description, parentId, sortOrder } = body

    // Accept both 'category' and 'name' fields for backward compatibility
    const categoryName = (category || name)?.trim()

    if (!categoryName || typeof categoryName !== 'string') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // If parentId is provided, validate that the parent exists and belongs to the same client
    if (parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: parentId,
          clientId,
          isActive: true
        }
      })

      if (!parentCategory) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 })
      }
    }

    // Check if category already exists for this client and parent
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: categoryName,
        clientId,
        parentId: parentId || null
      }
    })

    if (existingCategory) {
      return NextResponse.json({ error: 'Category already exists at this level' }, { status: 400 })
    }

    // Create new category for this client
    const newCategory = await prisma.category.create({
      data: {
        name: categoryName,
        description: description || null,
        parentId: parentId || null,
        sortOrder: sortOrder || 0,
        clientId
      },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        sortOrder: true,
        createdAt: true
      }
    })

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Error adding category:', error)
    return NextResponse.json({ error: 'Failed to add category' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { category, name, description, parentId, sortOrder } = body

    // Accept both 'category' and 'name' fields for backward compatibility
    const categoryName = (category || name)?.trim()

    if (!categoryName || typeof categoryName !== 'string') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Get current category to check its current parent
    const currentCategory = await prisma.category.findFirst({
      where: { id: categoryId, clientId }
    })

    if (!currentCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // If parentId is provided, validate that the parent exists and belongs to the same client
    if (parentId) {
      const parentCategory = await prisma.category.findFirst({
        where: {
          id: parentId,
          clientId,
          isActive: true
        }
      })

      if (!parentCategory) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 })
      }

      // Prevent circular references
      if (parentId === categoryId) {
        return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 })
      }
    }

    // Check if category already exists for this client and parent (excluding current category)
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: categoryName,
        clientId,
        parentId: parentId || null,
        id: { not: categoryId }
      }
    })

    if (existingCategory) {
      return NextResponse.json({ error: 'Category name already exists at this level' }, { status: 400 })
    }

    // Update category for this client
    const updatedCategory = await prisma.category.update({
      where: { 
        id: categoryId,
        clientId
      },
      data: {
        name: categoryName,
        description: description || null,
        parentId: parentId || null,
        sortOrder: sortOrder !== undefined ? sortOrder : currentCategory.sortOrder
      },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        sortOrder: true,
        createdAt: true
      }
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Check if any products use this category for this client
    const productsWithCategory = await prisma.product.findFirst({
      where: {
        categoryId: categoryId,
        clientId
      }
    })

    if (productsWithCategory) {
      return NextResponse.json({ 
        error: 'Cannot delete category that is in use by products' 
      }, { status: 400 })
    }

    // Soft delete the category (set isActive to false) for this client
    await prisma.category.update({
      where: { 
        id: categoryId,
        clientId
      },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
