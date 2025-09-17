'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Product } from '@/types'

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productId, setProductId] = useState<string>('')

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
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
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

  if (!product) {
    return (
      <DashboardLayout>
        <Box>
          <Alert severity="error">
            Product not found
          </Alert>
        </Box>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => router.push('/products')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {product.name}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Product Details */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Product Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      SKU
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {product.sku}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Category
                    </Typography>
                    <Chip label={product.category} size="small" sx={{ mt: 0.5 }} />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Price
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${Number(product.price).toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={product.isActive ? 'Active' : 'Inactive'}
                      color={product.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  
                  {product.description && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {product.description}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {/* Product Variations */}
                {product.variations && product.variations.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="h6" gutterBottom>
                      Product Variations
                    </Typography>
                    <Box>
                      {product.variations.map((variation, index) => (
                        <Chip
                          key={index}
                          label={`${variation.name}: ${variation.value}${variation.priceAdjustment ? ` (+$${variation.priceAdjustment})` : ''}`}
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Stock Information */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stock Information
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Current Stock
                  </Typography>
                  <Typography 
                    variant="h4" 
                    color={product.stockLevel <= product.minStock ? 'error' : 'primary'}
                  >
                    {product.stockLevel}
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Minimum Stock
                  </Typography>
                  <Typography variant="h6">
                    {product.minStock}
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Stock Status
                  </Typography>
                  <Chip
                    label={product.stockLevel <= product.minStock ? 'Low Stock' : 'In Stock'}
                    color={product.stockLevel <= product.minStock ? 'warning' : 'success'}
                    size="small"
                  />
                </Box>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Value
                  </Typography>
                  <Typography variant="h6">
                    ${(Number(product.price) * product.stockLevel).toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => router.push(`/products/${product.id}/edit`)}
                    fullWidth
                  >
                    Edit Product
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<InventoryIcon />}
                    onClick={() => {
                      // This would open inventory update dialog
                      alert('Inventory update feature coming soon!')
                    }}
                    fullWidth
                  >
                    Update Inventory
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Inventory History */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Inventory History
                </Typography>
                
                {product.inventoryHistory && product.inventoryHistory.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>User</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {product.inventoryHistory.map((history) => (
                          <TableRow key={history.id}>
                            <TableCell>
                              {new Date(history.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={history.type} 
                                size="small" 
                                color={history.quantity > 0 ? 'success' : 'error'}
                              />
                            </TableCell>
                            <TableCell>
                              {history.quantity > 0 ? '+' : ''}{history.quantity}
                            </TableCell>
                            <TableCell>{history.reason || '-'}</TableCell>
                            <TableCell>
                              {history.user?.name || 'System'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">
                    No inventory history available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  )
}
