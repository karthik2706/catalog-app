import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/admin/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Delete client (this will cascade delete related records)
    await prisma.client.delete({
      where: { id: clientId }
    })

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
