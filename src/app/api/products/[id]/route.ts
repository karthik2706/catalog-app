import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mockStore } from '@/lib/mockStore'
import { UpdateProductRequest } from '@/types'

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    try {
      // Try to fetch from database first
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          inventoryHistory: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(product)
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateProductRequest = await request.json()
    
    try {
      // Try to update in database first
      const existingProduct = await prisma.product.findUnique({
        where: { id }
      })

      if (!existingProduct) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Check if SKU is being changed and if it already exists
      if (body.sku && body.sku !== existingProduct.sku) {
        const skuExists = await prisma.product.findUnique({
          where: { sku: body.sku }
        })

        if (skuExists) {
          return NextResponse.json(
            { error: 'Product with this SKU already exists' },
            { status: 409 }
          )
        }
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...body,
          updatedAt: new Date()
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

      return NextResponse.json(product)
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Soft delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    try {
      // Try to delete from database first
      const product = await prisma.product.findUnique({
        where: { id }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Soft delete by setting isActive to false
      await prisma.product.update({
        where: { id },
        data: { isActive: false }
      })

      return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}