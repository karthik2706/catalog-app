'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useGuestCart } from '@/contexts/GuestCartContext'
import { ArrowLeft, ShoppingCart, Plus, Minus, X, Home, Menu as MenuIcon, Search } from 'lucide-react'
import ImageModal from '@/components/ImageModal'

interface Product {
  id: string
  name: string
  sku: string
  description?: string
  price: number
  category: string
  categories?: Array<{ id: string; name: string; description?: string }>
  images: string[]
  videos: string[]
  media?: any[]
  thumbnailUrl?: string
  allowPreorder: boolean
  stockLevel: number
}

interface GuestProductDetailClientProps {
  slug: string
  productId: string
  clientInfo: {
    id: string
    name: string
    slug: string
    logo: string | null
  }
  currencyCode?: string
}

export default function GuestProductDetailClient({
  slug,
  productId,
  clientInfo,
  currencyCode = 'USD'
}: GuestProductDetailClientProps) {
  const router = useRouter()
  const { addItem, getItemQuantity, updateQuantity, getItemCount } = useGuestCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageModalOpen, setImageModalOpen] = useState(false)
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

    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/guest/products/${productId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push(`/guest/${slug}`)
            return
          }
          throw new Error('Failed to fetch product')
        }

        const data = await response.json()
        setProduct(data.product)
        const cartQuantity = getItemQuantity(productId)
        if (cartQuantity > 0) {
          setQuantity(cartQuantity)
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [token, productId, slug, router, getItemQuantity])

  const handleAddToCart = () => {
    if (!product) return

    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      quantity: quantity,
      thumbnailUrl: product.thumbnailUrl || product.images[0],
      imageUrl: product.images[0]
    })

    // Show feedback or redirect to cart
    router.push(`/guest/${slug}/cart`)
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(product?.stockLevel || 999, quantity + delta))
    setQuantity(newQuantity)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Button onClick={() => router.push(`/guest/${slug}/catalog`)}>
            Back to Catalog
          </Button>
        </div>
      </div>
    )
  }

  const images = product.images || []
  const displayImage = images[selectedImageIndex] || product.thumbnailUrl

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
                <p className="text-xs sm:text-sm text-gray-500">Guest View</p>
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
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-20 sm:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <Card className="overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => images.length > 0 && setImageModalOpen(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">No Image</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square overflow-hidden rounded-md border-2 ${
                      selectedImageIndex === index
                        ? 'border-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-sm text-gray-500 mb-3">SKU: {product.sku}</p>
              {product.categories && product.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-4">
                {formatPrice(Number(product.price))}
              </div>
            </div>

            {/* Stock Status */}
            <div className="mb-4">
              {product.stockLevel > 0 ? (
                <p className="text-sm text-green-600 font-medium">
                  In Stock ({product.stockLevel} available)
                </p>
              ) : product.allowPreorder ? (
                <p className="text-sm text-orange-600 font-medium">Available for Preorder</p>
              ) : (
                <p className="text-sm text-red-600 font-medium">Out of Stock</p>
              )}
            </div>

            {/* Add to Cart Section */}
            <div className="mb-6 border-t border-gray-200 pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Quantity Selector */}
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stockLevel || 999}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      const max = product.stockLevel || 999
                      setQuantity(Math.max(1, Math.min(max, val)))
                    }}
                    className="w-16 text-center border-0 focus:ring-0 focus:outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.stockLevel || 999)}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stockLevel === 0 && !product.allowPreorder}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product.stockLevel === 0 && !product.allowPreorder
                    ? 'Out of Stock'
                    : 'Add to Cart'}
                </Button>
              </div>
            </div>

            {product.description && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {imageModalOpen && images.length > 0 && (
        <ImageModal
          images={images}
          currentIndex={selectedImageIndex}
          onClose={() => setImageModalOpen(false)}
          onNext={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
          onPrevious={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
          productName={product.name}
        />
      )}

      {/* Mobile Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 sm:hidden">
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

