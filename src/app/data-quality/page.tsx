'use client'

import React from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import DataQualityDashboard from '@/components/DataQualityDashboard'

export default function DataQualityPage() {
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">Data Quality Management</h1>
          <p className="text-sm sm:text-base text-slate-600">
            Monitor, analyze, and improve the quality of your data across all entities
          </p>
        </div>
        
        <DataQualityDashboard />
      </div>
    </DashboardLayout>
  )
}
