'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Badge } from './ui/Badge'
import { Loading } from './ui/Loading'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  History,
  Bell
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  stockLevel: number
  minStock: number
  price: number
}

interface InventoryHistory {
  id: string
  quantity: number
  type: string
  reason?: string
  createdAt: string
  user?: {
    name: string
    email: string
  }
}

interface InventoryManagementModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onInventoryUpdate: () => void
}

export default function InventoryManagementModal({ 
  isOpen, 
  onClose, 
  product, 
  onInventoryUpdate 
}: InventoryManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'update' | 'history' | 'analytics'>('update')
  const [loading, setLoading] = useState(false)
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  
  // Update form state
  const [quantity, setQuantity] = useState(0)
  const [type, setType] = useState('ADJUSTMENT')
  const [reason, setReason] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalMovements: 0,
    averageMovement: 0,
    lastMovement: null as string | null,
    stockTrend: 'stable' as 'up' | 'down' | 'stable'
  })

  useEffect(() => {
    if (isOpen && product) {
      fetchInventoryHistory()
      fetchAnalytics()
      resetForm()
    }
  }, [isOpen, product])

  const resetForm = () => {
    setQuantity(0)
    setType('ADJUSTMENT')
    setReason('')
    setShowPreview(false)
  }

  const fetchInventoryHistory = async () => {
    if (!product) return
    
    setHistoryLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/inventory?productId=${product.id}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setInventoryHistory(data.inventoryHistory || [])
      }
    } catch (error) {
      console.error('Error fetching inventory history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    if (!product) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/inventory/analytics?productId=${product.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const handleInventoryUpdate = async () => {
    if (!product || quantity === 0) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          type,
          reason,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update inventory')
      }

      // Refresh data
      await Promise.all([fetchInventoryHistory(), fetchAnalytics()])
      onInventoryUpdate()
      resetForm()
      
      // Show success message
      setShowPreview(false)
    } catch (error: any) {
      console.error('Error updating inventory:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= 0) return { status: 'out', color: 'error', icon: AlertTriangle }
    if (stock <= minStock) return { status: 'low', color: 'warning', icon: AlertTriangle }
    if (stock <= minStock * 2) return { status: 'medium', color: 'default', icon: Clock }
    return { status: 'good', color: 'success', icon: CheckCircle }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
      case 'RETURN':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'SALE':
      case 'DAMAGE':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Package className="w-4 h-4 text-blue-600" />
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'PURCHASE':
      case 'RETURN':
        return 'text-green-600 bg-green-50'
      case 'SALE':
      case 'DAMAGE':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  if (!product) return null

  const stockStatus = getStockStatus(product.stockLevel, product.minStock)
  const newStockLevel = product.stockLevel + quantity

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Inventory Management - ${product.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Product Info Header */}
        <div className="p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{product.name}</h3>
              <p className="text-sm text-slate-600">SKU: {product.sku}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <stockStatus.icon className="w-5 h-5" />
                <Badge variant={stockStatus.color as any} size="sm">
                  {stockStatus.status.toUpperCase()} STOCK
                </Badge>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {product.stockLevel}
              </p>
              <p className="text-sm text-slate-500">Min: {product.minStock}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('update')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'update'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Update Stock
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            History
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </div>

        {/* Update Stock Tab */}
        {activeTab === 'update' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Quantity Change"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="Enter quantity change"
                  helpText="Positive for additions, negative for reductions"
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Movement Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="input w-full"
                  >
                    <option value="PURCHASE">Purchase (Stock In)</option>
                    <option value="SALE">Sale (Stock Out)</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                    <option value="RETURN">Return (Stock In)</option>
                    <option value="DAMAGE">Damage (Stock Out)</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>

                <Input
                  label="Reason (Optional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for inventory change"
                />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="font-medium text-slate-900 mb-3">Preview</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Current Stock:</span>
                      <span className="font-medium">{product.stockLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Change:</span>
                      <span className={`font-medium ${quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {quantity >= 0 ? '+' : ''}{quantity}
                      </span>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-900">New Stock:</span>
                      <span className={`font-bold ${newStockLevel < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {newStockLevel}
                      </span>
                    </div>
                    {newStockLevel < 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">
                          ⚠️ This will result in negative stock
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleInventoryUpdate}
                    disabled={loading || quantity === 0}
                    className="flex-1"
                  >
                    {loading ? <Loading size="sm" /> : 'Update Inventory'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loading />
              </div>
            ) : inventoryHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No inventory history found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inventoryHistory.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getMovementColor(record.type)}`}>
                        {getMovementIcon(record.type)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {record.type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-slate-600">
                          {record.reason || 'No reason provided'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {record.user?.name || 'System'} • {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${record.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {record.quantity >= 0 ? '+' : ''}{record.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Total Movements</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-2">
                  {analytics.totalMovements}
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Avg Movement</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {analytics.averageMovement.toFixed(1)}
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Last Movement</span>
                </div>
                <p className="text-sm font-bold text-purple-900 mt-2">
                  {analytics.lastMovement ? new Date(analytics.lastMovement).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <h4 className="font-medium text-slate-900 mb-3">Stock Trend Analysis</h4>
              <div className="flex items-center space-x-2">
                {analytics.stockTrend === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
                {analytics.stockTrend === 'down' && <TrendingDown className="w-5 h-5 text-red-600" />}
                {analytics.stockTrend === 'stable' && <Package className="w-5 h-5 text-blue-600" />}
                <span className="text-sm text-slate-600">
                  Stock trend is {analytics.stockTrend}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
