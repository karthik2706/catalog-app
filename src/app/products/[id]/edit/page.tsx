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

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          variations,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

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
                    disabled={saving}
                    loading={saving}
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
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
                          <DollarSign className="w-5 h-5 text-success-600" />
                          <span>Pricing & Inventory</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Price *</label>
                            <Input
                              type="number"
                              value={formData.price}
                              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              leftIcon={<DollarSign className="w-4 h-4" />}
                              required
                            />
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
                                    ` (+$${variation.priceAdjustment})` : ''
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
              <Input
                type="number"
                value={newVariation.priceAdjustment}
                onChange={(e) => setNewVariation(prev => ({ ...prev, priceAdjustment: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                leftIcon={<DollarSign className="w-4 h-4" />}
              />
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