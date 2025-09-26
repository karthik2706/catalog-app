import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authorizeSuperAdmin } from '@/lib/auth-middleware'

// DELETE /api/admin/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is super admin
    const authResult = await authorizeSuperAdmin(request)
    if (authResult.response) {
      return authResult.response
    }

    const { id: clientId } = await params
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Delete related records first to avoid foreign key constraints
    console.log('Deleting related records for client:', clientId)
    
    // Delete products
    await prisma.product.deleteMany({
      where: { clientId }
    })
    
    // Delete categories
    await prisma.category.deleteMany({
      where: { clientId }
    })
    
    // Delete inventory history
    await prisma.inventoryHistory.deleteMany({
      where: { clientId }
    })
    
    // Delete users
    await prisma.user.deleteMany({
      where: { clientId }
    })
    
    // Delete API keys
    await prisma.apiKey.deleteMany({
      where: { clientId }
    })
    
    // Delete client settings
    await prisma.clientSettings.deleteMany({
      where: { clientId }
    })
    
    // Finally delete the client
    await prisma.client.delete({
      where: { id: clientId }
    })

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

// PUT /api/admin/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is super admin
    const authResult = await authorizeSuperAdmin(request)
    if (authResult.response) {
      return authResult.response
    }

    const { id: clientId } = await params
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const data = await request.json()
    const { name, email, phone, address, plan, countryId, currencyId } = data

    // Validate country and currency exist
    if (countryId) {
      const country = await prisma.country.findUnique({ where: { id: countryId } })
      if (!country) {
        return NextResponse.json(
          { error: 'Invalid country selected' },
          { status: 400 }
        )
      }
    }

    if (currencyId) {
      const currency = await prisma.currency.findUnique({ where: { id: currencyId } })
      if (!currency) {
        return NextResponse.json(
          { error: 'Invalid currency selected' },
          { status: 400 }
        )
      }
    }

    // Update client
    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(plan && { plan }),
        ...(countryId && { countryId }),
        ...(currencyId && { currencyId }),
      },
      include: {
        country: true,
        currency: true,
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
