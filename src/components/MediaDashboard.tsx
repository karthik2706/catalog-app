'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Loading } from './ui/Loading'
import { 
  Image, 
  Video, 
  File, 
  Upload, 
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Download,
  Trash2,
  Settings,
  Grid,
  List,
  Search,
  Filter
} from 'lucide-react'

interface MediaAnalytics {
  overview: {
    totalMedia: number
    totalFileSize: number
    averageFileSize: number
    mediaCoverage: number
    productsWithMedia: number
    productsWithoutMedia: number
  }
  byType: Array<{
    kind: string
    count: number
    totalSize: number
    percentage: number
  }>
  byStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  recentUploads: Array<{
    id: string
    originalName: string
    kind: string
    fileSize: number
    createdAt: string
    product: {
      sku: string
      name: string
    }
  }>
  topProductsByMedia: Array<{
    id: string
    sku: string
    name: string
    mediaCount: number
  }>
  dailyTrends: Array<{
    date: string
    uploads: number
    totalSize: number
  }>
  issues: {
    mediaWithoutMetadata: number
    needsAttention: boolean
  }
}

interface MediaDashboardProps {
  onViewProduct?: (productId: string) => void
  onManageMedia?: (productId: string) => void
}

export default function MediaDashboard({ 
  onViewProduct, 
  onManageMedia 
}: MediaDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analytics, setAnalytics] = useState<MediaAnalytics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'products' | 'issues'>('overview')

  useEffect(() => {
    fetchMediaAnalytics()
  }, [])

  const fetchMediaAnalytics = async () => {
    try {
      setRefreshing(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/media/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching media analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (kind: string) => {
    switch (kind) {
      case 'image':
        return <Image className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'audio':
        return <File className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'processing':
        return 'warning'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Failed to load media analytics</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Media Dashboard</h2>
          <p className="text-slate-600">Manage and analyze your media assets</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMediaAnalytics}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Media</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.overview.totalMedia}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <File className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Size</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatFileSize(analytics.overview.totalFileSize)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Media Coverage</p>
                <p className="text-2xl font-bold text-slate-900">
                  {analytics.overview.mediaCoverage}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Products w/ Media</p>
                <p className="text-2xl font-bold text-slate-900">
                  {analytics.overview.productsWithMedia}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'trends'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Trends
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'products'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Grid className="w-4 h-4 inline mr-2" />
          Products
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'issues'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Issues
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Media by Type</h3>
              <div className="space-y-3">
                {analytics.byType.map((type) => (
                  <div key={type.kind} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(type.kind)}
                      <span className="text-sm font-medium text-slate-900 capitalize">
                        {type.kind}s
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{type.count}</p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(type.totalSize)} ({type.percentage}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Media by Status</h3>
              <div className="space-y-3">
                {analytics.byStatus.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(status.status) as any} size="sm">
                        {status.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{status.count}</p>
                      <p className="text-xs text-slate-500">{status.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Uploads</h3>
              {analytics.recentUploads.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No recent uploads</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.recentUploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(upload.kind)}
                        <div>
                          <p className="font-medium text-slate-900">{upload.originalName}</p>
                          <p className="text-sm text-slate-600">
                            {upload.product.sku} • {formatFileSize(upload.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">
                          {new Date(upload.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Products by Media Count</h3>
            {analytics.topProductsByMedia.length === 0 ? (
              <div className="text-center py-8">
                <Grid className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No products with media found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.topProductsByMedia.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-600">SKU: {product.sku}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="default" size="sm">
                        {product.mediaCount} files
                      </Badge>
                      {onManageMedia && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onManageMedia(product.id)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Media Issues</h3>
              {analytics.issues.needsAttention ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900">
                        {analytics.issues.mediaWithoutMetadata} images without metadata
                      </p>
                      <p className="text-sm text-orange-700">
                        Some images are missing width/height information
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-green-600">No media issues found</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Media Coverage</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Products with media</span>
                  <span className="font-medium">{analytics.overview.productsWithMedia}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Products without media</span>
                  <span className="font-medium">{analytics.overview.productsWithoutMedia}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${analytics.overview.mediaCoverage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-slate-600 text-center">
                  {analytics.overview.mediaCoverage}% media coverage
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
