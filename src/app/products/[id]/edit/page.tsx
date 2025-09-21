'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Product, ProductVariation } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { FadeIn, StaggerWrapper } from '@/components/ui/AnimatedWrapper'
import { CategorySelect } from '@/components/ui/CategorySelect'
import { MediaUploadPresigned as MediaUpload, MediaFile } from '@/components/ui/MediaUploadPresigned'
import { formatCurrency, getCurrencyIcon } from '@/lib/utils'
import {
  ArrowLeft,
  Save,
  Trash2,
  Package,
  DollarSign,
  BarChart3,
  Settings,
  Plus,
  X,
  Edit3,
  AlertTriangle,
  CheckCircle,
  Tag,
  Hash,
  FileText,
  Layers,
  TrendingUp,
  Shield,
} from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  children?: Category[]
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [variations, setVariations] = useState<ProductVariation[]>([])
  const [newVariation, setNewVariation] = useState({ name: '', value: '', priceAdjustment: 0 })
  const [variationModalOpen, setVariationModalOpen] = useState(false)
  const [productId, setProductId] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [clientCurrency, setClientCurrency] = useState<string>('USD')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)


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
      fetchCategories()
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

      setProduct(data)
      setFormData({
        name: data.name,
        sku: data.sku,
        description: data.description || '',
        price: data.price,
        category: data.category,
        categoryIds: data.categories?.map((pc: any) => pc.category.id) || [],
        stockLevel: data.stockLevel,
        minStock: data.minStock,
        isActive: data.isActive,
      })
      setVariations(data.variations || [])
      
      // Load existing media files
      const existingImages = data.images || []
      const existingVideos = data.videos || []
      const allExistingMedia = [...existingImages, ...existingVideos]
      
      if (allExistingMedia.length > 0) {
        const existingMedia: MediaFile[] = allExistingMedia.map((media: any, index: number) => {
          // Determine file type from URL or file name
          let fileType = 'image/jpeg' // default
          if (media.fileType) {
            fileType = media.fileType
          } else if (media.fileName) {
            const extension = media.fileName.split('.').pop()?.toLowerCase()
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
              fileType = 'image/jpeg'
            } else if (['mp4', 'webm', 'mov'].includes(extension || '')) {
              fileType = 'video/mp4'
            }
          } else if (media.url) {
            // Try to determine type from URL
            const urlExtension = media.url.split('.').pop()?.toLowerCase()
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(urlExtension || '')) {
              fileType = 'image/jpeg'
            } else if (['mp4', 'webm', 'mov'].includes(urlExtension || '')) {
              fileType = 'video/mp4'
            }
          }
          
          console.log('Loading existing media:', {
            fileName: media.fileName,
            fileType: media.fileType,
            url: media.url,
            detectedType: fileType
          })
          
          // Create a proper File object for existing media
          const fileBlob = new Blob([''], { type: fileType })
          const file = new File([fileBlob], media.fileName || 'existing-file', { 
            type: fileType,
            lastModified: Date.now()
          })
          
          return {
            id: `existing-${index}`,
            file: file,
            preview: media.url,
            url: media.url,
            thumbnailUrl: media.thumbnailUrl,
            key: media.key,
            progress: 100,
            uploading: false,
            uploaded: true,
          }
        })
        setMediaFiles(existingMedia)
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setCategories(data)
      } else {
        console.error('Failed to load categories:', response.status, response.statusText)
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



  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Check if there are any files still uploading
      const uploadingFiles = mediaFiles.filter(f => f.uploading)
      if (uploadingFiles.length > 0) {
        setError(`Please wait for ${uploadingFiles.length} file(s) to finish uploading before saving.`)
        setSaving(false)
        return
      }

      // Check if there are any files with errors
      const errorFiles = mediaFiles.filter(f => f.error)
      if (errorFiles.length > 0) {
        setError(`Please fix upload errors for ${errorFiles.length} file(s) before saving.`)
        setSaving(false)
        return
      }

      // Debug: Log media files before saving
      console.log('Media files before save:', mediaFiles)
      console.log('Media files details:', mediaFiles.map(f => ({
        id: f.id,
        name: f.file?.name,
        type: f.file?.type,
        uploaded: f.uploaded,
        url: f.url,
        hasUrl: !!f.url
      })))
      
      const uploadedImages = mediaFiles.filter(file => {
        const fileType = file.file?.type || ''
        const isImage = fileType.startsWith('image/') && file.uploaded
        console.log('Image check for', file.file?.name, ':', { fileType, uploaded: file.uploaded, isImage })
        return isImage
      })
      const uploadedVideos = mediaFiles.filter(file => {
        const fileType = file.file?.type || ''
        const isVideo = fileType.startsWith('video/') && file.uploaded
        console.log('Video check for', file.file?.name, ':', { fileType, uploaded: file.uploaded, isVideo })
        return isVideo
      })
      console.log('Uploaded images:', uploadedImages)
      console.log('Uploaded videos:', uploadedVideos)

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          variations,
          images: uploadedImages.map(file => ({
            id: file.id,
            url: file.url,
            thumbnailUrl: file.thumbnailUrl,
            key: file.key,
            fileName: file.file?.name || 'unknown',
            fileSize: file.file?.size || 0,
            fileType: file.file?.type || 'image/jpeg',
            uploadedAt: new Date(),
          })),
          videos: uploadedVideos.map(file => ({
            id: file.id,
            url: file.url,
            thumbnailUrl: file.thumbnailUrl,
            key: file.key,
            fileName: file.file?.name || 'unknown',
            fileSize: file.file?.size || 0,
            fileType: file.file?.type || 'video/mp4',
            uploadedAt: new Date(),
          })),
          thumbnailUrl: uploadedImages[0]?.thumbnailUrl || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

      const updatedProduct = await response.json()
      console.log('Product updated successfully:', updatedProduct)
      console.log('Updated product images:', updatedProduct.images)
      console.log('Updated product videos:', updatedProduct.videos)

      setSuccess('Product updated successfully!')
      setTimeout(() => {
        router.push('/products')
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      setSaving(true)
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete product')
      }

      router.push('/products')
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

  const handleMediaFilesChange = (files: MediaFile[]) => {
    console.log('handleMediaFilesChange called with:', files.length, 'files')
    console.log('Files details:', files.map(f => ({
      id: f.id,
      name: f.file?.name,
      uploaded: f.uploaded,
      url: f.url
    })))
    setMediaFiles(files)
  }

  const handleMediaRemove = (fileId: string) => {
    setMediaFiles(prev => prev.filter(f => f.id !== fileId))
  }


  const formProgress = () => {
    const fields = ['name', 'sku', 'price']
    const filled = fields.filter(field => formData[field as keyof typeof formData])
    const categoryFilled = formData.categoryIds.length > 0 ? 1 : 0
    return Math.round(((filled.length + categoryFilled) / (fields.length + 1)) * 100)
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
                    <Edit3 className="w-8 h-8 text-primary-600" />
                    <span>Edit Product</span>
                  </h1>
                  <p className="mt-2 text-slate-600">
                    Update product information and inventory details
                  </p>
                </div>
                
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/products')}
                    disabled={saving}
                    className="flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || mediaFiles.some(f => f.uploading) || mediaFiles.some(f => f.error)}
                    loading={saving}
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {saving ? 'Saving...' : 
                       mediaFiles.some(f => f.uploading) ? 'Uploading...' :
                       mediaFiles.some(f => f.error) ? 'Fix Upload Errors' :
                       'Save Changes'}
                    </span>
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

            {success && (
              <div className="mb-6 bg-success-50 border border-success-200 rounded-xl p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-600 mr-3" />
                  <p className="text-success-800">{success}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <StaggerWrapper>
                  {/* Basic Information */}
                  <FadeIn delay={0.1}>
                    <Card className="card-hover">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-primary-600" />
                          <span>Basic Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Product Name *</label>
                            <Input
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              placeholder="Enter product name"
                              leftIcon={<Package className="w-4 h-4" />}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">SKU *</label>
                            <Input
                              value={formData.sku}
                              onChange={(e) => handleInputChange('sku', e.target.value)}
                              placeholder="Enter SKU"
                              leftIcon={<Hash className="w-4 h-4" />}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Description</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Enter product description"
                            rows={4}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </FadeIn>

                  {/* Pricing & Inventory */}
                  <FadeIn delay={0.2}>
                    <Card className="card-hover">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          {React.createElement(getCurrencyIcon(clientCurrency), { className: "w-5 h-5 text-success-600" })}
                          <span>Pricing & Inventory</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Price *</label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={formData.price}
                                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="pl-8"
                                required
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                                {clientCurrency === 'INR' ? '₹' : '$'}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">Product price in {clientCurrency}</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Stock Level</label>
                            <Input
                              type="number"
                              value={formData.stockLevel}
                              onChange={(e) => handleInputChange('stockLevel', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              leftIcon={<BarChart3 className="w-4 h-4" />}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Min Stock</label>
                            <Input
                              type="number"
                              value={formData.minStock}
                              onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
                              placeholder="0"
                              leftIcon={<TrendingUp className="w-4 h-4" />}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Status</label>
                            <select
                              value={formData.isActive ? 'true' : 'false'}
                              onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeIn>

                  {/* Product Variations */}
                  <FadeIn delay={0.3}>
                    <Card className="card-hover">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Layers className="w-5 h-5 text-purple-600" />
                          <span>Product Variations</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-600">
                            Add variations like size, color, or material options
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setVariationModalOpen(true)}
                            className="flex items-center space-x-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Variation</span>
                          </Button>
                        </div>

                        {variations.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {variations.map((variation) => (
                              <Badge
                                key={variation.id}
                                variant="secondary"
                                className="flex items-center space-x-2 px-3 py-2"
                              >
                                <span>
                                  {variation.name}: {variation.value}
                                  {variation.priceAdjustment ? 
                                    ` (+${clientCurrency === 'INR' ? '₹' : '$'}${variation.priceAdjustment})` : ''
                                  }
                                </span>
                                <button
                                  onClick={() => handleRemoveVariation(variation.id)}
                                  className="ml-2 hover:text-error-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-500">
                            <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No variations added yet</p>
                            <p className="text-sm">Click "Add Variation" to get started</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </FadeIn>

                  {/* Media Upload */}
                  <FadeIn delay={0.4}>
                    <Card className="card-hover">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span>Product Media</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-600">
                            Upload images and videos for this product
                          </p>
                          {mediaFiles.some(f => f.uploading) && (
                            <div className="flex items-center space-x-2 text-blue-600">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm font-medium">
                                {mediaFiles.filter(f => f.uploading).length} file(s) uploading...
                              </span>
                            </div>
                          )}
                        </div>

                        <MediaUpload
                          onFilesChange={handleMediaFilesChange}
                          files={mediaFiles}
                          sku={formData.sku}
                          maxFiles={10}
                          acceptedTypes={['image/*', 'video/*']}
                          maxSize={50 * 1024 * 1024} // 50MB
                          className="w-full"
                          clientId={product?.clientId}
                        />

                        
                        {/* Debug: Show current mediaFiles state */}
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">Debug - Current mediaFiles state:</h4>
                          <div className="text-xs space-y-1">
                            {mediaFiles.map((file, index) => (
                              <div key={file.id} className="flex justify-between items-center">
                                <span>{file.file?.name || 'Unknown'}</span>
                                <div className="flex items-center space-x-2">
                                  <span className={file.uploaded ? 'text-green-600' : 'text-red-600'}>
                                    {file.uploaded ? 'Uploaded' : 'Not uploaded'}
                                  </span>
                                  {file.url && (
                                    <button
                                      onClick={() => window.open(file.url, '_blank')}
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      Test URL
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </CardContent>
                    </Card>
                  </FadeIn>
                </StaggerWrapper>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Categories Section */}
                <FadeIn delay={0.1}>
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Tag className="w-5 h-5 text-purple-600" />
                        <span>Categories</span>
                        <span className="text-red-500">*</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                        loading={false}
                      />
                      {formData.categoryIds.length === 0 && (
                        <p className="text-sm text-slate-500 mt-2">Select at least one category for this product</p>
                      )}
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Form Progress */}
                <FadeIn delay={0.4}>
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="w-5 h-5 text-blue-600" />
                        <span>Form Progress</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">Completion</span>
                          <span className="text-sm text-slate-500">{formProgress()}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${formProgress()}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500">
                          Fill in all required fields to complete the form
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Quick Actions */}
                <FadeIn delay={0.5}>
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-amber-600" />
                        <span>Quick Actions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={() => router.push('/products')}
                        className="w-full justify-start"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        View All Products
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/reports')}
                        className="w-full justify-start"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Reports
                      </Button>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Danger Zone */}
                <FadeIn delay={0.6}>
                  <Card className="card-hover border-error-200">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-error-600">
                        <Trash2 className="w-5 h-5" />
                        <span>Danger Zone</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">
                        Once you delete a product, there is no going back. Please be certain.
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleDelete}
                        disabled={saving}
                        className="w-full border-error-300 text-error-600 hover:bg-error-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Product
                      </Button>
                    </CardContent>
                  </Card>
                </FadeIn>
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
                value={newVariation.name}
                onChange={(e) => setNewVariation(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Color, Size, Material"
                leftIcon={<Tag className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Variation Value</label>
              <Input
                value={newVariation.value}
                onChange={(e) => setNewVariation(prev => ({ ...prev, value: e.target.value }))}
                placeholder="e.g., Red, Large, Cotton"
                leftIcon={<FileText className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Price Adjustment</label>
              <div className="relative">
                <Input
                  type="number"
                  value={newVariation.priceAdjustment}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, priceAdjustment: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="pl-8"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  {clientCurrency === 'INR' ? '₹' : '$'}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Additional cost for this variation (can be negative)
              </p>
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