'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { ProductVariation } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { FadeIn, StaggerWrapper } from '@/components/ui/AnimatedWrapper'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { MediaUploadNew as MediaUpload, MediaFile } from '@/components/ui/MediaUploadNew'
import { MediaGrid } from '@/components/ui/MediaPreview'
import { formatCurrency, getCurrencyIcon } from '@/lib/utils'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  Package, 
  DollarSign, 
  Hash, 
  FileText, 
  Tag, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Palette,
  Ruler,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react'

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [variations, setVariations] = useState<ProductVariation[]>([])
  const [newVariation, setNewVariation] = useState({ name: '', value: '', priceAdjustment: 0 })
  const [variationModalOpen, setVariationModalOpen] = useState(false)
  const [categories, setCategories] = useState<Array<{id: string, name: string, parentId?: string, children?: any[]}>>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [clientCurrency, setClientCurrency] = useState<string>('USD')

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: 0,
    category: '',
    categoryIds: [] as string[],
    stockLevel: 0,
    minStock: 0,
    isActive: true,
  })

  // Media upload state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [images, setImages] = useState<MediaFile[]>([])
  const [videos, setVideos] = useState<MediaFile[]>([])
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('')

  // Load categories and currency on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch('/api/categories', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        } else {
          console.error('Failed to load categories:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setCategoriesLoading(false)
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

    loadCategories()
    fetchClientCurrency()
  }, [])


  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Media handling functions
  const handleMediaUpload = (files: MediaFile[]) => {
    setMediaFiles(files)
    
    // Separate images and videos
    const imageFiles = files.filter(file => file.file.type.startsWith('image/'))
    const videoFiles = files.filter(file => file.file.type.startsWith('video/'))
    
    setImages(imageFiles)
    setVideos(videoFiles)
    
    // Set first image as thumbnail if no thumbnail is selected
    if (!thumbnailUrl && imageFiles.length > 0) {
      setThumbnailUrl(imageFiles[0].url || imageFiles[0].preview)
    }
  }

  const handleRemoveMedia = (fileId: string) => {
    const updatedFiles = mediaFiles.filter(file => file.id !== fileId)
    setMediaFiles(updatedFiles)
    
    // Update images and videos arrays
    const imageFiles = updatedFiles.filter(file => file.file.type.startsWith('image/'))
    const videoFiles = updatedFiles.filter(file => file.file.type.startsWith('video/'))
    
    setImages(imageFiles)
    setVideos(videoFiles)
    
    // If removed file was thumbnail, set new thumbnail
    if (thumbnailUrl && updatedFiles.length > 0) {
      const firstImage = imageFiles.find(file => file.url === thumbnailUrl)
      if (!firstImage && imageFiles.length > 0) {
        setThumbnailUrl(imageFiles[0].url || imageFiles[0].preview)
      }
    }
  }

  const handleSetThumbnail = (url: string) => {
    setThumbnailUrl(url)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Validate required fields
      if (!formData.name || !formData.sku || !formData.price || formData.categoryIds.length === 0) {
        setError('Please fill in all required fields: Name, SKU, Price, and at least one Category')
        return
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryIds[0], // Send first selected category as categoryId
          categoryIds: formData.categoryIds, // Keep categoryIds for multiple categories
          variations,
          images: images.filter(img => img.uploaded).map(img => ({
            id: img.id,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            key: img.key,
            fileName: img.file.name,
            fileSize: img.file.size,
            fileType: img.file.type,
            uploadedAt: new Date(),
          })),
          videos: videos.filter(vid => vid.uploaded).map(vid => ({
            id: vid.id,
            url: vid.url,
            thumbnailUrl: vid.thumbnailUrl,
            key: vid.key,
            fileName: vid.file.name,
            fileSize: vid.file.size,
            fileType: vid.file.type,
            uploadedAt: new Date(),
          })),
          thumbnailUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      setSuccess('Product created successfully!')
      setTimeout(() => {
        router.push('/products')
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddVariation = () => {
    if (newVariation.name && newVariation.value) {
      const variation: ProductVariation = {
        id: Date.now().toString(),
        name: newVariation.name,
        value: newVariation.value,
        priceAdjustment: newVariation.priceAdjustment,
      }
      setVariations(prev => [...prev, variation])
      setNewVariation({ name: '', value: '', priceAdjustment: 0 })
      setVariationModalOpen(false)
    }
  }

  const handleRemoveVariation = (id: string) => {
    setVariations(prev => prev.filter(v => v.id !== id))
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FadeIn>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/products')}
                  className="flex items-center space-x-2 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Products</span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Create New Product</h1>
                  <p className="text-slate-600 mt-1">Add a new product to your inventory</p>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <StaggerWrapper>
                  {/* Basic Information */}
                  <Card className="mb-8">
                    <div className="p-6 border-b border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">Basic Information</h2>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FadeIn delay={0.1}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <span>Product Name</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              placeholder="Enter the product name"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </FadeIn>

                        <FadeIn delay={0.2}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <Hash className="w-4 h-4" />
                              <span>SKU</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              placeholder="Unique product identifier"
                              value={formData.sku}
                              onChange={(e) => handleInputChange('sku', e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </FadeIn>
                      </div>

                      <FadeIn delay={0.3}>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Description</label>
                          <textarea
                            placeholder="Product description and details"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          />
                        </div>
                      </FadeIn>
                    </div>
                  </Card>

                  {/* Pricing & Inventory */}
                  <Card className="mb-8">
                    <div className="p-6 border-b border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          {React.createElement(getCurrencyIcon(clientCurrency), { className: "w-4 h-4 text-green-600" })}
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">Pricing & Inventory</h2>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FadeIn delay={0.1}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              {React.createElement(getCurrencyIcon(clientCurrency), { className: "w-4 h-4" })}
                              <span>Price</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                                className="w-full pl-8"
                                step="0.01"
                                min="0"
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                                {clientCurrency === 'INR' ? '₹' : '$'}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">Product price in {clientCurrency}</p>
                          </div>
                        </FadeIn>


                        <FadeIn delay={0.3}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <BarChart3 className="w-4 h-4" />
                              <span>Stock Level</span>
                            </label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={formData.stockLevel}
                              onChange={(e) => handleInputChange('stockLevel', parseInt(e.target.value) || 0)}
                              className="w-full"
                              min="0"
                            />
                            <p className="text-xs text-slate-500">Current stock quantity</p>
                          </div>
                        </FadeIn>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <FadeIn delay={0.4}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Minimum Stock</span>
                            </label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={formData.minStock}
                              onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
                              className="w-full"
                              min="0"
                            />
                            <p className="text-xs text-slate-500">Minimum stock before reorder alert</p>
                          </div>
                        </FadeIn>

                        <FadeIn delay={0.5}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <Settings className="w-4 h-4" />
                              <span>Status</span>
                            </label>
                            <select
                              value={formData.isActive ? 'true' : 'false'}
                              onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </div>
                        </FadeIn>
                      </div>
                    </div>
                  </Card>

                  {/* Product Variations */}
                  <Card className="mb-8">
                    <div className="p-6 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Palette className="w-4 h-4 text-purple-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-slate-900">Product Variations</h2>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setVariationModalOpen(true)}
                          className="flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Variation</span>
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">
                      {variations.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {variations.map((variation) => (
                            <Badge
                              key={variation.id}
                              variant="secondary"
                              className="flex items-center space-x-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-full"
                            >
                              <span>{variation.name}: {variation.value}</span>
                              {variation.priceAdjustment !== 0 && (
                                <span className="text-xs">
                                  ({variation.priceAdjustment > 0 ? '+' : ''}{clientCurrency === 'INR' ? '₹' : '$'}{variation.priceAdjustment})
                                </span>
                              )}
                              <button
                                onClick={() => handleRemoveVariation(variation.id)}
                                className="ml-2 hover:bg-slate-200 rounded-full p-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 mb-4">No variations added yet</p>
                          <p className="text-sm text-slate-400">Click "Add Variation" to add colors, sizes, materials, etc.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </StaggerWrapper>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  {/* Categories Section */}
                  <Card className="mb-6">
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Tag className="w-4 h-4 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Categories</h3>
                        <span className="text-red-500">*</span>
                      </div>
                      <CategorySelect
                        categories={categories}
                        selectedIds={formData.categoryIds}
                        onSelectionChange={(selectedIds) => {
                          setFormData(prev => ({
                            ...prev,
                            categoryIds: selectedIds
                          }))
                        }}
                        placeholder="Add a category"
                        disabled={categories.length === 0}
                        loading={categoriesLoading}
                      />
                      {formData.categoryIds.length === 0 && !categoriesLoading && (
                        <p className="text-sm text-slate-500 mt-2">
                          {categories.length === 0 
                            ? 'No categories available. Please contact your administrator to create categories.'
                            : 'Select at least one category for this product'
                          }
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card className="mb-6">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          onClick={() => router.push('/products')}
                          className="w-full justify-start"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="w-full"
                        >
                          {saving ? (
                            <>
                              <Loading className="w-4 h-4 mr-2" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Create Product
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Media Upload */}
                  <Card className="mb-8">
                    <div className="p-6 border-b border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">Product Media</h2>
                      </div>
                    </div>
                    <div className="p-6">
                      <MediaUpload
                        onFilesChange={handleMediaUpload}
                        files={mediaFiles}
                        sku={formData.sku || 'temp-sku'}
                        maxFiles={10}
                        acceptedTypes={['image/*', 'video/*']}
                        maxSize={50 * 1024 * 1024} // 50MB
                        className="mb-6"
                      />
                      
                      {/* Media Preview */}
                      {mediaFiles.length > 0 && (
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-slate-700 mb-3">Uploaded Media</h3>
                            <MediaGrid
                              files={mediaFiles}
                              onRemove={(fileId) => setMediaFiles(prev => prev.filter(f => f.id !== fileId))}
                              size="md"
                            />
                          </div>
                          
                          {/* Thumbnail Selection */}
                          {images.length > 0 && (
                            <div>
                              <h3 className="text-sm font-medium text-slate-700 mb-3">Select Thumbnail</h3>
                              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                                {images.map((image) => (
                                  <button
                                    key={image.id}
                                    onClick={() => handleSetThumbnail(image.url || image.preview)}
                                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                                      thumbnailUrl === (image.url || image.preview)
                                        ? 'border-primary-500 ring-2 ring-primary-200'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    <img
                                      src={image.url || image.preview}
                                      alt={image.file.name}
                                      className="w-full h-20 object-cover"
                                    />
                                    {thumbnailUrl === (image.url || image.preview) && (
                                      <div className="absolute inset-0 bg-primary-500 bg-opacity-20 flex items-center justify-center">
                                        <CheckCircle className="w-6 h-6 text-primary-600" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Form Progress</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${formData.name ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <span className="text-sm text-slate-600">Product Name</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${formData.sku ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <span className="text-sm text-slate-600">SKU</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${formData.price > 0 ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <span className="text-sm text-slate-600">Price</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${formData.categoryIds.length > 0 ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <span className="text-sm text-slate-600">Categories</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Add Variation Modal */}
        <Modal
          isOpen={variationModalOpen}
          onClose={() => setVariationModalOpen(false)}
          title="Add Product Variation"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Variation Name</label>
              <Input
                placeholder="e.g., Color, Size, Material"
                value={newVariation.name}
                onChange={(e) => setNewVariation(prev => ({ ...prev, name: e.target.value }))}
              />
              <p className="text-xs text-slate-500">Type of variation (e.g., Color, Size, Material)</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Variation Value</label>
              <Input
                placeholder="e.g., Red, Large, Cotton"
                value={newVariation.value}
                onChange={(e) => setNewVariation(prev => ({ ...prev, value: e.target.value }))}
              />
              <p className="text-xs text-slate-500">Specific value for this variation</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Price Adjustment</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newVariation.priceAdjustment}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, priceAdjustment: parseFloat(e.target.value) || 0 }))}
                  className="pl-8"
                  step="0.01"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  {clientCurrency === 'INR' ? '₹' : '$'}
                </div>
              </div>
              <p className="text-xs text-slate-500">Additional cost for this variation (can be negative for discounts)</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setVariationModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddVariation}
                disabled={!newVariation.name || !newVariation.value}
              >
                Add Variation
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
