'use client'

import React, { useEffect, useState } from 'react'

interface PerformanceMetrics {
  fcp: number | null
  lcp: number | null
  fid: number | null
  cls: number | null
  ttfb: number | null
  fmp: number | null
  tti: number | null
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
  reportToAnalytics?: boolean
}

export default function PerformanceMonitor({ 
  onMetricsUpdate, 
  reportToAnalytics = false 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fmp: null,
    tti: null
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const collectMetrics = () => {
      const newMetrics: PerformanceMetrics = { ...metrics }

      // First Contentful Paint (FCP)
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
      if (fcpEntry) {
        newMetrics.fcp = fcpEntry.startTime
      }

      // Largest Contentful Paint (LCP)
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
      if (lcpEntries.length > 0) {
        newMetrics.lcp = lcpEntries[lcpEntries.length - 1].startTime
      }

      // First Input Delay (FID)
      const fidEntries = performance.getEntriesByType('first-input')
      if (fidEntries.length > 0) {
        newMetrics.fid = fidEntries[0].processingStart - fidEntries[0].startTime
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsEntries = performance.getEntriesByType('layout-shift')
      for (const entry of clsEntries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      newMetrics.cls = clsValue

      // Time to First Byte (TTFB)
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigationEntry) {
        newMetrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart
      }

      // First Meaningful Paint (FMP) - approximated
      const paintEntries = performance.getEntriesByType('paint')
      const fmpEntry = paintEntries.find(entry => entry.name === 'first-meaningful-paint')
      if (fmpEntry) {
        newMetrics.fmp = fmpEntry.startTime
      }

      // Time to Interactive (TTI) - approximated
      if (navigationEntry) {
        newMetrics.tti = navigationEntry.domContentLoadedEventEnd - navigationEntry.navigationStart
      }

      setMetrics(newMetrics)
      onMetricsUpdate?.(newMetrics)

      // Report to analytics if enabled
      if (reportToAnalytics) {
        reportMetricsToAnalytics(newMetrics)
      }
    }

    // Collect metrics after page load
    if (document.readyState === 'complete') {
      collectMetrics()
    } else {
      window.addEventListener('load', collectMetrics)
    }

    // Collect metrics periodically for dynamic content
    const interval = setInterval(collectMetrics, 5000)

    return () => {
      window.removeEventListener('load', collectMetrics)
      clearInterval(interval)
    }
  }, [onMetricsUpdate, reportToAnalytics])

  const reportMetricsToAnalytics = (metrics: PerformanceMetrics) => {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: 'Core Web Vitals',
        value: Math.round(metrics.lcp || 0),
        custom_map: {
          metric_fcp: metrics.fcp,
          metric_lcp: metrics.lcp,
          metric_fid: metrics.fid,
          metric_cls: metrics.cls,
          metric_ttfb: metrics.ttfb
        }
      })
    }

    // Custom analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: window.location.href,
        timestamp: Date.now(),
        metrics
      })
    }).catch(console.error)
  }

  const getPerformanceScore = (metrics: PerformanceMetrics): number => {
    let score = 100

    // LCP scoring (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
    if (metrics.lcp) {
      if (metrics.lcp > 4000) score -= 30
      else if (metrics.lcp > 2500) score -= 15
    }

    // FID scoring (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
    if (metrics.fid) {
      if (metrics.fid > 300) score -= 25
      else if (metrics.fid > 100) score -= 10
    }

    // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    if (metrics.cls) {
      if (metrics.cls > 0.25) score -= 25
      else if (metrics.cls > 0.1) score -= 10
    }

    // FCP scoring (Good: <1.8s, Needs Improvement: 1.8-3s, Poor: >3s)
    if (metrics.fcp) {
      if (metrics.fcp > 3000) score -= 10
      else if (metrics.fcp > 1800) score -= 5
    }

    // TTFB scoring (Good: <800ms, Needs Improvement: 800-1800ms, Poor: >1800ms)
    if (metrics.ttfb) {
      if (metrics.ttfb > 1800) score -= 10
      else if (metrics.ttfb > 800) score -= 5
    }

    return Math.max(0, score)
  }

  const score = getPerformanceScore(metrics)

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-900">Performance</h3>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          score >= 90 ? 'bg-green-100 text-green-800' :
          score >= 70 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {score}/100
        </div>
      </div>
      
      <div className="space-y-1 text-xs text-slate-600">
        {metrics.lcp && (
          <div className="flex justify-between">
            <span>LCP:</span>
            <span className={metrics.lcp > 4000 ? 'text-red-600' : metrics.lcp > 2500 ? 'text-yellow-600' : 'text-green-600'}>
              {Math.round(metrics.lcp)}ms
            </span>
          </div>
        )}
        {metrics.fid && (
          <div className="flex justify-between">
            <span>FID:</span>
            <span className={metrics.fid > 300 ? 'text-red-600' : metrics.fid > 100 ? 'text-yellow-600' : 'text-green-600'}>
              {Math.round(metrics.fid)}ms
            </span>
          </div>
        )}
        {metrics.cls !== null && (
          <div className="flex justify-between">
            <span>CLS:</span>
            <span className={metrics.cls > 0.25 ? 'text-red-600' : metrics.cls > 0.1 ? 'text-yellow-600' : 'text-green-600'}>
              {metrics.cls.toFixed(3)}
            </span>
          </div>
        )}
        {metrics.fcp && (
          <div className="flex justify-between">
            <span>FCP:</span>
            <span className={metrics.fcp > 3000 ? 'text-red-600' : metrics.fcp > 1800 ? 'text-yellow-600' : 'text-green-600'}>
              {Math.round(metrics.fcp)}ms
            </span>
          </div>
        )}
        {metrics.ttfb && (
          <div className="flex justify-between">
            <span>TTFB:</span>
            <span className={metrics.ttfb > 1800 ? 'text-red-600' : metrics.ttfb > 800 ? 'text-yellow-600' : 'text-green-600'}>
              {Math.round(metrics.ttfb)}ms
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
