import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable not set'
      }, { status: 500 })
    }
    
    // Test direct connection using pg
    const { Client } = await import('pg')
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    })
    
    try {
      await client.connect()
      const result = await client.query('SELECT 1 as test, NOW() as current_time')
      await client.end()
      
      return NextResponse.json({
        success: true,
        message: 'Direct database connection successful',
        test: result.rows[0],
        connectionString: databaseUrl.substring(0, 50) + '...'
      })
    } catch (dbError) {
      await client.end()
      throw dbError
    }
  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    }, { status: 500 })
  }
}
