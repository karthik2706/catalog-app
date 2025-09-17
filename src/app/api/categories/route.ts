import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get categories from the categories table
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true
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
    const body = await request.json()
    const { category, description } = body

    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const categoryName = category.trim()

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: {
        name: categoryName
      }
    })

    if (existingCategory) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 })
    }

    // Create new category
    const newCategory = await prisma.category.create({
      data: {
        name: categoryName,
        description: description || null
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true
      }
    })

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Error adding category:', error)
    return NextResponse.json({ error: 'Failed to add category' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Check if any products use this category
    const productsWithCategory = await prisma.product.findFirst({
      where: {
        categoryId: categoryId
      }
    })

    if (productsWithCategory) {
      return NextResponse.json({ 
        error: 'Cannot delete category that is in use by products' 
      }, { status: 400 })
    }

    // Soft delete the category (set isActive to false)
    await prisma.category.update({
      where: { id: categoryId },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
