import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
