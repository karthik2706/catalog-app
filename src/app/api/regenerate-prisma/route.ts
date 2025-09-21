import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('Regenerating Prisma client...')
    
    // Regenerate Prisma client
    const { stdout, stderr } = await execAsync('npx prisma generate')
    
    console.log('Prisma generate stdout:', stdout)
    if (stderr) {
      console.log('Prisma generate stderr:', stderr)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Prisma client regenerated successfully',
      stdout,
      stderr
    })
  } catch (error) {
    console.error('Prisma regeneration error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
