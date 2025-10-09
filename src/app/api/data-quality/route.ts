import { NextRequest, NextResponse } from 'next/server'
import { runDataQualityCheck, DataQualityReport } from '@/lib/data-quality'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
}

function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return decoded
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

// GET /api/data-quality - Get data quality report
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Allow all authenticated users to access data quality reports
    // Only MASTER_ADMIN can fix issues (see POST endpoint)
    if (!['USER', 'MANAGER', 'ADMIN', 'MASTER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Authentication required.' },
        { status: 403 }
      )
    }

    const report = await runDataQualityCheck()
    
    return NextResponse.json({
      success: true,
      report,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating data quality report:', error)
    return NextResponse.json(
      { error: 'Failed to generate data quality report' },
      { status: 500 }
    )
  }
}

// POST /api/data-quality - Fix data quality issues
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow super admin to fix data quality issues
    if (user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Super admin role required to fix data issues.' },
        { status: 403 }
      )
    }

    const { action, issueIds, autoFix } = await request.json()

    if (action === 'fix_issues') {
      const results = await fixDataQualityIssues(issueIds, autoFix)
      
      return NextResponse.json({
        success: true,
        results,
        fixedAt: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fixing data quality issues:', error)
    return NextResponse.json(
      { error: 'Failed to fix data quality issues' },
      { status: 500 }
    )
  }
}

async function fixDataQualityIssues(issueIds: string[], autoFix: boolean = false) {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  
  const results = {
    fixed: 0,
    failed: 0,
    errors: [] as string[]
  }

  try {
    // This is a placeholder for actual data fixing logic
    // In a real implementation, you would:
    // 1. Parse the issue IDs
    // 2. Apply appropriate fixes based on issue type
    // 3. Update the database records
    // 4. Log the changes
    
    if (autoFix) {
      // Example auto-fix logic
      console.log(`Auto-fixing ${issueIds.length} data quality issues...`)
      
      // Fix missing product names
      await prisma.product.updateMany({
        where: {
          name: { equals: '' }
        },
        data: {
          name: 'Unnamed Product'
        }
      })

      // Fix missing category names
      await prisma.category.updateMany({
        where: {
          name: { equals: '' }
        },
        data: {
          name: 'Unnamed Category'
        }
      })

      // Fix negative stock levels
      await prisma.product.updateMany({
        where: {
          stockLevel: { lt: 0 }
        },
        data: {
          stockLevel: 0
        }
      })

      results.fixed = issueIds.length
    } else {
      results.failed = issueIds.length
      results.errors.push('Auto-fix is disabled. Manual intervention required.')
    }

    return results
  } catch (error) {
    results.failed = issueIds.length
    results.errors.push(error instanceof Error ? error.message : 'Unknown error')
    return results
  } finally {
    await prisma.$disconnect()
  }
}
