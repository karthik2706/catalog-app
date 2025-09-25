'use client'

import React from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import PerformanceDashboard from '@/components/PerformanceDashboard'
import { generateMetadata as generateSEOMetadata } from '@/lib/seo'

export default function PerformancePage() {
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Performance Analytics</h1>
          <p className="text-slate-600">
            Monitor and analyze your application's performance metrics and Core Web Vitals
          </p>
        </div>
        
        <PerformanceDashboard />
      </div>
    </DashboardLayout>
  )
}
