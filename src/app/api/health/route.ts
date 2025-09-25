import { NextRequest, NextResponse } from 'next/server'
import { prisma, checkPrismaHealth } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET: !!process.env.JWT_SECRET,
    }

    // Check Prisma client health
    const prismaHealthy = await checkPrismaHealth()
    
    // Test a simple database query
    let dbTest = false
    try {
      await prisma.$queryRaw`SELECT 1 as test`
      dbTest = true
    } catch (error) {
      console.error('Database test query failed:', error)
    }

    const health = {
      status: prismaHealthy && dbTest ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        prismaHealthy,
        dbTest,
        connectionString: process.env.DATABASE_URL ? 'set' : 'missing'
      },
      prisma: {
        initialized: !!prisma,
        hasMedia: !!(prisma && prisma.media),
        hasProduct: !!(prisma && prisma.product)
      }
    }

    return NextResponse.json(health, { 
      status: health.status === 'healthy' ? 200 : 503 
    })

  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
