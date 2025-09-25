'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import MediaDashboard from '@/components/MediaDashboard'
import BulkMediaUpload from '@/components/BulkMediaUpload'
import MediaLibrary from '@/components/MediaLibrary'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  Upload, 
  Grid, 
  BarChart3,
  Plus
} from 'lucide-react'

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'library'>('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'upload', label: 'Bulk Upload', icon: Upload },
    { id: 'library', label: 'Media Library', icon: Grid }
  ]

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Media Management</h1>
          <p className="text-slate-600">
            Upload, organize, and manage your media assets
          </p>
        </div>

        {/* Tab Navigation */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="flex border-b border-slate-200">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tab Content */}
        {activeTab === 'overview' && <MediaDashboard />}
        {activeTab === 'upload' && (
          <BulkMediaUpload 
            onUploadComplete={() => {
              // Refresh the library if it's open
              if (activeTab === 'library') {
                // The MediaLibrary component will handle its own refresh
              }
            }}
          />
        )}
        {activeTab === 'library' && <MediaLibrary />}
      </div>
    </DashboardLayout>
  )
}
