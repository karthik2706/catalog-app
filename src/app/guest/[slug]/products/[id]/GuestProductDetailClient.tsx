'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useGuestCart } from '@/contexts/GuestCartContext'
import { ArrowLeft, ShoppingCart, Plus, Minus, X, Home, Menu as MenuIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react'

type MediaItem = { url: string; isVideo: boolean }

interface ProductVariation {
  name?: string
  value?: string
  priceAdjustment?: number
}

/** Group product variations by name (e.g. Color -> [Black, White], Size -> [S, M, L]). */
function groupVariationsByName(variations: ProductVariation[]): Record<string, ProductVariation[]> {
  const map: Record<string, ProductVariation[]> = {}
  for (const v of variations) {
    const name = v.name ?? 'Option'
    if (!map[name]) map[name] = []
    map[name].push(v)
  }
  return map
}

interface Product {
  id: string
  name: string
  sku: string
  description?: string
  price: number
  category: string
  categories?: Array<{ id: string; name: string; description?: string }>
  images: string[] | { url: string }[]
  videos: string[] | { url: string }[]
  media?: Array<{ url?: string; kind?: string; sortOrder?: number }>
  thumbnailUrl?: string
  allowPreorder: boolean
  stockLevel: number
  variations?: ProductVariation[]
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
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  /** Selected variation option per name (e.g. { Color: { value: 'Black', ... }, Size: { value: 'M', ... } }). */
  const [selectedVariations, setSelectedVariations] = useState<Record<string, ProductVariation>>({})

  const getProductMedia = (p: Product | null): MediaItem[] => {
    if (!p) return []
    const seen = new Set<string>()
    const items: MediaItem[] = []
    const add = (url: string | undefined, isVideo: boolean) => {
      if (url && typeof url === 'string' && url.startsWith('http') && !seen.has(url)) {
        seen.add(url)
        items.push({ url, isVideo })
      }
    }
    if (p.media && Array.isArray(p.media)) {
      const sorted = [...p.media].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      sorted.forEach((m) => {
        const url = m.url
        if (url) add(url, m.kind === 'video')
      })
    }
    if (p.images?.length) {
      p.images.forEach((img: string | { url: string }) => {
        const url = typeof img === 'string' ? img : img?.url
        add(url, false)
      })
    }
    if (p.videos?.length) {
      p.videos.forEach((v: string | { url: string }) => {
        const url = typeof v === 'string' ? v : v?.url
        add(url, true)
      })
    }
    if (p.thumbnailUrl && typeof p.thumbnailUrl === 'string' && p.thumbnailUrl.startsWith('http') && !seen.has(p.thumbnailUrl)) {
      const path = p.thumbnailUrl.split('?')[0] || ''
      items.unshift({ url: p.thumbnailUrl, isVideo: /\.(mp4|webm|mov|ogg|m4v)$/i.test(path) })
    }
    return items
  }

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
        const p = data.product as Product
        setProduct(p)
        if (p.variations && Array.isArray(p.variations) && p.variations.length > 0) {
          const groups = groupVariationsByName(p.variations)
          const initial: Record<string, ProductVariation> = {}
          for (const name of Object.keys(groups)) {
            const opts = groups[name]
            if (opts.length) initial[name] = opts[0]
          }
          setSelectedVariations(initial)
        } else {
          setSelectedVariations({})
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [token, productId, slug, router])

  const selectedVariationsList = Object.values(selectedVariations)
  const effectivePrice = product
    ? Number(product.price) +
      selectedVariationsList.reduce((sum, v) => sum + (Number(v.priceAdjustment) || 0), 0)
    : 0

  useEffect(() => {
    if (!product) return
    const cartQty =
      selectedVariationsList.length > 0
        ? getItemQuantity(product.id, selectedVariationsList)
        : getItemQuantity(product.id)
    setQuantity((q) => (cartQty > 0 ? cartQty : q < 1 ? 1 : q))
  }, [product?.id, JSON.stringify(selectedVariationsList), getItemQuantity])

  const handleAddToCart = () => {
    if (!product) return
    const hasVariations = product.variations && Array.isArray(product.variations) && product.variations.length > 0
    if (hasVariations && selectedVariationsList.length === 0) return
    const media = getProductMedia(product)
    const firstUrl = media[0]?.url ?? product.thumbnailUrl ?? (Array.isArray(product.images) && product.images[0] ? (typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as { url: string }).url) : undefined)
    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: effectivePrice,
      quantity: quantity,
      thumbnailUrl: product.thumbnailUrl || firstUrl,
      imageUrl: firstUrl,
      variations: selectedVariationsList.length > 0 ? selectedVariationsList : undefined,
    })

    router.push(`/guest/${slug}/cart`)
  }

  const handleQuantityChange = (delta: number) => {
    const maxQ = product ? (product.allowPreorder ? 999 : (product.stockLevel ?? 999)) : 999
    const newQuantity = Math.max(1, Math.min(maxQ, quantity + delta))
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

  const media = getProductMedia(product)
  const displayItem = media[selectedMediaIndex] ?? null
  const maxQuantity = product.allowPreorder ? 999 : (product.stockLevel ?? 999)

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
          {/* Media Gallery */}
          <div className="space-y-4">
            {/* Main media (image or video) */}
            <Card className="overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                {displayItem ? (
                  <>
                    {displayItem.isVideo ? (
                      <video
                        src={displayItem.url}
                        controls
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={displayItem.url}
                        alt={product.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setMediaModalOpen(true)}
                      />
                    )}
                    {media.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setMediaModalOpen(true)}
                        className="absolute bottom-2 right-2 rounded bg-black/60 text-white text-xs px-2 py-1"
                      >
                        Expand
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">No Media</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Thumbnail strip */}
            {media.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {media.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMediaIndex(index)}
                    className={`aspect-square overflow-hidden rounded-md border-2 ${
                      selectedMediaIndex === index
                        ? 'border-blue-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {item.isVideo ? (
                      <video
                        src={item.url}
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
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
                {formatPrice(effectivePrice)}
                {selectedVariationsList.length > 0 && effectivePrice !== Number(product.price) && (
                  <span className="text-base font-normal text-gray-500 ml-2">
                    (base {formatPrice(Number(product.price))})
                  </span>
                )}
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

            {/* Product Variations – select one option per variation name */}
            {product.variations && Array.isArray(product.variations) && product.variations.length > 0 && (() => {
              const groups = groupVariationsByName(product.variations)
              const names = Object.keys(groups)
              if (names.length === 0) return null
              return (
                <div className="mb-4 space-y-3">
                  {names.map((name) => {
                    const options = groups[name]
                    const selected = selectedVariations[name]
                    return (
                      <div key={name}>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">{name}</h3>
                        <div className="flex flex-wrap gap-2">
                          {options.map((opt: ProductVariation, idx: number) => {
                            const isSelected =
                              selected?.value === opt.value && selected?.name === opt.name
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                  setSelectedVariations((prev) => ({ ...prev, [name]: opt }))
                                }
                                className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {opt.value ?? 'Option'}
                                {opt.priceAdjustment != null && Number(opt.priceAdjustment) !== 0 && (
                                  <span className="ml-1 text-blue-600">
                                    {Number(opt.priceAdjustment) > 0 ? '+' : ''}
                                    {formatPrice(Number(opt.priceAdjustment))}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}

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
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      setQuantity(Math.max(1, Math.min(maxQuantity, val)))
                    }}
                    className="w-16 text-center border-0 focus:ring-0 focus:outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxQuantity}
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

      {/* Media Modal (image or video) */}
      {mediaModalOpen && media.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <button
            onClick={() => setMediaModalOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {media.length > 1 && (
            <>
              <button
                onClick={() => setSelectedMediaIndex((prev) => (prev - 1 + media.length) % media.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full"
                aria-label="Previous"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={() => setSelectedMediaIndex((prev) => (prev + 1) % media.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full"
                aria-label="Next"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}
          <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center p-4">
            {media[selectedMediaIndex]?.isVideo ? (
              <video
                src={media[selectedMediaIndex].url}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[95vh] object-contain"
              />
            ) : (
              <img
                src={media[selectedMediaIndex]?.url}
                alt={product.name}
                className="max-w-full max-h-[95vh] object-contain"
              />
            )}
          </div>
          {media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm">
              {selectedMediaIndex + 1} / {media.length}
            </div>
          )}
        </div>
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

