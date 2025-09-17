'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Product, ProductVariation } from '@/types'

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
  const [variationDialogOpen, setVariationDialogOpen] = useState(false)
  const [productId, setProductId] = useState<string>('')

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: 0,
    category: '',
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
      setVariationDialogOpen(false)
    }
  }

  const handleRemoveVariation = (id: string) => {
    setVariations(prev => prev.filter(v => v.id !== id))
  }

  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => router.push('/products')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            Edit Product
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="Electronics">Electronics</MenuItem>
                    <MenuItem value="Accessories">Accessories</MenuItem>
                    <MenuItem value="Office">Office</MenuItem>
                    <MenuItem value="Cables">Cables</MenuItem>
                    <MenuItem value="Clothing">Clothing</MenuItem>
                    <MenuItem value="Home">Home</MenuItem>
                    <MenuItem value="Sports">Sports</MenuItem>
                    <MenuItem value="Books">Books</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Stock Level"
                  type="number"
                  value={formData.stockLevel}
                  onChange={(e) => handleInputChange('stockLevel', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Stock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                    label="Status"
                  >
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Product Variations */}
            <Box mt={4}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Product Variations</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setVariationDialogOpen(true)}
                >
                  Add Variation
                </Button>
              </Box>

              {variations.length > 0 ? (
                <Box>
                  {variations.map((variation) => (
                    <Chip
                      key={variation.id}
                      label={`${variation.name}: ${variation.value}${variation.priceAdjustment ? ` (+$${variation.priceAdjustment})` : ''}`}
                      onDelete={() => handleRemoveVariation(variation.id)}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">
                  No variations added yet
                </Typography>
              )}
            </Box>

            {/* Action Buttons */}
            <Box display="flex" justifyContent="space-between" mt={4}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                disabled={saving}
              >
                Delete Product
              </Button>
              <Box>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/products')}
                  sx={{ mr: 2 }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Add Variation Dialog */}
        <Dialog open={variationDialogOpen} onClose={() => setVariationDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Product Variation</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Variation Name"
                  value={newVariation.name}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Color, Size, Material"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Variation Value"
                  value={newVariation.value}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="e.g., Red, Large, Cotton"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Price Adjustment"
                  type="number"
                  value={newVariation.priceAdjustment}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, priceAdjustment: parseFloat(e.target.value) || 0 }))}
                  helperText="Additional cost for this variation (can be negative)"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVariationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddVariation} variant="contained">
              Add Variation
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  )
}
