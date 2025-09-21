import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Database Debug Information ===')
    
    // Check environment variables
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      POSTGRES_URL: process.env.POSTGRES_URL ? 'Set' : 'Not set',
      PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    }
    
    console.log('Environment variables:', envVars)
    
    // Try to import Prisma
    let prismaImport = 'Failed'
    let prismaClient = null
    try {
      const { PrismaClient } = await import('@prisma/client')
      prismaClient = new PrismaClient()
      prismaImport = 'Success'
      console.log('Prisma client created successfully')
    } catch (error) {
      console.error('Prisma import error:', error)
      prismaImport = `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
    
    // Try database connection
    let connectionTest = 'Not attempted'
    let connectionError = null
    if (prismaClient) {
      try {
        await prismaClient.$connect()
        const result = await prismaClient.$queryRaw`SELECT 1 as test, NOW() as current_time`
        connectionTest = 'Success'
        console.log('Database connection successful:', result)
        await prismaClient.$disconnect()
      } catch (error) {
        connectionTest = 'Failed'
        connectionError = error instanceof Error ? error.message : 'Unknown error'
        console.error('Database connection error:', error)
        if (prismaClient) {
          await prismaClient.$disconnect()
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        environment: envVars,
        prismaImport,
        connectionTest,
        connectionError,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
