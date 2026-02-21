'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import ImageModal from '@/components/ImageModal'
import { isVideoUrl } from '@/lib/guest-media'
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

interface OrderItem {
  id: string
  productId: string
  productName: string
  productSku: string
  price: number
  quantity: number
  subtotal: number
  product?: {
    id: string
    name: string
    sku: string
    thumbnailUrl?: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: any
  billingAddress?: any
  subtotal: number
  tax: number
  shipping: number
  total: number
  notes?: string
  paymentUTR?: string | null
  paymentTransactionNumber?: string | null
  paymentProofUrl?: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  client?: {
    id: string
    name: string
    slug: string
    email: string
    phone: string | null
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: Package },
  PROCESSING: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Package },
  SHIPPED: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const { user: authUser } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean
    images: string[]
    currentIndex: number
    productName: string
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    productName: ''
  })
  const [productImagesCache, setProductImagesCache] = useState<Record<string, string[]>>({})
  const [editingPayment, setEditingPayment] = useState(false)
  const [paymentUTR, setPaymentUTR] = useState('')
  const [paymentTransactionNumber, setPaymentTransactionNumber] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [clientCurrency, setClientCurrency] = useState<string>('USD')
  const [editingShippingAddress, setEditingShippingAddress] = useState(false)
  const [shippingAddressForm, setShippingAddressForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })
  const [editingCustomerInfo, setEditingCustomerInfo] = useState(false)
  const [customerInfoForm, setCustomerInfoForm] = useState({
    name: '',
    email: '',
    phone: ''
  })

  // Check if user can edit shipping address (all authenticated users)
  const canEditShippingAddress = !!authUser

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      router.push('/login')
      return
    }
    setToken(storedToken)
  }, [router])

  useEffect(() => {
    if (!token) return

    const fetchClientCurrency = async () => {
      try {
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

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch order')
        }

        const data = await response.json()
        setOrder(data.order)
      } catch (error) {
        console.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
    fetchClientCurrency()
  }, [token, id, router])

  useEffect(() => {
    if (order) {
      setPaymentUTR(order.paymentUTR || '')
      setPaymentTransactionNumber(order.paymentTransactionNumber || '')
    }
  }, [order])

  const fetchProductImages = async (productId: string): Promise<string[]> => {
    // Check cache first
    if (productImagesCache[productId]) {
      return productImagesCache[productId]
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      const images: string[] = []
      
      // Collect all image URLs
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((img: any) => {
          if (img.url) images.push(img.url)
        })
      }
      
      // Use thumbnail as fallback
      if (images.length === 0 && data.thumbnailUrl) {
        images.push(data.thumbnailUrl)
      }

      // Cache the images
      setProductImagesCache(prev => ({
        ...prev,
        [productId]: images
      }))

      return images
    } catch (error) {
      console.error('Error fetching product images:', error)
      return []
    }
  }

  const handleImageClick = async (item: OrderItem) => {
    if (!item.productId) return

    // Get images for the product
    let images: string[] = []
    
    // Try to get from cache or fetch
    images = await fetchProductImages(item.productId)
    
    // If no images found, use thumbnail as fallback
    if (images.length === 0 && item.product?.thumbnailUrl) {
      images = [item.product.thumbnailUrl]
    }

    if (images.length > 0) {
      setImageModal({
        isOpen: true,
        images,
        currentIndex: 0,
        productName: item.productName
      })
    }
  }

  useEffect(() => {
    if (order) {
      setPaymentUTR(order.paymentUTR || '')
      setPaymentTransactionNumber(order.paymentTransactionNumber || '')
      
      // Initialize customer information form
      setCustomerInfoForm({
        name: order.customerName || '',
        email: order.customerEmail || '',
        phone: order.customerPhone || ''
      })
      
      // Initialize shipping address form
      if (order.shippingAddress) {
        setShippingAddressForm({
          firstName: order.shippingAddress.firstName || '',
          lastName: order.shippingAddress.lastName || '',
          phone: order.shippingAddress.phone || order.customerPhone || '',
          addressLine1: order.shippingAddress.addressLine1 || '',
          addressLine2: order.shippingAddress.addressLine2 || '',
          city: order.shippingAddress.city || '',
          state: order.shippingAddress.state || '',
          zipCode: order.shippingAddress.zipCode || '',
          country: order.shippingAddress.country || ''
        })
      }
    }
  }, [order])

  const handleStatusUpdate = async (newStatus: string) => {
    if (!token || !order) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      const data = await response.json()
      setOrder(data.order)
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentUpdate = async () => {
    if (!token || !order) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentUTR: paymentUTR || null,
          paymentTransactionNumber: paymentTransactionNumber || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update payment details')
      }

      const data = await response.json()
      setOrder(data.order)
      setEditingPayment(false)
    } catch (error) {
      console.error('Error updating payment details:', error)
      alert('Failed to update payment details')
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentProofUpload = async () => {
    if (!token || !order || !paymentFile) return

    setUploadingProof(true)
    try {
      const formData = new FormData()
      formData.append('file', paymentFile)

      const response = await fetch(`/api/orders/${id}/payment-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload payment proof')
      }

      const data = await response.json()
      
      // Update order with new payment proof URL
      const updateResponse = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentProofUrl: data.s3Key })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update order with payment proof')
      }

      const updateData = await updateResponse.json()
      setOrder(updateData.order)
      setPaymentFile(null)
      alert('Payment proof uploaded successfully')
    } catch (error) {
      console.error('Error uploading payment proof:', error)
      alert('Failed to upload payment proof')
    } finally {
      setUploadingProof(false)
    }
  }

  const handleCustomerInfoUpdate = async () => {
    if (!token || !order) return

    // Validate required fields
    if (!customerInfoForm.name || !customerInfoForm.email || !customerInfoForm.phone) {
      alert('Please fill in all required customer information fields')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerInfoForm.email)) {
      alert('Please enter a valid email address')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customerName: customerInfoForm.name,
          customerEmail: customerInfoForm.email,
          customerPhone: customerInfoForm.phone
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update customer information')
      }

      const data = await response.json()
      setOrder(data.order)
      setEditingCustomerInfo(false)
      alert('Customer information updated successfully')
    } catch (error: any) {
      console.error('Error updating customer information:', error)
      alert(error.message || 'Failed to update customer information')
    } finally {
      setUpdating(false)
    }
  }

  const handleShippingAddressUpdate = async () => {
    if (!token || !order) return

    // Validate required fields
    if (!shippingAddressForm.firstName || !shippingAddressForm.addressLine1 || 
        !shippingAddressForm.city || !shippingAddressForm.state || 
        !shippingAddressForm.zipCode || !shippingAddressForm.country) {
      alert('Please fill in all required address fields')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingAddress: shippingAddressForm
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update shipping address')
      }

      const data = await response.json()
      setOrder(data.order)
      setEditingShippingAddress(false)
      alert('Shipping address updated successfully')
    } catch (error: any) {
      console.error('Error updating shipping address:', error)
      alert(error.message || 'Failed to update shipping address')
    } finally {
      setUpdating(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: clientCurrency
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="page-container">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <Button onClick={() => router.push('/orders')}>
              Back to Orders
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const StatusIcon = statusConfig[order.status]?.icon || Clock
  const statusInfo = statusConfig[order.status] || statusConfig.PENDING
  const shippingAddress = order.shippingAddress

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/orders')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order {order.orderNumber}</h1>
                <span className={`px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 ${statusInfo.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                      <div 
                        className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                        onClick={() => handleImageClick(item)}
                      >
                        {item.product?.thumbnailUrl ? (
                          isVideoUrl(item.product.thumbnailUrl) ? (
                            <video
                              src={item.product.thumbnailUrl}
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={item.product.thumbnailUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          )
                        ) : null}
                        {(!item.product?.thumbnailUrl || item.product?.thumbnailUrl === '') && (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                        <p className="text-sm text-gray-500">SKU: {item.productSku}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatPrice(Number(item.subtotal))}</p>
                        <p className="text-sm text-gray-500">{formatPrice(Number(item.price))} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(Number(order.subtotal))}</span>
                  </div>
                  {order.tax && Number(order.tax) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>{formatPrice(Number(order.tax))}</span>
                    </div>
                  )}
                  {order.shipping && Number(order.shipping) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{formatPrice(Number(order.shipping))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatPrice(Number(order.total))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
                  {canEditShippingAddress && !editingCustomerInfo && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCustomerInfo(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                
                {editingCustomerInfo && canEditShippingAddress ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerInfoForm.name}
                        onChange={(e) => setCustomerInfoForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={customerInfoForm.email}
                        onChange={(e) => setCustomerInfoForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customerInfoForm.phone}
                        onChange={(e) => setCustomerInfoForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleCustomerInfoUpdate}
                        disabled={updating}
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingCustomerInfo(false)
                          // Reset form to original values
                          if (order) {
                            setCustomerInfoForm({
                              name: order.customerName || '',
                              email: order.customerEmail || '',
                              phone: order.customerPhone || ''
                            })
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">Name:</span>
                      <p className="text-gray-900">{order.customerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Email:</span>
                      <p className="text-gray-900">{order.customerEmail}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Phone:</span>
                      <p className="text-gray-900">{order.customerPhone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                  {canEditShippingAddress && !editingShippingAddress && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingShippingAddress(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                
                {editingShippingAddress && canEditShippingAddress ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingAddressForm.firstName}
                          onChange={(e) => setShippingAddressForm(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={shippingAddressForm.lastName}
                          onChange={(e) => setShippingAddressForm(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={shippingAddressForm.phone}
                        onChange={(e) => setShippingAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingAddressForm.addressLine1}
                        onChange={(e) => setShippingAddressForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={shippingAddressForm.addressLine2}
                        onChange={(e) => setShippingAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingAddressForm.city}
                          onChange={(e) => setShippingAddressForm(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingAddressForm.state}
                          onChange={(e) => setShippingAddressForm(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP/Postal Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingAddressForm.zipCode}
                          onChange={(e) => setShippingAddressForm(prev => ({ ...prev, zipCode: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={shippingAddressForm.country}
                          onChange={(e) => setShippingAddressForm(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleShippingAddressUpdate}
                        disabled={updating}
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingShippingAddress(false)
                          // Reset form to original values
                          if (order?.shippingAddress) {
                            setShippingAddressForm({
                              firstName: order.shippingAddress.firstName || '',
                              lastName: order.shippingAddress.lastName || '',
                              phone: order.shippingAddress.phone || order.customerPhone || '',
                              addressLine1: order.shippingAddress.addressLine1 || '',
                              addressLine2: order.shippingAddress.addressLine2 || '',
                              city: order.shippingAddress.city || '',
                              state: order.shippingAddress.state || '',
                              zipCode: order.shippingAddress.zipCode || '',
                              country: order.shippingAddress.country || ''
                            })
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                    <p>{shippingAddress.addressLine1}</p>
                    {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                    <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                    <p>{shippingAddress.country}</p>
                    {(shippingAddress.phone || order.customerPhone) && (
                      <p className="text-gray-600 mt-2">Mobile: {shippingAddress.phone || order.customerPhone}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {order.notes && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Order Notes</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Payment Details */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                  {!editingPayment && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPayment(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                
                {editingPayment ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UTR Number
                      </label>
                      <input
                        type="text"
                        value={paymentUTR}
                        onChange={(e) => setPaymentUTR(e.target.value)}
                        placeholder="Enter UTR number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction Number
                      </label>
                      <input
                        type="text"
                        value={paymentTransactionNumber}
                        onChange={(e) => setPaymentTransactionNumber(e.target.value)}
                        placeholder="Enter transaction number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handlePaymentUpdate}
                        disabled={updating}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingPayment(false)
                          setPaymentUTR(order.paymentUTR || '')
                          setPaymentTransactionNumber(order.paymentTransactionNumber || '')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">UTR Number:</span>
                      <p className="text-gray-900">{order.paymentUTR || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Transaction Number:</span>
                      <p className="text-gray-900">{order.paymentTransactionNumber || 'Not provided'}</p>
                    </div>
                  </div>
                )}

                {/* Payment Proof */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Proof
                  </label>
                  {order.paymentProofUrl ? (
                    <div className="space-y-2">
                      <a
                        href={order.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Payment Proof
                      </a>
                      <div className="text-xs text-gray-500">
                        Upload a new file to replace the existing proof
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-2">No payment proof uploaded</p>
                  )}
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {paymentFile && (
                      <Button
                        onClick={handlePaymentProofUpload}
                        disabled={uploadingProof}
                        className="mt-2"
                        size="sm"
                      >
                        {uploadingProof ? 'Uploading...' : 'Upload Payment Proof'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Information */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Information</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">Order Date:</span>
                    <p className="text-gray-900">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Last Updated:</span>
                    <p className="text-gray-900">{formatDate(order.updatedAt)}</p>
                  </div>
                  {order.client && (
                    <div>
                      <span className="text-gray-600 font-medium">Client:</span>
                      <p className="text-gray-900">{order.client.name}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Update */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Update Status</h2>
                <div className="space-y-2">
                  {Object.keys(statusConfig).map((status) => {
                    if (status === order.status) return null
                    return (
                      <Button
                        key={status}
                        variant="outline"
                        fullWidth
                        onClick={() => handleStatusUpdate(status)}
                        disabled={updating}
                        className="justify-start"
                      >
                        {React.createElement(statusConfig[status].icon, { className: 'w-4 h-4 mr-2' })}
                        {statusConfig[status].label}
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={() => setImageModal(prev => ({ ...prev, isOpen: false }))}
        images={imageModal.images}
        currentIndex={imageModal.currentIndex}
        onNext={() => setImageModal(prev => ({
          ...prev,
          currentIndex: (prev.currentIndex + 1) % prev.images.length
        }))}
        onPrevious={() => setImageModal(prev => ({
          ...prev,
          currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
        }))}
        productName={imageModal.productName}
      />
    </DashboardLayout>
  )
}

