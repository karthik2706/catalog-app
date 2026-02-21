'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useGuestCart } from '@/contexts/GuestCartContext'
import { isVideoUrl } from '@/lib/guest-media'
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, Home, X, Menu as MenuIcon, Search } from 'lucide-react'

interface GuestCartClientProps {
  slug: string
  clientInfo: {
    id: string
    name: string
    slug: string
    logo: string | null
  }
  currencyCode?: string
}

export default function GuestCartClient({
  slug,
  clientInfo,
  currencyCode = 'USD'
}: GuestCartClientProps) {
  const router = useRouter()
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useGuestCart()

  const handleCheckout = () => {
    if (items.length === 0) return
    router.push(`/guest/${slug}/checkout`)
  }

  const handleContinueShopping = () => {
    router.push(`/guest/${slug}/catalog`)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-[10px] py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleContinueShopping}
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
                <p className="text-xs sm:text-sm text-gray-500">Shopping Cart</p>
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
        {items.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-8">Start adding items to your cart!</p>
            <Button onClick={handleContinueShopping} size="lg">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile: Order Summary - Sticky at top */}
            <div className="lg:hidden mb-4">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Total ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="text-xl font-bold text-gray-900">{formatPrice(total)}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleCheckout}
                      fullWidth
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Proceed to Checkout
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleContinueShopping}
                      fullWidth
                      size="lg"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        {/* Product Image */}
                        <div 
                          className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                          onClick={() => router.push(`/guest/${slug}/products/${item.productId}`)}
                        >
                          {item.thumbnailUrl || item.imageUrl ? (
                            isVideoUrl(item.thumbnailUrl || item.imageUrl!) ? (
                              <video
                                src={item.thumbnailUrl || item.imageUrl!}
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={item.thumbnailUrl || item.imageUrl!}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <h3 
                                className="text-sm sm:text-base font-semibold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => router.push(`/guest/${slug}/products/${item.productId}`)}
                              >
                                {item.name}
                              </h3>
                              <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                              aria-label="Remove item"
                            >
                              <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            {/* Price */}
                            <div className="flex items-center gap-3">
                              <span className="text-base sm:text-lg font-bold text-blue-600">
                                {formatPrice(item.price)}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-xs text-gray-500">
                                  × {item.quantity} = <span className="font-semibold text-gray-700">{formatPrice(item.price * item.quantity)}</span>
                                </span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="p-2 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="px-3 sm:px-4 py-2 text-sm font-medium min-w-[3rem] text-center">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="p-2 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop: Order Summary - Sticky Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24 lg:shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm sm:text-base text-gray-600">
                        <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                        <span className="font-medium">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-900">
                          <span>Total</span>
                          <span>{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      fullWidth
                      size="lg"
                      className="mb-3 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Proceed to Checkout
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleContinueShopping}
                      fullWidth
                    >
                      Continue Shopping
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Mobile Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:hidden">
        <div className="flex items-center justify-around px-4 py-2">
          {/* Home Button */}
          <button
            onClick={handleContinueShopping}
            className="flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors min-w-0 flex-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            aria-label="Home"
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Categories Button */}
          <button
            onClick={handleContinueShopping}
            className="flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors min-w-0 flex-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            aria-label="Categories"
          >
            <MenuIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Categories</span>
          </button>

          {/* Search Button */}
          <button
            onClick={handleContinueShopping}
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
