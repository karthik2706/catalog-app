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
import { Modal } from '@/components/ui/Modal'
import { cn, formatCurrency, debounce } from '@/lib/utils'
import { generateSignedUrl } from '@/lib/aws'
import { ImportExportModal } from '@/components/ui/ImportExportModal'
import { MediaPreview } from '@/components/ui/MediaPreview'
import SearchByImageModal from '@/components/SearchByImageModal'
import ProductTile from '@/components/ProductTile'
import InventoryManagementModal from '@/components/InventoryManagementModal'
import MediaManagementModal from '@/components/MediaManagementModal'
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Grid3X3,
  List,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react'
import { Product, ProductFilters } from '@/types'

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Helper function to get display URL for media
  const getMediaDisplayUrl = async (media: any): Promise<string | null> => {
    if (media.url) {
      return media.url
    }
    if (media.s3Key) {
      try {
        return await generateSignedUrl(media.s3Key, 7 * 24 * 60 * 60) // 7 days
      } catch (error) {
        console.error('Error generating signed URL:', error)
        return null
      }
    }
    return null
  }
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientCurrency, setClientCurrency] = useState<string>('USD')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(12)
  const [totalProducts, setTotalProducts] = useState(0)
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false)
  const [inventoryQuantity, setInventoryQuantity] = useState(0)
  const [inventoryType, setInventoryType] = useState('ADJUSTMENT')
  const [inventoryReason, setInventoryReason] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [importExportModalOpen, setImportExportModalOpen] = useState(false)
  const [searchByImageModalOpen, setSearchByImageModalOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [selectedProductForMedia, setSelectedProductForMedia] = useState<Product | null>(null)

  // Debounced search function
  const debouncedSearch = debounce(async (term: string) => {
    setPage(0)
    setSearchLoading(true)
    try {
      await fetchProducts(term)
    } finally {
      setSearchLoading(false)
    }
  }, 300)

  // Initial load effect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchProducts()
      fetchCategories()
      fetchClientCurrency()
    }
  }, [user, authLoading, router])

  // Pagination and filtering effects (separate from search)
  useEffect(() => {
    if (user && !authLoading) {
      fetchProducts(searchTerm)
    }
  }, [page, rowsPerPage, categoryFilter, sortBy, sortOrder])

  // Search effect (separate from pagination)
  useEffect(() => {
    if (user && !authLoading) {
      if (searchTerm !== '') {
        debouncedSearch(searchTerm)
      } else {
        setSearchLoading(true)
        fetchProducts('').finally(() => setSearchLoading(false))
      }
    }
  }, [searchTerm])

  // Note: Media URL generation is now handled by the ProductTile component

  const fetchProducts = async (searchQuery: string = searchTerm) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        search: searchQuery,
        category: categoryFilter,
        sortBy,
        sortOrder,
      })

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products')
      }

      console.log('Products data received:', data.products)
      console.log('First product media:', data.products[0]?.media)
      console.log('First product images:', data.products[0]?.images)
      console.log('First product thumbnailUrl:', data.products[0]?.thumbnailUrl)
      setProducts(data.products)
      setTotalProducts(data.pagination.total)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      await fetchProducts()
    } catch (error) {
      console.error('Error refreshing products:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      
      if (response.ok) {
        setCategories(data)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchClientCurrency = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok && data.client?.currency?.code) {
        setClientCurrency(data.client.currency.code)
      }
    } catch (err) {
      console.error('Error fetching client currency:', err)
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(0)
  }

  const handleInventoryUpdate = async () => {
    if (!selectedProduct) return

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: inventoryQuantity,
          type: inventoryType,
          reason: inventoryReason,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update inventory')
      }

      setInventoryModalOpen(false)
      setSelectedProduct(null)
      setInventoryQuantity(0)
      setInventoryReason('')
      fetchProducts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleImportProducts = async (productsToImport: Partial<Product>[], overwrite = false) => {
    try {
      const response = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ products: productsToImport, overwrite }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const error = new Error(errorData.error || 'Failed to import products')
        // Add duplicate SKUs to error object if present
        if (errorData.duplicateSKUs) {
          (error as any).duplicateSKUs = errorData.duplicateSKUs
        }
        throw error
      }

      // Refresh the products list
      fetchProducts()
    } catch (error) {
      throw error
    }
  }

  const handleSearchByImage = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('token')
    
    // Get tenant slug from JWT token
    let tenantSlug = 'enterprise' // Default fallback for SUPER_ADMIN
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.clientSlug) {
          tenantSlug = payload.clientSlug
        } else if (payload.role === 'SUPER_ADMIN') {
          // For SUPER_ADMIN, use a default tenant
          tenantSlug = 'enterprise'
        }
      } catch (e) {
        console.warn('Could not parse JWT token for tenant slug')
      }
    }
    
    const response = await fetch('/api/search/by-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-slug': tenantSlug,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Search failed')
    }

    const data = await response.json()
    return data.results || []
  }

  const getStockStatus = (product: Product) => {
    if (product.stockLevel <= 0) {
      return { label: 'Out of Stock', variant: 'error' as const, icon: XCircle }
    }
    if (product.stockLevel <= product.minStock) {
      return { label: 'Low Stock', variant: 'warning' as const, icon: AlertTriangle }
    }
    return { label: 'In Stock', variant: 'success' as const, icon: CheckCircle }
  }

  // Selection handling functions
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length && products.length > 0) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)))
    }
  }

  const isAllSelected = selectedProducts.size === products.length && products.length > 0
  const isPartiallySelected = selectedProducts.size > 0 && selectedProducts.size < products.length
  
  // Check if user has admin permissions for delete operations
  const canDeleteProducts = user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role)

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return

    setBulkDeleteLoading(true)
    try {
      const token = localStorage.getItem('token')
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
      setBulkDeleteModalOpen(false)
      fetchProducts()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBulkDeleteLoading(false)
    }
  }

  if (authLoading || (loading && products.length === 0)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading size="lg" text="Loading products..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="mb-6 sm:mb-0">
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="mt-2 text-slate-600">
              Manage your inventory and product catalog
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSearchByImageModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Search className="w-4 h-4 mr-2" />
              Search by Image
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setImportExportModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Import/Export
            </Button>
            <Button 
              onClick={() => router.push('/products/new')}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Input
                  placeholder="Search products by name, SKU, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                  </div>
                )}
              </div>

              {/* Category Filter */}
              <div className="w-full lg:w-64">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input w-full"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="w-full lg:w-48">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field)
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="input w-full"
                >
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-asc">Price Low-High</option>
                  <option value="price-desc">Price High-Low</option>
                  <option value="stockLevel-asc">Stock Low-High</option>
                  <option value="stockLevel-desc">Stock High-Low</option>
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selection Controls - Only show for admin users */}
        {canDeleteProducts && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = isPartiallySelected
                    }
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                />
                <label className="text-sm font-medium text-slate-700 cursor-pointer" onClick={handleSelectAll}>
                  Select All ({products.length} products)
                </label>
              </div>
              {selectedProducts.size > 0 && (
                <span className="text-sm text-slate-500">
                  {selectedProducts.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {selectedProducts.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProducts(new Set())}
                  className="text-slate-600 hover:text-slate-700"
                >
                  Clear selection
                </Button>
              )}
              {products.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-primary-600 border-primary-200 hover:bg-primary-50"
                >
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedProducts.size > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-primary-900">
                  {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {canDeleteProducts && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkDeleteModalOpen(true)}
                    className="text-error-600 border-error-200 hover:bg-error-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Permanently Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-error-600 mr-2" />
              <p className="text-error-800">{error}</p>
            </div>
          </div>
        )}

        {/* Products Grid/List */}
        {viewMode === 'grid' ? (
          <div className="relative mb-8">
            {searchLoading && (
              <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center">
                <div className="flex items-center space-x-2 text-primary-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                  <span className="text-sm font-medium">Searching...</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
              // Debug logging for VFJ-NK-0001
              if (product.sku === 'VFJ-NK-0001') {
                console.log('Products Page - Passing to ProductTile:', {
                  product: {
                    id: product.id,
                    sku: product.sku,
                    name: product.name,
                    thumbnailUrl: product.thumbnailUrl,
                    images: product.images,
                    videos: product.videos,
                    media: product.media
                  },
                  imagesType: typeof product.images,
                  imagesLength: product.images?.length,
                  firstImage: product.images?.[0],
                  firstImageType: typeof product.images?.[0]
                })
              }
              
              return (
                <div key={product.id} className="relative">
                  {canDeleteProducts && (
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                      />
                    </div>
                  )}
                  <ProductTile
                    product={product}
                    clientCurrency={clientCurrency}
                    onInventoryClick={(product) => {
                      setSelectedProduct(product)
                      setInventoryModalOpen(true)
                    }}
                  />
                </div>
              )
            })}
            </div>
          </div>
        ) : (
          <Card className="mb-8">
            <div className="relative">
              {searchLoading && (
                <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-primary-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                    <span className="text-sm font-medium">Searching...</span>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {canDeleteProducts && (
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(input) => {
                            if (input) {
                              input.indeterminate = isPartiallySelected
                            }
                          }}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                        />
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">SKU</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product)
                    const StatusIcon = stockStatus.icon
                    
                    return (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        {canDeleteProducts && (
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(product.id)}
                              onChange={() => handleSelectProduct(product.id)}
                              className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                            />
                          </td>
                        )}
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
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {formatCurrency(Number(product.price))}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              'text-sm font-medium',
                              product.stockLevel <= product.minStock ? 'text-warning-600' : 'text-slate-900'
                            )}>
                              {product.stockLevel}
                            </span>
                            <span className="text-xs text-slate-500">
                              / {product.minStock} min
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={stockStatus.variant} size="sm">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {stockStatus.label}
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
                            {canDeleteProducts && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(product)
                                  setInventoryModalOpen(true)
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {totalProducts > rowsPerPage && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-slate-600">
                  Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, totalProducts)} of {totalProducts} products
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="input w-20"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * rowsPerPage >= totalProducts}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Inventory Management Modal */}
        <InventoryManagementModal
          isOpen={inventoryModalOpen}
          onClose={() => {
            setInventoryModalOpen(false)
            setSelectedProduct(null)
          }}
          product={selectedProduct}
          onInventoryUpdate={fetchProducts}
        />

        {/* Enhanced Media Management Modal */}
        <MediaManagementModal
          isOpen={mediaModalOpen}
          onClose={() => {
            setMediaModalOpen(false)
            setSelectedProductForMedia(null)
          }}
          product={selectedProductForMedia}
          onMediaUpdate={fetchProducts}
        />

        {/* Import/Export Modal */}
        <ImportExportModal
          isOpen={importExportModalOpen}
          onClose={() => setImportExportModalOpen(false)}
          products={products}
          onImport={handleImportProducts}
          onExport={() => {}}
        />

        {/* Search by Image Modal */}
        <SearchByImageModal
          isOpen={searchByImageModalOpen}
          onClose={() => setSearchByImageModalOpen(false)}
          onSearch={handleSearchByImage}
        />

        {/* Bulk Delete Confirmation Modal */}
        <Modal
          isOpen={bulkDeleteModalOpen}
          onClose={() => setBulkDeleteModalOpen(false)}
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
                    This will remove all product data, media files, and inventory history. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-slate-900">Products to be deleted:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {products
                  .filter(product => selectedProducts.has(product.id))
                  .map(product => (
                    <div key={product.id} className="text-sm text-slate-600 flex items-center space-x-2">
                      <Package className="w-3 h-3" />
                      <span>{product.name} ({product.sku})</span>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={bulkDeleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="error"
                onClick={handleBulkDelete}
                disabled={bulkDeleteLoading}
              >
                {bulkDeleteLoading ? (
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
    </DashboardLayout>
  )
}