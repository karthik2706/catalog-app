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
import MediaSelectorModal from '@/components/MediaSelectorModal'
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
  Image as ImageIcon,
  Video,
  Star
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
    allowPreorder: false,
    path: '', // S3 path for uploaded asset
  })

  // Media selector modal state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<any[]>([])

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





  const handleRemoveMedia = (mediaId: string) => {
    setSelectedMedia(prev => prev.filter(media => media.id !== mediaId))
  }

  const handleSetThumbnail = (mediaId: string) => {
    // For now, we'll just track which media is selected as thumbnail
    // The actual thumbnail assignment will happen during product creation
    setSelectedMedia(prev => prev.map(media => ({
      ...media,
      isPrimary: media.id === mediaId
    })))
  }

  // Media selector modal handlers
  const handleOpenMediaModal = () => {
    setIsMediaModalOpen(true)
  }

  const handleCloseMediaModal = () => {
    setIsMediaModalOpen(false)
  }

  const handleMediaSelect = (assets: any[]) => {
    setSelectedMedia(assets)
    setIsMediaModalOpen(false)
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

      // Step 1: Create the product first (without media assignment)
      const productResponse = await fetch('/api/products', {
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
          // Don't include media in product creation - will be assigned separately
        }),
      })

      if (!productResponse.ok) {
        const errorData = await productResponse.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const productData = await productResponse.json()
      const newProductId = productData.id

      // Step 2: Assign selected media to the newly created product
      if (selectedMedia.length > 0) {
        try {
          const mediaResponse = await fetch('/api/media/assign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              mediaIds: selectedMedia.map(media => media.id),
              productId: newProductId,
              isPrimary: false // We'll handle primary selection separately
            })
          })

          if (!mediaResponse.ok) {
            console.warn('Failed to assign media to product, but product was created successfully')
            // Don't throw error here - product creation was successful
          } else {
            // Set primary thumbnail if one is selected
            const primaryMedia = selectedMedia.find(media => media.isPrimary)
            if (primaryMedia) {
              await fetch('/api/media/assign', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                  mediaIds: [primaryMedia.id],
                  productId: newProductId,
                  isPrimary: true
                })
              })
            } else {
              // If no primary is selected, set the first image as primary
              const firstImage = selectedMedia.find(media => media.kind === 'image')
              if (firstImage) {
                await fetch('/api/media/assign', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  },
                  body: JSON.stringify({
                    mediaIds: [firstImage.id],
                    productId: newProductId,
                    isPrimary: true
                  })
                })
              }
            }
          }
        } catch (mediaError) {
          console.warn('Error assigning media to product:', mediaError)
          // Don't throw error here - product creation was successful
        }
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
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">Create New Product</h1>
                    <p className="text-slate-600 mt-1">Add a new product to your inventory</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/products')}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <Loading className="w-4 h-4" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Create Product</span>
                      </>
                    )}
                  </Button>
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
                              placeholder="Enter unique product identifier"
                              value={formData.sku}
                              onChange={(e) => handleInputChange('sku', e.target.value)}
                              className="w-full"
                            />
                            <p className="text-xs text-slate-500">Enter a unique SKU for this product</p>
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

                        <FadeIn delay={0.45}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <Package className="w-4 h-4" />
                              <span>Allow Preorders</span>
                            </label>
                            <select
                              value={formData.allowPreorder ? 'true' : 'false'}
                              onChange={(e) => handleInputChange('allowPreorder', e.target.value === 'true')}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="false">No</option>
                              <option value="true">Yes</option>
                            </select>
                            <p className="text-xs text-slate-500">Allow customers to preorder when out of stock</p>
                          </div>
                        </FadeIn>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                            <Package className="w-8 h-8 text-slate-400" />
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


                  {/* Media Selection */}
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
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-slate-600 mb-4">
                            Select images and videos from your media library for this product
                          </p>
                        </div>

                        {/* Media Selection Button */}
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-slate-900 mb-2">Select Media Files</h3>
                              <p className="text-sm text-slate-600 mb-4">
                                Choose from your existing media library or upload new files
                              </p>
                              <Button
                                onClick={handleOpenMediaModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Select Media
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Selected Media Preview */}
                        {selectedMedia.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-slate-900 mb-3">
                              Selected Media ({selectedMedia.length} file{selectedMedia.length !== 1 ? 's' : ''})
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {selectedMedia.map((media) => (
                                <div key={media.id} className="relative group">
                                  <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                                    {media.kind === 'image' ? (
                                      <img
                                        src={media.thumbnailUrl || media.url}
                                        alt={media.altText || media.originalName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : media.kind === 'video' ? (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                        <Video className="w-8 h-8 text-slate-600" />
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                        <FileText className="w-8 h-8 text-slate-600" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="w-6 h-6 p-0 bg-white/80 hover:bg-white"
                                      onClick={() => handleRemoveMedia(media.id)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="mt-1">
                                    <p className="text-xs text-slate-600 truncate">
                                      {media.originalName}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <Badge variant="outline" className="text-xs">
                                        {media.kind}
                                      </Badge>
                                      {media.kind === 'image' && (
                                        <Button
                                          size="sm"
                                          variant={media.isPrimary ? "default" : "outline"}
                                          className="w-6 h-6 p-0"
                                          onClick={() => handleSetThumbnail(media.id)}
                                        >
                                          <Star className={`w-3 h-3 ${media.isPrimary ? 'text-white' : 'text-slate-600'}`} />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
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

        {/* Media Selector Modal */}
        <MediaSelectorModal
          isOpen={isMediaModalOpen}
          onClose={handleCloseMediaModal}
          onSelect={handleMediaSelect}
          productName={formData.name || 'New Product'}
          currentMedia={selectedMedia}
        />
      </div>
    </DashboardLayout>
  )
}
