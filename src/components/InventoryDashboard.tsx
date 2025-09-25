'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Loading } from './ui/Loading'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Bell,
  RefreshCw,
  Eye,
  ShoppingCart,
  AlertCircle
} from 'lucide-react'

interface InventoryStats {
  totalProducts: number
  totalStockValue: number
  lowStockProducts: number
  outOfStockProducts: number
  totalMovements: number
  averageMovement: number
  lastMovement: string | null
  stockTrend: 'up' | 'down' | 'stable'
}

interface LowStockAlert {
  id: string
  sku: string
  name: string
  stockLevel: number
  minStock: number
  alertLevel: 'critical' | 'warning'
  daysUntilStockout: number
}

interface ReorderRecommendation {
  productId: string
  sku: string
  name: string
  currentStock: number
  minStock: number
  avgDailyUsage: number
  daysUntilReorder: number
  recommendedOrderQuantity: number
  priority: 'high' | 'medium' | 'low'
}

interface InventoryDashboardProps {
  onViewProduct?: (productId: string) => void
  onUpdateInventory?: (productId: string) => void
}

export default function InventoryDashboard({ 
  onViewProduct, 
  onUpdateInventory 
}: InventoryDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])
  const [reorderRecommendations, setReorderRecommendations] = useState<ReorderRecommendation[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'recommendations'>('overview')

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const fetchInventoryData = async () => {
    try {
      setRefreshing(true)
      const token = localStorage.getItem('token')
      
      // Fetch analytics data
      const analyticsResponse = await fetch('/api/inventory/analytics?includeProjections=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        
        // Calculate stats from analytics
        const inventoryStats: InventoryStats = {
          totalProducts: analyticsData.totalProducts || 0,
          totalStockValue: analyticsData.totalStockValue || 0,
          lowStockProducts: analyticsData.lowStockAlerts?.length || 0,
          outOfStockProducts: analyticsData.lowStockAlerts?.filter((alert: any) => alert.alertLevel === 'critical').length || 0,
          totalMovements: analyticsData.totalMovements || 0,
          averageMovement: analyticsData.averageMovement || 0,
          lastMovement: analyticsData.lastMovement,
          stockTrend: analyticsData.stockTrend || 'stable'
        }
        
        setStats(inventoryStats)
        setLowStockAlerts(analyticsData.lowStockAlerts || [])
        setReorderRecommendations(analyticsData.reorderRecommendations || [])
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      default:
        return <Package className="w-5 h-5 text-blue-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50'
      case 'down':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventory Dashboard</h2>
          <p className="text-slate-600">Monitor and manage your inventory levels</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInventoryData}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Products</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Low Stock Alerts</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.lowStockProducts}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.outOfStockProducts}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Stock Trend</p>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(stats.stockTrend)}
                    <span className="text-lg font-bold capitalize">{stats.stockTrend}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${getTrendColor(stats.stockTrend)}`}>
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'alerts'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Alerts ({lowStockAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'recommendations'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-2" />
          Reorder ({reorderRecommendations.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Movements (30 days)</span>
                  <span className="font-medium">{stats?.totalMovements || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Average Movement</span>
                  <span className="font-medium">{stats?.averageMovement?.toFixed(1) || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Last Movement</span>
                  <span className="font-medium">
                    {stats?.lastMovement ? new Date(stats.lastMovement).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab('alerts')}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  View Low Stock Alerts
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveTab('recommendations')}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Reorder Recommendations
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Low Stock Alerts</h3>
            {lowStockAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-slate-500">No low stock alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        alert.alertLevel === 'critical' ? 'bg-red-100' : 'bg-orange-100'
                      }`}>
                        {alert.alertLevel === 'critical' ? (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{alert.name}</p>
                        <p className="text-sm text-slate-600">SKU: {alert.sku}</p>
                        <p className="text-xs text-slate-500">
                          {alert.daysUntilStockout} days until stockout
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <Badge variant={alert.alertLevel === 'critical' ? 'error' : 'warning'} size="sm">
                          {alert.alertLevel.toUpperCase()}
                        </Badge>
                        <p className="text-sm font-medium text-slate-900 mt-1">
                          {alert.stockLevel} / {alert.minStock}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewProduct?.(alert.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onUpdateInventory?.(alert.id)}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Reorder Recommendations</h3>
            {reorderRecommendations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-slate-500">No reorder recommendations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reorderRecommendations.map((rec) => (
                  <div
                    key={rec.productId}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{rec.name}</p>
                        <p className="text-sm text-slate-600">SKU: {rec.sku}</p>
                        <p className="text-xs text-slate-500">
                          Avg daily usage: {rec.avgDailyUsage.toFixed(1)} units
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right space-y-2">
                        <Badge variant={getPriorityColor(rec.priority) as any} size="sm">
                          {rec.priority.toUpperCase()} PRIORITY
                        </Badge>
                        <div className="text-sm">
                          <p className="text-slate-600">Reorder in {rec.daysUntilReorder} days</p>
                          <p className="font-medium text-slate-900">
                            Order {rec.recommendedOrderQuantity} units
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewProduct?.(rec.productId)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onUpdateInventory?.(rec.productId)}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
