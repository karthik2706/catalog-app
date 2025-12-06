'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Database,
  FileText,
  Users,
  Package,
  Image,
  TrendingUp,
  TrendingDown,
  Wrench,
  Eye,
  Filter,
  Trash2,
  Video,
  File
} from 'lucide-react'
import { Modal } from './ui/Modal'

interface DataQualityIssue {
  id: string
  type: 'missing_field' | 'invalid_value' | 'inconsistent_data' | 'orphaned_record' | 'duplicate_data'
  severity: 'low' | 'medium' | 'high' | 'critical'
  entity: string
  entityId: string
  field: string
  description: string
  currentValue?: any
  expectedValue?: any
  suggestion?: string
}

interface DataQualityReport {
  overallScore: number
  totalRecords: number
  totalIssues: number
  issuesByType: Record<string, number>
  issuesBySeverity: Record<string, number>
  issues: DataQualityIssue[]
  recommendations: string[]
}

interface ProductWithoutMedia {
  id: string
  name: string
  sku: string
  price: number
  stockLevel: number
  createdAt: string
  updatedAt: string
}

interface FailingMedia {
  id: string
  kind: string
  s3Key: string
  originalName: string
  mimeType: string
  fileSize: number
  status: string
  error: string | null
  createdAt: string
  updatedAt: string
  url?: string | null
  thumbnailUrl?: string | null
  associatedProducts?: Array<{
    id: string
    name: string
    sku: string
  }>
  productMedia?: Array<{
    product: {
      id: string
      name: string
      sku: string
    }
  }>
}

export default function DataQualityDashboard() {
  const [report, setReport] = useState<DataQualityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [fixing, setFixing] = useState(false)
  
  // Products with missing media
  const [productsWithoutMedia, setProductsWithoutMedia] = useState<ProductWithoutMedia[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [deleteProductsModalOpen, setDeleteProductsModalOpen] = useState(false)
  const [deletingProducts, setDeletingProducts] = useState(false)
  
  // Failing media
  const [failingMedia, setFailingMedia] = useState<FailingMedia[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [failingMediaError, setFailingMediaError] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set())
  const [deleteMediaModalOpen, setDeleteMediaModalOpen] = useState(false)
  const [deletingMedia, setDeletingMedia] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'overview' | 'missing-media' | 'failing-media'>('overview')

  const fetchDataQualityReport = async () => {
    try {
      setLoading(true)
      setError('')
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/data-quality', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch data quality report')
      }

      const data = await response.json()
      setReport(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fixDataQualityIssues = async (autoFix: boolean = false) => {
    try {
      setFixing(true)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const issueIds = report?.issues.map(issue => issue.id) || []
      
      const response = await fetch('/api/data-quality', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'fix_issues',
          issueIds,
          autoFix
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fix data quality issues')
      }

      const data = await response.json()
      console.log('Fix results:', data.results)
      
      // Refresh the report after fixing
      await fetchDataQualityReport()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setFixing(false)
    }
  }

  const fetchProductsWithoutMedia = async () => {
    try {
      setLoadingProducts(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/data-quality/products-missing-media', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch products with missing media')
      }

      const data = await response.json()
      setProductsWithoutMedia(data.products || [])
    } catch (err) {
      console.error('Error fetching products without media:', err)
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchFailingMedia = async () => {
    try {
      setFailingMediaError('')
      setLoadingMedia(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setFailingMediaError('Authentication required. Please log in again.')
        setLoadingMedia(false)
        return
      }

      const response = await fetch('/api/data-quality/failing-media', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        let errorMessage = `Failed to fetch failing media (${response.status})`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Failing media response:', data)
      
      if (data.success && Array.isArray(data.media)) {
        setFailingMedia(data.media)
      } else if (Array.isArray(data)) {
        // Handle case where API returns array directly
        setFailingMedia(data)
      } else if (data.media && Array.isArray(data.media)) {
        setFailingMedia(data.media)
      } else {
        console.warn('Unexpected response format:', data)
        setFailingMedia([])
      }
    } catch (err: any) {
      console.error('Error fetching failing media:', err)
      const errorMessage = err?.message || err?.toString() || 'Failed to fetch failing media'
      setFailingMediaError(errorMessage)
      setFailingMedia([])
    } finally {
      setLoadingMedia(false)
    }
  }

  const handleDeleteProducts = async () => {
    if (selectedProducts.size === 0) return

    setDeletingProducts(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/products/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds: Array.from(selectedProducts) }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete products')
      }

      setSelectedProducts(new Set())
      setDeleteProductsModalOpen(false)
      await fetchProductsWithoutMedia()
    } catch (err: any) {
      setError(err.message)
      console.error('Error deleting products:', err)
    } finally {
      setDeletingProducts(false)
    }
  }

  const handleDeleteMedia = async () => {
    if (selectedMedia.size === 0) return

    setDeletingMedia(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/media/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mediaIds: Array.from(selectedMedia) }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete media files')
      }

      setSelectedMedia(new Set())
      setDeleteMediaModalOpen(false)
      await fetchFailingMedia()
    } catch (err: any) {
      setError(err.message)
      console.error('Error deleting media:', err)
    } finally {
      setDeletingMedia(false)
    }
  }

  useEffect(() => {
    fetchDataQualityReport()
  }, [])

  useEffect(() => {
    if (activeTab === 'missing-media') {
      fetchProductsWithoutMedia()
    } else if (activeTab === 'failing-media') {
      fetchFailingMedia()
    }
  }, [activeTab])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (score >= 70) return <AlertTriangle className="w-5 h-5 text-yellow-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'missing_field': return <FileText className="w-4 h-4" />
      case 'invalid_value': return <XCircle className="w-4 h-4" />
      case 'inconsistent_data': return <AlertTriangle className="w-4 h-4" />
      case 'orphaned_record': return <Database className="w-4 h-4" />
      case 'duplicate_data': return <TrendingUp className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'Product': return <Package className="w-4 h-4" />
      case 'Category': return <FileText className="w-4 h-4" />
      case 'User': return <Users className="w-4 h-4" />
      case 'Media': return <Image className="w-4 h-4" />
      case 'InventoryHistory': return <TrendingUp className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  const filteredIssues = report?.issues.filter(issue => {
    const severityMatch = selectedSeverity === 'all' || issue.severity === selectedSeverity
    const typeMatch = selectedType === 'all' || issue.type === selectedType
    return severityMatch && typeMatch
  }) || []

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Data Quality Dashboard</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
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
        <div className="text-red-600 mb-4">Error loading data quality report: {error}</div>
        <Button onClick={fetchDataQualityReport} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Data Quality Dashboard</h2>
          <p className="text-sm sm:text-base text-slate-600">Monitor and improve your data quality</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto">
          <Button onClick={fetchDataQualityReport} variant="outline" size="sm" className="w-full sm:w-auto flex-shrink-0">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {report.totalIssues > 0 && (
            <Button 
              onClick={() => fixDataQualityIssues(true)} 
              variant="default" 
              size="sm"
              disabled={fixing}
              className="w-full sm:w-auto flex-shrink-0"
            >
              <Wrench className="w-4 h-4 mr-2" />
              {fixing ? 'Fixing...' : 'Auto Fix'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('missing-media')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'missing-media'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Package className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Products Missing Media</span>
              {productsWithoutMedia.length > 0 && (
                <Badge variant="error" className="ml-1">{productsWithoutMedia.length}</Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('failing-media')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === 'failing-media'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Image className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Failing Media</span>
              {failingMedia.length > 0 && (
                <Badge variant="error" className="ml-1">{failingMedia.length}</Badge>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>

      {/* Overall Score */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-x-2">
            {getScoreIcon(report.overallScore)}
            <span className="text-base sm:text-lg">Overall Data Quality Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div>
              <div className={`text-3xl sm:text-4xl font-bold ${getScoreColor(report.overallScore)}`}>
                {report.overallScore}/100
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mt-1">
                {report.totalRecords} total records • {report.totalIssues} issues found
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs sm:text-sm text-slate-600">Data Health</div>
              <div className={`text-base sm:text-lg font-semibold ${getScoreColor(report.overallScore)}`}>
                {report.overallScore >= 90 ? 'Excellent' : 
                 report.overallScore >= 70 ? 'Good' : 
                 report.overallScore >= 50 ? 'Fair' : 'Poor'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Critical Issues</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {report.issuesBySeverity.critical || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {report.issuesBySeverity.high || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600">
              Should be addressed soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Medium Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">
              {report.issuesBySeverity.medium || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600">
              Can be addressed later
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Low Priority</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {report.issuesBySeverity.low || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600">
              Minor improvements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Issue Types */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Issue Types</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            {Object.entries(report.issuesByType).map(([type, count]) => (
              <div key={type} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-slate-900">{count || 0}</div>
                <div className="text-xs sm:text-sm text-slate-600 capitalize">
                  {type.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-base sm:text-lg">Issues ({filteredIssues.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <label className="text-xs sm:text-sm font-medium text-slate-700">Severity:</label>
              <select 
                value={selectedSeverity} 
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="mt-1 w-full px-3 py-1 border border-slate-300 rounded-md text-xs sm:text-sm"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs sm:text-sm font-medium text-slate-700">Type:</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1 w-full px-3 py-1 border border-slate-300 rounded-md text-xs sm:text-sm"
              >
                <option value="all">All</option>
                <option value="missing_field">Missing Field</option>
                <option value="invalid_value">Invalid Value</option>
                <option value="inconsistent_data">Inconsistent Data</option>
                <option value="orphaned_record">Orphaned Record</option>
                <option value="duplicate_data">Duplicate Data</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="p-3 sm:p-4 border border-slate-200 rounded-lg">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-0">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {getEntityIcon(issue.entity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <span className="text-xs sm:text-sm font-medium text-slate-900">{issue.entity}</span>
                        <Badge className={getSeverityColor(issue.severity)}>
                          <span className="text-[10px] sm:text-xs">{issue.severity}</span>
                        </Badge>
                        <Badge variant="outline" className="flex items-center space-x-1">
                          {getTypeIcon(issue.type)}
                          <span className="capitalize text-[10px] sm:text-xs hidden sm:inline">{issue.type.replace('_', ' ')}</span>
                          <span className="capitalize text-[10px] sm:hidden">{issue.type.split('_')[0]}</span>
                        </Badge>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 mb-2">
                        {issue.description}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500">
                        <strong>Field:</strong> {issue.field}
                        {issue.currentValue && (
                          <span> • <strong>Current:</strong> {String(issue.currentValue)}</span>
                        )}
                        {issue.expectedValue && (
                          <span> • <strong>Expected:</strong> {String(issue.expectedValue)}</span>
                        )}
                      </div>
                      {issue.suggestion && (
                        <div className="text-[10px] sm:text-xs text-blue-600 mt-1">
                          💡 {issue.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="flex-shrink-0 w-full sm:w-auto">
                    <Eye className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              {report.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="text-blue-600 mt-0.5">•</div>
                  <div className="text-xs sm:text-sm text-slate-700">{recommendation}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}

      {/* Products Missing Media Tab */}
      {activeTab === 'missing-media' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Products Missing Media</h3>
              <p className="text-sm text-slate-600">Products that have no media files associated</p>
            </div>
            <Button onClick={fetchProductsWithoutMedia} variant="outline" size="sm" disabled={loadingProducts}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingProducts ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : productsWithoutMedia.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">No Products Missing Media</h3>
                <p className="text-slate-500">All products have media files associated with them.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Selection Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === productsWithoutMedia.length && productsWithoutMedia.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(new Set(productsWithoutMedia.map(p => p.id)))
                        } else {
                          setSelectedProducts(new Set())
                        }
                      }}
                      className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <label className="text-sm font-medium text-slate-700">
                      Select All ({productsWithoutMedia.length} products)
                    </label>
                  </div>
                  {selectedProducts.size > 0 && (
                    <span className="text-sm text-slate-500">
                      {selectedProducts.size} selected
                    </span>
                  )}
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedProducts.size > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary-900">
                      {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProducts(new Set())}
                      >
                        Clear selection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteProductsModalOpen(true)}
                        className="text-error-600 border-error-200 hover:bg-error-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Products List */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedProducts.size === productsWithoutMedia.length && productsWithoutMedia.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProducts(new Set(productsWithoutMedia.map(p => p.id)))
                                } else {
                                  setSelectedProducts(new Set())
                                }
                              }}
                              className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                            />
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-slate-900">Product</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-slate-900">SKU</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-slate-900">Price</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-slate-900">Stock</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {productsWithoutMedia.map((product) => (
                          <tr key={product.id} className="hover:bg-slate-50">
                            <td className="px-4 sm:px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedProducts.has(product.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedProducts)
                                  if (e.target.checked) {
                                    newSet.add(product.id)
                                  } else {
                                    newSet.delete(product.id)
                                  }
                                  setSelectedProducts(newSet)
                                }}
                                className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                              />
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <Package className="w-5 h-5 text-slate-400" />
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{product.name || 'Unnamed Product'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-slate-600">{product.sku}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-slate-900">${product.price.toFixed(2)}</td>
                            <td className="px-4 sm:px-6 py-4 text-sm text-slate-900">{product.stockLevel}</td>
                            <td className="px-4 sm:px-6 py-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProducts(new Set([product.id]))
                                  setDeleteProductsModalOpen(true)
                                }}
                                className="text-error-600 hover:text-error-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Failing Media Tab */}
      {activeTab === 'failing-media' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Failing Media Files</h3>
              <p className="text-sm text-slate-600">Media files that are failing to load or have errors</p>
            </div>
            <Button onClick={fetchFailingMedia} variant="outline" size="sm" disabled={loadingMedia}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingMedia ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {failingMediaError && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-error-600">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="text-sm">{failingMediaError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingMedia ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : failingMedia.length === 0 && !failingMediaError ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">No Failing Media Files</h3>
                <p className="text-slate-500">All media files are loading successfully.</p>
              </CardContent>
            </Card>
          ) : failingMedia.length > 0 ? (
            <>
              {/* Selection Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedMedia.size === failingMedia.length && failingMedia.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMedia(new Set(failingMedia.map(m => m.id)))
                        } else {
                          setSelectedMedia(new Set())
                        }
                      }}
                      className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <label className="text-sm font-medium text-slate-700">
                      Select All ({failingMedia.length} files)
                    </label>
                  </div>
                  {selectedMedia.size > 0 && (
                    <span className="text-sm text-slate-500">
                      {selectedMedia.size} selected
                    </span>
                  )}
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedMedia.size > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary-900">
                      {selectedMedia.size} file{selectedMedia.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMedia(new Set())}
                      >
                        Clear selection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteMediaModalOpen(true)}
                        className="text-error-600 border-error-200 hover:bg-error-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Media List */}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedMedia.size === failingMedia.length && failingMedia.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMedia(new Set(failingMedia.map(m => m.id)))
                                } else {
                                  setSelectedMedia(new Set())
                                }
                              }}
                              className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                            />
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-slate-900">File</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-slate-900">Type</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-slate-900">Status</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-slate-900">Error</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-slate-900">Product</th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-slate-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {failingMedia.map((media) => (
                          <tr key={media.id} className="hover:bg-slate-50">
                            <td className="px-4 sm:px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedMedia.has(media.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedMedia)
                                  if (e.target.checked) {
                                    newSet.add(media.id)
                                  } else {
                                    newSet.delete(media.id)
                                  }
                                  setSelectedMedia(newSet)
                                }}
                                className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                              />
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center space-x-3">
                                {media.kind === 'image' ? <Image className="w-5 h-5 text-blue-500" /> :
                                 media.kind === 'video' ? <Video className="w-5 h-5 text-red-500" /> :
                                 <File className="w-5 h-5 text-slate-400" />}
                                <div>
                                  <p className="text-sm font-medium text-slate-900 truncate max-w-xs">
                                    {media.originalName || media.s3Key.split('/').pop() || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {(media.fileSize / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <Badge variant="outline" className="capitalize">{media.kind}</Badge>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <Badge variant="error" className="capitalize">{media.status}</Badge>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <p className="text-xs text-slate-600 truncate max-w-xs" title={media.error || ''}>
                                {media.error || 'N/A'}
                              </p>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              {(() => {
                                const products = media.associatedProducts || media.productMedia?.map(pm => pm.product) || []
                                return products.length > 0 ? (
                                  <div className="space-y-1">
                                    {products.map((product, idx) => (
                                      <div key={idx} className="text-xs">
                                        <span className="font-medium">{product.name}</span>
                                        <span className="text-slate-500"> ({product.sku})</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">No products</span>
                                )
                              })()}
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMedia(new Set([media.id]))
                                  setDeleteMediaModalOpen(true)
                                }}
                                className="text-error-600 hover:text-error-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* Delete Products Modal */}
      <Modal
        isOpen={deleteProductsModalOpen}
        onClose={() => setDeleteProductsModalOpen(false)}
        title="Delete Products"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-4 bg-error-50 border border-error-200 rounded-xl">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-error-600 mr-2" />
              <div>
                <h3 className="font-semibold text-error-900">Confirm Permanent Deletion</h3>
                <p className="text-sm text-error-700 mt-1">
                  Are you sure you want to <strong>permanently delete</strong> {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''}? 
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-slate-900">Products to be deleted:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {productsWithoutMedia
                .filter(product => selectedProducts.has(product.id))
                .slice(0, 10)
                .map(product => (
                  <div key={product.id} className="text-sm text-slate-600 flex items-center space-x-2">
                    <Package className="w-3 h-3" />
                    <span>{product.name} ({product.sku})</span>
                  </div>
                ))
              }
              {selectedProducts.size > 10 && (
                <div className="text-sm text-slate-500 italic">
                  ... and {selectedProducts.size - 10} more product{selectedProducts.size - 10 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteProductsModalOpen(false)}
              disabled={deletingProducts}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleDeleteProducts}
              disabled={deletingProducts}
            >
              {deletingProducts ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Permanently Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Media Modal */}
      <Modal
        isOpen={deleteMediaModalOpen}
        onClose={() => setDeleteMediaModalOpen(false)}
        title="Delete Media Files"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-4 bg-error-50 border border-error-200 rounded-xl">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-error-600 mr-2" />
              <div>
                <h3 className="font-semibold text-error-900">Confirm Permanent Deletion</h3>
                <p className="text-sm text-error-700 mt-1">
                  Are you sure you want to <strong>permanently delete</strong> {selectedMedia.size} media file{selectedMedia.size !== 1 ? 's' : ''}? 
                  This will remove all files from S3 and the database. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-slate-900">Files to be deleted:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {failingMedia
                .filter(media => selectedMedia.has(media.id))
                .slice(0, 10)
                .map(media => (
                  <div key={media.id} className="text-sm text-slate-600 flex items-center space-x-2">
                    {media.kind === 'image' ? <Image className="w-3 h-3" /> : 
                     media.kind === 'video' ? <Video className="w-3 h-3" /> : 
                     <File className="w-3 h-3" />}
                    <span className="truncate">{media.originalName || media.s3Key.split('/').pop()}</span>
                  </div>
                ))
              }
              {selectedMedia.size > 10 && (
                <div className="text-sm text-slate-500 italic">
                  ... and {selectedMedia.size - 10} more file{selectedMedia.size - 10 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteMediaModalOpen(false)}
              disabled={deletingMedia}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleDeleteMedia}
              disabled={deletingMedia}
            >
              {deletingMedia ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Permanently Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
