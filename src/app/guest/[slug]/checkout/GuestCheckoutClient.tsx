'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { useGuestCart } from '@/contexts/GuestCartContext'
import { ArrowLeft, ShoppingCart, User, MapPin, FileText, Package, CheckCircle2, Home, Menu as MenuIcon, Search } from 'lucide-react'

interface GuestCheckoutClientProps {
  slug: string
  clientInfo: {
    id: string
    name: string
    slug: string
    logo: string | null
  }
  currencyCode?: string
}

interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface FormErrors {
  [key: string]: string
}

export default function GuestCheckoutClient({
  slug,
  clientInfo,
  currencyCode = 'USD'
}: GuestCheckoutClientProps) {
  const router = useRouter()
  const { items, getTotal, clearCart } = useGuestCart()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [token, setToken] = useState<string | null>(null)
  const [notes, setNotes] = useState<string>('')

  const [formData, setFormData] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  })

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
    if (items.length === 0) {
      router.push(`/guest/${slug}/cart`)
    }
  }, [items.length, slug, router])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    // Last name is optional
    // Email is optional but if provided, must be valid
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required'
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid mobile number'
    }
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required'
    if (!formData.city.trim()) newErrors.city = 'City is required'
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'PIN code is required'
    } else if (!/^\d{6}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid 6-digit PIN code'
    }
    if (!formData.country.trim()) newErrors.country = 'Country is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (!validateForm() || !token) return

    setLoading(true)

    try {
      const subtotal = getTotal()
      const total = subtotal

      const response = await fetch(`/api/guest/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          })),
          customer: {
            name: formData.lastName.trim() 
              ? `${formData.firstName} ${formData.lastName}` 
              : formData.firstName,
            email: formData.email.trim() || undefined,
            phone: formData.phone,
          },
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          billingAddress: formData, // Same as shipping for now
          subtotal,
          tax: 0,
          shipping: 0,
          total,
          notes: notes.trim() || undefined,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to place order')
      }

      const orderData = await response.json()

      if (!orderData.success || !orderData.order?.id) {
        console.error('Invalid order response:', orderData)
        throw new Error('Invalid response from server')
      }

      // Clear cart before redirect
      clearCart()

      // Redirect to order confirmation using window.location for reliable navigation
      const orderId = orderData.order.id
      window.location.href = `/guest/${slug}/orders/${orderId}`
    } catch (error: any) {
      console.error('Error placing order:', error)
      setErrors({ submit: error.message || 'Failed to place order. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ShippingAddress, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(price)
  }

  const subtotal = getTotal()
  const total = subtotal
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  if (items.length === 0) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-[10px] py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/guest/${slug}/cart`)}
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
                <p className="text-xs sm:text-sm text-gray-500">Checkout</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/guest/${slug}/cart`)}
              className="relative flex items-center justify-center p-2 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-[10px] py-4 sm:py-6 md:py-8 pb-20 sm:pb-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Customer Information */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Customer Information</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      error={errors.firstName}
                      required
                    />
                    <Input
                      label="Last Name (Optional)"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      error={errors.lastName}
                    />
                    <Input
                      label="Email (Optional)"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      error={errors.email}
                    />
                    <Input
                      label="Mobile Number"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      error={errors.phone}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Shipping Address</h2>
                  </div>
                  <div className="space-y-4">
                    <Input
                      label="Address Line 1"
                      value={formData.addressLine1}
                      onChange={(e) => handleChange('addressLine1', e.target.value)}
                      error={errors.addressLine1}
                      required
                    />
                    <Input
                      label="Address Line 2 (Optional)"
                      value={formData.addressLine2}
                      onChange={(e) => handleChange('addressLine2', e.target.value)}
                      error={errors.addressLine2}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="City"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        error={errors.city}
                        required
                      />
                      <Input
                        label="State"
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        error={errors.state}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="PIN Code"
                        value={formData.zipCode}
                        onChange={(e) => handleChange('zipCode', e.target.value.replace(/\D/g, ''))}
                        error={errors.zipCode}
                        required
                        maxLength={6}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          readOnly
                          disabled
                          className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Additional Notes</h2>
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions or Messages (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      maxLength={500}
                      className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-y"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        {notes.length}/500 characters
                      </p>
                      {notes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setNotes('')}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {errors.submit && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-red-600">{errors.submit}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-gray-200 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Order Summary</h2>
                  </div>
                  
                  {/* Order Items */}
                  <div className="space-y-3 mb-4 sm:mb-6 max-h-64 overflow-y-auto pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        {/* Product Thumbnail */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.thumbnailUrl || item.imageUrl ? (
                            <img
                              src={item.thumbnailUrl || item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate mb-1">{item.name}</p>
                          <p className="text-xs text-gray-500 mb-2">Qty: {item.quantity}</p>
                          <p className="font-semibold text-sm text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-900">
                        <span>Total</span>
                        <span className="text-blue-600">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    loading={loading}
                    fullWidth
                    size="lg"
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Place Order
                  </Button>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 text-center">
                      <strong>Secure Checkout</strong> - No payment required for guest orders
                    </p>
                    <p className="text-xs text-blue-600 text-center mt-1">
                      By placing this order, you agree to our terms and conditions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
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
