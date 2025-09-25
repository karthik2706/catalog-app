'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap, 
  Eye, 
  MousePointer,
  Layout,
  Globe,
  Activity,
  RefreshCw
} from 'lucide-react'

interface PerformanceData {
  metrics: Array<{
    url: string
    timestamp: string
    fcp: number
    lcp: number
    fid: number
    cls: number
    ttfb: number
  }>
  averages: {
    fcp: number
    lcp: number
    fid: number
    cls: number
    ttfb: number
  }
  percentiles: {
    fcp: { p50: number; p75: number; p95: number }
    lcp: { p50: number; p75: number; p95: number }
    fid: { p50: number; p75: number; p95: number }
    cls: { p50: number; p75: number; p95: number }
  }
  scores: {
    lcp: 'good' | 'needs-improvement' | 'poor'
    fid: 'good' | 'needs-improvement' | 'poor'
    cls: 'good' | 'needs-improvement' | 'poor'
  }
  total: number
  period: string
}

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/performance?days=7&limit=100')
      if (!response.ok) throw new Error('Failed to fetch performance data')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'good': return 'bg-green-100 text-green-800'
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'good': return <TrendingUp className="w-4 h-4" />
      case 'needs-improvement': return <TrendingDown className="w-4 h-4" />
      case 'poor': return <TrendingDown className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getMetricColor = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.poor) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Performance Analytics</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading performance data: {error}</div>
        <Button onClick={fetchPerformanceData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Performance Analytics</h2>
          <p className="text-slate-600">Core Web Vitals and performance metrics over {data.period}</p>
        </div>
        <Button onClick={fetchPerformanceData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Contentful Paint</CardTitle>
            <Badge className={getScoreColor(data.scores.lcp)}>
              {getScoreIcon(data.scores.lcp)}
              <span className="ml-1 capitalize">{data.scores.lcp}</span>
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {data.averages.lcp ? Math.round(data.averages.lcp) : 0}ms
            </div>
            <div className="text-xs text-slate-600 mt-1">
              P75: {data.percentiles.lcp.p75 ? Math.round(data.percentiles.lcp.p75) : 0}ms | P95: {data.percentiles.lcp.p95 ? Math.round(data.percentiles.lcp.p95) : 0}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Input Delay</CardTitle>
            <Badge className={getScoreColor(data.scores.fid)}>
              {getScoreIcon(data.scores.fid)}
              <span className="ml-1 capitalize">{data.scores.fid}</span>
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {data.averages.fid ? Math.round(data.averages.fid) : 0}ms
            </div>
            <div className="text-xs text-slate-600 mt-1">
              P75: {data.percentiles.fid.p75 ? Math.round(data.percentiles.fid.p75) : 0}ms | P95: {data.percentiles.fid.p95 ? Math.round(data.percentiles.fid.p95) : 0}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumulative Layout Shift</CardTitle>
            <Badge className={getScoreColor(data.scores.cls)}>
              {getScoreIcon(data.scores.cls)}
              <span className="ml-1 capitalize">{data.scores.cls}</span>
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {data.averages.cls ? data.averages.cls.toFixed(3) : '0.000'}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              P75: {data.percentiles.cls.p75 ? data.percentiles.cls.p75.toFixed(3) : '0.000'} | P95: {data.percentiles.cls.p95 ? data.percentiles.cls.p95.toFixed(3) : '0.000'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Contentful Paint</CardTitle>
            <Clock className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMetricColor(data.averages.fcp || 0, { good: 1800, poor: 3000 })}`}>
              {data.averages.fcp ? Math.round(data.averages.fcp) : 0}ms
            </div>
            <div className="text-xs text-slate-600 mt-1">
              P75: {data.percentiles.fcp.p75 ? Math.round(data.percentiles.fcp.p75) : 0}ms | P95: {data.percentiles.fcp.p95 ? Math.round(data.percentiles.fcp.p95) : 0}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time to First Byte</CardTitle>
            <Globe className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMetricColor(data.averages.ttfb || 0, { good: 800, poor: 1800 })}`}>
              {data.averages.ttfb ? Math.round(data.averages.ttfb) : 0}ms
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Server response time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Performance Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.metrics.slice(0, 5).map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {metric.url}
                  </div>
                  <div className="text-xs text-slate-600">
                    {new Date(metric.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium">LCP</div>
                    <div className={getMetricColor(metric.lcp, { good: 2500, poor: 4000 })}>
                      {Math.round(metric.lcp)}ms
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">FID</div>
                    <div className={getMetricColor(metric.fid, { good: 100, poor: 300 })}>
                      {Math.round(metric.fid)}ms
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">CLS</div>
                    <div className={getMetricColor(metric.cls, { good: 0.1, poor: 0.25 })}>
                      {metric.cls.toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Data Collection</h4>
              <p className="text-sm text-slate-600">
                Collected {data.total} performance measurements over {data.period}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Core Web Vitals Status</h4>
              <div className="flex space-x-2">
                <Badge className={getScoreColor(data.scores.lcp)}>LCP: {data.scores.lcp}</Badge>
                <Badge className={getScoreColor(data.scores.fid)}>FID: {data.scores.fid}</Badge>
                <Badge className={getScoreColor(data.scores.cls)}>CLS: {data.scores.cls}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
