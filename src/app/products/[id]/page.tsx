'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Product } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { FadeIn, StaggerWrapper } from '@/components/ui/AnimatedWrapper'
import { formatCurrency, getCurrencyIcon } from '@/lib/utils'
import { refreshMediaUrls } from '@/lib/aws'
import {
  ArrowLeft,
  Edit3,
  Package,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Hash,
  Tag,
  FileText,
  Layers,
  AlertTriangle,
  CheckCircle,
  Calendar,
  User,
  Image as ImageIcon,
  Video,
  Play,
  Eye,
  Download,
  Share2,
  MoreVertical,
} from 'lucide-react'

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productId, setProductId] = useState<string>('')
  const [clientCurrency, setClientCurrency] = useState<string>('USD')
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setProductId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && productId) {
      fetchProduct()
      fetchClientCurrency()
    }
  }, [user, authLoading, router, productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product')
      }

      // Refresh media URLs to use signed URLs
      if (data.media && data.media.length > 0) {
        try {
          const refreshedMedia = await refreshMediaUrls(data.media)
          data.media = refreshedMedia
        } catch (error) {
          console.error('Error refreshing media URLs:', error)
          // Continue with original media if refresh fails
        }
      }
      
      setProduct(data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
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

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-error-50 border border-error-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-error-600 mr-3" />
                <p className="text-error-800">Product not found</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const totalValue = Number(product.price) * product.stockLevel
  const isLowStock = product.stockLevel <= product.minStock
  const mediaFiles = Array.isArray(product.media) ? product.media : []

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="p-4 sm:p-6 lg:p-8">
          <FadeIn>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/products')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Products</span>
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 flex items-center space-x-3">
                    <Package className="w-8 h-8 text-primary-600" />
                    <span>{product.name}</span>
                  </h1>
                  <p className="mt-2 text-slate-600">
                    Product details and inventory information
                  </p>
                </div>
                
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/products/${product.id}/edit`)}
                    className="flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Product</span>
                  </Button>
                  <Button
                    onClick={() => {
                      // This would open inventory update dialog
                      alert('Inventory update feature coming soon!')
                    }}
                    className="flex items-center space-x-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Update Inventory</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 bg-error-50 border border-error-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-error-600 mr-3" />
                  <p className="text-error-800">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <StaggerWrapper>
                  {/* Product Media */}
                  <FadeIn delay={0.1}>
                    <Card className="card-hover">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <ImageIcon className="w-5 h-5 text-blue-600" />
                          <span>Product Media ({mediaFiles.length})</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Main Media Display */}
                          <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
                            {mediaFiles.length > 0 && mediaFiles[selectedMediaIndex] ? (
                              (() => {
                                const media = mediaFiles[selectedMediaIndex]
                                const isVideo = media.type?.startsWith('video/')
                                const displayUrl = media.thumbnailUrl || media.url
                                
                                if (isVideo) {
                                  return (
                                    <video
                                      src={media.url}
                                      className="w-full h-full object-cover"
                                      controls
                                      onError={(e) => {
                                        console.error('Video load error:', e)
                                        console.error('Video URL:', media.url)
                                      }}
                                    />
                                  )
                                } else {
                                  return (
                                    <img
                                      src={displayUrl}
                                      alt="Product media"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.error('Image load error:', e)
                                        console.error('Image URL:', displayUrl)
                                      }}
                                    />
                                  )
                                }
                              })()
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                  <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-2" />
                                  <p className="text-slate-500">No media uploaded</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Media Thumbnails */}
                          {mediaFiles.length > 1 && (
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                              {mediaFiles.map((media, index) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedMediaIndex(index)}
                                  className={`aspect-square bg-slate-100 rounded-lg overflow-hidden border-2 transition-all ${
                                    selectedMediaIndex === index
                                      ? 'border-primary-500 ring-2 ring-primary-200'
                                      : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {(() => {
                                    const isVideo = media.type?.startsWith('video/')
                                    
                                    if (isVideo) {
                                      // For videos, show a video icon instead of trying to display the video file
                                      return (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                          <div className="text-center">
                                            <Video className="w-8 h-8 text-slate-500 mx-auto mb-1" />
                                            <span className="text-xs text-slate-600">Video</span>
                                          </div>
                                        </div>
                                      )
                                    } else if (media.thumbnailUrl) {
                                      // For images, show thumbnail
                                      return (
                                        <img
                                          src={media.thumbnailUrl}
                                          alt={`Media ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      )
                                    } else if (media.url) {
                                      // Fallback to original image
                                      return (
                                        <img
                                          src={media.url}
                                          alt={`Media ${index + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      )
                                    } else {
                                      // No media
                                      return (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <ImageIcon className="w-6 h-6 text-slate-400" />
                                        </div>
                                      )
                                    }
                                  })()}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </FadeIn>

                  {/* Product Information */}
                  <FadeIn delay={0.2}>
                    <Card className="card-hover">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-primary-600" />
                          <span>Product Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                              <Hash className="w-4 h-4" />
                              <span>SKU</span>
                            </label>
                            <p className="text-lg font-mono bg-slate-100 px-3 py-2 rounded-lg">
                              {product.sku}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                              <Tag className="w-4 h-4" />
                              <span>Category</span>
                            </label>
                            <Badge variant="secondary" className="text-sm">
                              {product.category}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                              {React.createElement(getCurrencyIcon(clientCurrency), { className: "w-4 h-4" })}
                              <span>Price</span>
                            </label>
                            <p className="text-2xl font-bold text-success-600">
                              {formatCurrency(Number(product.price), clientCurrency)}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Status</label>
                            <Badge
                              variant={product.isActive ? 'success' : 'secondary'}
                              className="text-sm"
                            >
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        
                        {product.description && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>Description</span>
                            </label>
                            <p className="text-slate-700 leading-relaxed">
                              {product.description}
                            </p>
                          </div>
                        )}

                        {/* Product Variations */}
                        {product.variations && product.variations.length > 0 && (
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                              <Layers className="w-4 h-4" />
                              <span>Product Variations</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {product.variations.map((variation, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="px-3 py-2"
                                >
                                  {variation.name}: {variation.value}
                                  {variation.priceAdjustment ? 
                                    ` (+${formatCurrency(variation.priceAdjustment, clientCurrency)})` : ''
                                  }
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </FadeIn>

                  {/* Inventory History */}
                  <FadeIn delay={0.3}>
                    <Card className="card-hover">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <BarChart3 className="w-5 h-5 text-purple-600" />
                          <span>Recent Inventory History</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {product.inventoryHistory && product.inventoryHistory.length > 0 ? (
                          <div className="space-y-4">
                            {product.inventoryHistory.map((history) => (
                              <div
                                key={history.id}
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-4">
                                  <div className={`p-2 rounded-full ${
                                    history.quantity > 0 
                                      ? 'bg-success-100 text-success-600' 
                                      : 'bg-error-100 text-error-600'
                                  }`}>
                                    {history.quantity > 0 ? (
                                      <TrendingUp className="w-4 h-4" />
                                    ) : (
                                      <TrendingDown className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {history.quantity > 0 ? '+' : ''}{history.quantity} units
                                    </p>
                                    <p className="text-sm text-slate-600">
                                      {history.reason || 'No reason provided'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-slate-600 flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(history.createdAt).toLocaleDateString()}</span>
                                  </p>
                                  <p className="text-sm text-slate-500 flex items-center space-x-1">
                                    <User className="w-3 h-3" />
                                    <span>{history.user?.name || 'System'}</span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-500">
                            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No inventory history available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </FadeIn>
                </StaggerWrapper>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Stock Information */}
                <FadeIn delay={0.1}>
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-success-600" />
                        <span>Stock Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-700 mb-2">Current Stock</p>
                        <p className={`text-4xl font-bold ${
                          isLowStock ? 'text-error-600' : 'text-success-600'
                        }`}>
                          {product.stockLevel}
                        </p>
                        <p className="text-sm text-slate-500">units available</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">Minimum Stock</span>
                          <span className="text-lg font-semibold">{product.minStock}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">Stock Status</span>
                          <Badge
                            variant={isLowStock ? 'warning' : 'success'}
                            className="text-sm"
                          >
                            {isLowStock ? 'Low Stock' : 'In Stock'}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">Total Value</span>
                          <span className="text-lg font-bold text-primary-600">
                            {formatCurrency(totalValue, clientCurrency)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Quick Actions */}
                <FadeIn delay={0.2}>
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MoreVertical className="w-5 h-5 text-blue-600" />
                        <span>Quick Actions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={() => router.push(`/products/${product.id}/edit`)}
                        className="w-full justify-start"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Product
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          alert('Inventory update feature coming soon!')
                        }}
                        className="w-full justify-start"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Update Inventory
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/products')}
                        className="w-full justify-start"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Products
                      </Button>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Product Stats */}
                <FadeIn delay={0.3}>
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <span>Product Stats</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">Created</span>
                        <span className="text-sm text-slate-600">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">Last Updated</span>
                        <span className="text-sm text-slate-600">
                          {new Date(product.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">Media Files</span>
                        <span className="text-sm text-slate-600">
                          {mediaFiles.length} files
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </DashboardLayout>
  )
}
