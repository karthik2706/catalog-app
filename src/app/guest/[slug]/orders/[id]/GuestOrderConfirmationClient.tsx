'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { CheckCircle, ArrowLeft, ShoppingBag, ShoppingCart, Home, Menu as MenuIcon, Search } from 'lucide-react'

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
  createdAt: string
  items: OrderItem[]
}

interface GuestOrderConfirmationClientProps {
  slug: string
  orderId: string
  clientInfo: {
    id: string
    name: string
    slug: string
    logo: string | null
  }
  currencyCode?: string
}

export default function GuestOrderConfirmationClient({
  slug,
  orderId,
  clientInfo,
  currencyCode = 'USD'
}: GuestOrderConfirmationClientProps) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const getToken = async () => {
      try {
        const response = await fetch(`/api/guest/get-token?slug=${encodeURIComponent(slug)}`)
        if (!response.ok) {
          router.push(`/guest/${slug}`)
          return
        }
        const data = await response.json()
        if (data.token) {
          setToken(data.token)
        } else {
          router.push(`/guest/${slug}`)
        }
      } catch (error) {
        console.error('Error getting token:', error)
        router.push(`/guest/${slug}`)
      }
    }
    getToken()
  }, [slug, router])

  useEffect(() => {
    if (!token) return

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/guest/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push(`/guest/${slug}`)
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
  }, [token, orderId, slug, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <Button onClick={() => router.push(`/guest/${slug}/catalog`)}>
            Back to Catalog
          </Button>
        </div>
      </div>
    )
  }

  const shippingAddress = order.shippingAddress

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-[10px] py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/guest/${slug}/catalog`)}
                className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Button>
              {clientInfo.logo && (
                <img
                  src={clientInfo.logo}
                  alt={clientInfo.name}
                  width={32}
                  height={32}
                  className="rounded flex-shrink-0 sm:w-10 sm:h-10"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                  {clientInfo.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Order Confirmation</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/guest/${slug}/catalog`)}
              className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
              aria-label="Shop"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-20 sm:pb-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You for Your Order!</h1>
          <p className="text-lg text-gray-700 mb-4">
            Your order has been successfully placed. Order number: <strong>{order.orderNumber}</strong>
          </p>
          <p className="text-base text-gray-600 mb-6 max-w-2xl mx-auto">
            Our representative will reach out to you regarding the processing of your order and payment details.
          </p>
          <Button
            onClick={() => router.push(`/guest/${slug}/catalog`)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Order Information */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium text-gray-900">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Status:</span>
                  <span className="font-medium text-gray-900 capitalize">{order.status.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-blue-600 text-lg">{formatPrice(Number(order.total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium text-gray-900">{order.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium text-gray-900">{order.customerEmail}</p>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium text-gray-900">{order.customerPhone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Address */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Address</h2>
            <div className="text-sm text-gray-700">
              <p className="font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</p>
              <p>{shippingAddress.addressLine1}</p>
              {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
              <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
              <p>{shippingAddress.country}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Notes */}
        {order.notes && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Notes</h2>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {order.notes}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                  {item.product?.thumbnailUrl && (
                    <img
                      src={item.product.thumbnailUrl}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  )}
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

        {/* Next Steps */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">What's Next?</h2>
            <p className="text-sm text-gray-700 mb-4">
              Your order has been received and is being processed. Our team will review your order and contact you if needed. 
              You will receive updates about your order status.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => router.push(`/guest/${slug}/catalog`)}
                variant="outline"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Mobile Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:hidden">
        <div className="flex items-center justify-around px-4 py-2">
          {/* Home Button */}
          <button
            onClick={() => router.push(`/guest/${slug}/catalog`)}
            className="flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors min-w-0 flex-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            aria-label="Home"
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Categories Button */}
          <button
            onClick={() => router.push(`/guest/${slug}/catalog`)}
            className="flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors min-w-0 flex-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            aria-label="Categories"
          >
            <MenuIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Categories</span>
          </button>

          {/* Search Button */}
          <button
            onClick={() => router.push(`/guest/${slug}/catalog`)}
            className="flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors min-w-0 flex-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            aria-label="Search"
          >
            <Search className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Search</span>
          </button>
        </div>
      </footer>
    </div>
  )
}

