'use client'

import React from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import PerformanceDashboard from '@/components/PerformanceDashboard'
import { generateMetadata as generateSEOMetadata } from '@/lib/seo'

export default function PerformancePage() {
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">Performance Analytics</h1>
          <p className="text-sm sm:text-base text-slate-600">
            Monitor and analyze your application's performance metrics and Core Web Vitals
          </p>
        </div>
        
        <PerformanceDashboard />
      </div>
    </DashboardLayout>
  )
}
