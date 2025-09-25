import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface PerformanceMetrics {
  fcp: number | null
  lcp: number | null
  fid: number | null
  cls: number | null
  ttfb: number | null
  fmp: number | null
  tti: number | null
}

interface PerformanceData {
  url: string
  timestamp: number
  metrics: PerformanceMetrics
  userAgent?: string
  connectionType?: string
  deviceMemory?: number
  hardwareConcurrency?: number
}

// POST /api/analytics/performance - Store performance metrics
export async function POST(request: NextRequest) {
  try {
    const data: PerformanceData = await request.json()
    
    // Validate required fields
    if (!data.url || !data.metrics) {
      return NextResponse.json(
        { error: 'URL and metrics are required' },
        { status: 400 }
      )
    }

    // Store performance data in database
    await prisma.performanceMetrics.create({
      data: {
        url: data.url,
        timestamp: new Date(data.timestamp),
        fcp: data.metrics.fcp,
        lcp: data.metrics.lcp,
        fid: data.metrics.fid,
        cls: data.metrics.cls,
        ttfb: data.metrics.ttfb,
        fmp: data.metrics.fmp,
        tti: data.metrics.tti,
        userAgent: data.userAgent,
        connectionType: data.connectionType,
        deviceMemory: data.deviceMemory,
        hardwareConcurrency: data.hardwareConcurrency,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to store performance metrics' },
      { status: 500 }
    )
  }
}

// GET /api/analytics/performance - Get performance analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const days = parseInt(searchParams.get('days') || '7')
    const limit = parseInt(searchParams.get('limit') || '100')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const where: any = {
      timestamp: {
        gte: startDate
      }
    }

    if (url) {
      where.url = url
    }

    const metrics = await prisma.performanceMetrics.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    // Calculate averages
    const averages = {
      fcp: metrics.reduce((sum, m) => sum + (m.fcp || 0), 0) / metrics.length,
      lcp: metrics.reduce((sum, m) => sum + (m.lcp || 0), 0) / metrics.length,
      fid: metrics.reduce((sum, m) => sum + (m.fid || 0), 0) / metrics.length,
      cls: metrics.reduce((sum, m) => sum + (m.cls || 0), 0) / metrics.length,
      ttfb: metrics.reduce((sum, m) => sum + (m.ttfb || 0), 0) / metrics.length,
      fmp: metrics.reduce((sum, m) => sum + (m.fmp || 0), 0) / metrics.length,
      tti: metrics.reduce((sum, m) => sum + (m.tti || 0), 0) / metrics.length,
    }

    // Calculate percentiles
    const sortedFcp = metrics.map(m => m.fcp).filter(Boolean).sort((a, b) => a - b)
    const sortedLcp = metrics.map(m => m.lcp).filter(Boolean).sort((a, b) => a - b)
    const sortedFid = metrics.map(m => m.fid).filter(Boolean).sort((a, b) => a - b)
    const sortedCls = metrics.map(m => m.cls).filter(Boolean).sort((a, b) => a - b)

    const percentiles = {
      fcp: {
        p50: sortedFcp[Math.floor(sortedFcp.length * 0.5)],
        p75: sortedFcp[Math.floor(sortedFcp.length * 0.75)],
        p95: sortedFcp[Math.floor(sortedFcp.length * 0.95)],
      },
      lcp: {
        p50: sortedLcp[Math.floor(sortedLcp.length * 0.5)],
        p75: sortedLcp[Math.floor(sortedLcp.length * 0.75)],
        p95: sortedLcp[Math.floor(sortedLcp.length * 0.95)],
      },
      fid: {
        p50: sortedFid[Math.floor(sortedFid.length * 0.5)],
        p75: sortedFid[Math.floor(sortedFid.length * 0.75)],
        p95: sortedFid[Math.floor(sortedFid.length * 0.95)],
      },
      cls: {
        p50: sortedCls[Math.floor(sortedCls.length * 0.5)],
        p75: sortedCls[Math.floor(sortedCls.length * 0.75)],
        p95: sortedCls[Math.floor(sortedCls.length * 0.95)],
      },
    }

    // Calculate Core Web Vitals scores
    const getScore = (value: number, thresholds: { good: number; poor: number }) => {
      if (value <= thresholds.good) return 'good'
      if (value <= thresholds.poor) return 'needs-improvement'
      return 'poor'
    }

    const scores = {
      lcp: getScore(averages.lcp, { good: 2500, poor: 4000 }),
      fid: getScore(averages.fid, { good: 100, poor: 300 }),
      cls: getScore(averages.cls, { good: 0.1, poor: 0.25 }),
    }

    return NextResponse.json({
      metrics: metrics.slice(0, 10), // Return latest 10 for detailed view
      averages,
      percentiles,
      scores,
      total: metrics.length,
      period: `${days} days`
    })
  } catch (error) {
    console.error('Error fetching performance analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance analytics' },
      { status: 500 }
    )
  }
}
