import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully',
      result 
    })
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error.message 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Get basic database info
    const userCount = await prisma.user.count()
    const clientCount = await prisma.client.count()
    const productCount = await prisma.product.count()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully',
      stats: {
        users: userCount,
        clients: clientCount,
        products: productCount
      }
    })
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed',
      details: error.message 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
