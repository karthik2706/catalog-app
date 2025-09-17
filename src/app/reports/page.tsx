'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { cn, formatCurrency } from '@/lib/utils'
import {
  AlertTriangle,
  TrendingDown,
  BarChart3,
  Download,
  Filter,
  Search,
  Package,
  DollarSign,
  Tag,
  Activity,
  Eye,
  Edit,
  RefreshCw,
  FileText,
  PieChart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Product } from '@/types'

interface LowStockReport {
  products: Product[]
  totalLowStock: number
  totalValueAtRisk: number
  categories: { [key: string]: number }
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [report, setReport] = useState<LowStockReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchLowStockReport()
    }
  }, [user, authLoading, router])

  const fetchLowStockReport = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products?lowStock=true&limit=1000')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch low stock report')
      }

      const lowStockProducts = data.products.filter((p: Product) => p.stockLevel <= p.minStock)
      
      // Calculate report data
      const totalValueAtRisk = lowStockProducts.reduce(
        (sum: number, product: Product) => sum + (Number(product.price) * product.stockLevel),
        0
      )

      const categories: { [key: string]: number } = {}
      lowStockProducts.forEach((product: Product) => {
        categories[product.category] = (categories[product.category] || 0) + 1
      })

      setReport({
        products: lowStockProducts,
        totalLowStock: lowStockProducts.length,
        totalValueAtRisk,
        categories,
      })
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching low stock report:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityLevel = (product: Product) => {
    const stockRatio = product.stockLevel / product.minStock
    if (stockRatio <= 0.5) return 'critical'
    if (stockRatio <= 0.8) return 'high'
    return 'medium'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'primary'
      default: return 'default'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertCircle
      case 'high': return AlertTriangle
      case 'medium': return Activity
      default: return Activity
    }
  }

  const filteredProducts = report?.products.filter((product) => {
    const matchesCategory = !categoryFilter || product.category === categoryFilter
    const matchesSeverity = severityFilter === 'all' || getSeverityLevel(product) === severityFilter
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSeverity && matchesSearch
  }) || []

  const exportToCSV = () => {
    if (!filteredProducts.length) return

    const headers = ['Name', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Price', 'Value at Risk', 'Severity']
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map(product => [
        `"${product.name}"`,
        product.sku,
        product.category,
        product.stockLevel,
        product.minStock,
        product.price,
        (Number(product.price) * product.stockLevel).toFixed(2),
        getSeverityLevel(product)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'low-stock-report.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading size="lg" text="Loading reports..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
            <p className="mt-2 text-slate-600">
              Analytics and insights for your inventory management
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button
              variant="outline"
              onClick={fetchLowStockReport}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={exportToCSV}
              disabled={!filteredProducts.length}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-xl p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-error-600 mr-2" />
              <p className="text-error-800">{error}</p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Low Stock</p>
                  <p className="text-3xl font-bold text-slate-900">{report?.totalLowStock || 0}</p>
                  <p className="text-xs text-slate-500 mt-1">Items need restocking</p>
                </div>
                <div className="w-12 h-12 bg-error-50 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-error-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">Value at Risk</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatCurrency(report?.totalValueAtRisk || 0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Potential revenue loss</p>
                </div>
                <div className="w-12 h-12 bg-warning-50 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">Categories Affected</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {Object.keys(report?.categories || {}).length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Different categories</p>
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">Critical Items</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {filteredProducts.filter(p => getSeverityLevel(p) === 'critical').length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Urgent attention needed</p>
                </div>
                <div className="w-12 h-12 bg-error-50 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-error-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div className="w-full lg:w-64">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input w-full"
                >
                  <option value="">All Categories</option>
                  {Object.keys(report?.categories || {}).map((category) => (
                    <option key={category} value={category}>
                      {category} ({report?.categories[category]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full lg:w-48">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="input w-full"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'table' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Package className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-600">
              Showing {filteredProducts.length} of {report?.totalLowStock || 0} low stock items
            </div>
          </CardContent>
        </Card>

        {/* Products List/Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const severity = getSeverityLevel(product)
              const SeverityIcon = getSeverityIcon(severity)
              const stockRatio = (product.stockLevel / product.minStock * 100).toFixed(1)
              const valueAtRisk = Number(product.price) * product.stockLevel
              
              return (
                <Card key={product.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant={getSeverityColor(severity) as any} size="sm">
                        <SeverityIcon className="w-3 h-3 mr-1" />
                        {severity.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{product.name}</h3>
                        <p className="text-sm text-slate-500">SKU: {product.sku}</p>
                        {product.description && (
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant="default" size="sm">{product.category}</Badge>
                        <span className="text-sm text-slate-500">
                          {stockRatio}% of min
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Current Stock</span>
                          <span className="font-semibold text-error-600">{product.stockLevel}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Min Stock</span>
                          <span className="font-medium text-slate-900">{product.minStock}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Value at Risk</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(valueAtRisk)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Unit Price</span>
                          <span className="font-medium text-slate-900">
                            {formatCurrency(Number(product.price))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">SKU</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Current Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Min Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Stock Ratio</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Value at Risk</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Severity</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProducts.map((product) => {
                    const severity = getSeverityLevel(product)
                    const SeverityIcon = getSeverityIcon(severity)
                    const stockRatio = (product.stockLevel / product.minStock * 100).toFixed(1)
                    const valueAtRisk = Number(product.price) * product.stockLevel
                    
                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{product.name}</p>
                              {product.description && (
                                <p className="text-sm text-slate-500 truncate max-w-xs">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{product.sku}</td>
                        <td className="px-6 py-4">
                          <Badge variant="default" size="sm">{product.category}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-error-600">{product.stockLevel}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">{product.minStock}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'text-sm font-medium',
                            severity === 'critical' && 'text-error-600',
                            severity === 'high' && 'text-warning-600',
                            severity === 'medium' && 'text-primary-600'
                          )}>
                            {stockRatio}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          {formatCurrency(valueAtRisk)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getSeverityColor(severity) as any} size="sm">
                            <SeverityIcon className="w-3 h-3 mr-1" />
                            {severity.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/products/${product.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/products/${product.id}/edit`)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No low stock items found</h3>
              <p className="text-slate-500 mb-6">
                All products are above their minimum stock levels. Great job managing your inventory!
              </p>
              <Button onClick={() => router.push('/products')}>
                <Package className="w-4 h-4 mr-2" />
                View All Products
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}