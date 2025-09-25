'use client'

import React from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import DataQualityDashboard from '@/components/DataQualityDashboard'

export default function DataQualityPage() {
  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Data Quality Management</h1>
          <p className="text-slate-600">
            Monitor, analyze, and improve the quality of your data across all entities
          </p>
        </div>
        
        <DataQualityDashboard />
      </div>
    </DashboardLayout>
  )
}
