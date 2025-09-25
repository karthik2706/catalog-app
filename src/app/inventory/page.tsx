'use client'

import React from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import InventoryDashboard from '@/components/InventoryDashboard'

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div className="page-container">
        <InventoryDashboard />
      </div>
    </DashboardLayout>
  )
}
