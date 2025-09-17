import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

// GET /api/admin/clients - List all clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              products: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { name, email, phone, address, plan = 'STARTER' } = data

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const existingClient = await prisma.client.findUnique({
      where: { slug },
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'A client with this name already exists' },
        { status: 400 }
      )
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        slug,
        email,
        phone,
        address,
        plan,
      },
    })

    // Create default settings
    await prisma.clientSettings.create({
      data: {
        clientId: client.id,
        companyName: name,
        email,
        phone,
        address,
      },
    })

    // Create default admin user
    const hashedPassword = await bcrypt.hash('password123', 10)
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${name} Admin`,
        role: 'ADMIN',
        clientId: client.id,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
