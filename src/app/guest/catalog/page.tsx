'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { X, ChevronLeft, ChevronRight, ChevronDown, Menu as MenuIcon, Home, Search } from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  description?: string
  price: number
  category: string
  thumbnailUrl?: string
  images: any[]
  videos: any[]
  media?: any[]
}

interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  sortOrder: number
  children?: Category[]
}

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  currentIndex: number
  onNext: () => void
  onPrevious: () => void
  productName: string
}

// Image Modal Component
function ImageModal({ isOpen, onClose, images, currentIndex, onNext, onPrevious, productName }: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onPrevious()
      } else if (e.key === 'ArrowRight') {
        onNext()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, onNext, onPrevious])

  if (!isOpen || images.length === 0) return null

  const hasMultiple = images.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Previous Button */}
      {hasMultiple && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Next Button */}
      {hasMultiple && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Image */}
      <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center p-4">
        <img
          src={images[currentIndex]}
          alt={productName}
          className="max-w-full max-h-[95vh] object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-image.png'
          }}
        />
      </div>

      {/* Image Counter */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}

function GuestCatalogPageContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [clientInfo, setClientInfo] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null)
  const [imageModal, setImageModal] = useState<{ isOpen: boolean; images: string[]; currentIndex: number; productName: string }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    productName: ''
  })
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = searchParams.get('slug') || ''

  // Initialize state from URL params on mount and when URL changes
  useEffect(() => {
    const urlCategory = searchParams.get('category')
    const urlSearch = searchParams.get('search')
    const urlPage = searchParams.get('page')

    if (urlCategory !== null && urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory)
    } else if (urlCategory === null && selectedCategory !== null) {
      setSelectedCategory(null)
    }
    
    // Only update search state from URL on initial load or external navigation
    // Don't update while user is typing
    if (urlSearch !== null && urlSearch !== debouncedSearch && urlSearch !== search) {
      setSearch(urlSearch)
      setDebouncedSearch(urlSearch)
    } else if (urlSearch === null && debouncedSearch !== '' && search === '') {
      setDebouncedSearch('')
    }
    
    if (urlPage) {
      const pageNum = parseInt(urlPage)
      if (!isNaN(pageNum) && pageNum !== page) {
        setPage(pageNum)
      }
    } else if (page !== 1) {
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Debounce search input
  useEffect(() => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current)
    }

    searchDebounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 500) // 500ms debounce

    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current)
      }
    }
  }, [search])

  // Update URL when state changes (but not when coming from URL params)
  useEffect(() => {
    if (!slug) return

    const currentCategory = searchParams.get('category')
    const currentSearch = searchParams.get('search')
    const currentPage = searchParams.get('page')

    // Use debouncedSearch for URL updates
    const categoryChanged = (selectedCategory || '') !== (currentCategory || '')
    const searchChanged = debouncedSearch !== (currentSearch || '')
    const pageChanged = page.toString() !== (currentPage || '1')

    if (categoryChanged || searchChanged || pageChanged) {
      const params = new URLSearchParams()
      params.set('slug', slug)
      
      if (selectedCategory) {
        params.set('category', selectedCategory)
      }
      
      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      }
      
      if (page > 1) {
        params.set('page', page.toString())
      }

      const newUrl = `/guest/catalog?${params.toString()}`
      router.replace(newUrl, { scroll: false })
    }
  }, [slug, selectedCategory, debouncedSearch, page, router, searchParams])

  // Initial load effect - only runs once or when slug changes
  useEffect(() => {
    if (!slug) {
      router.push('/guest')
      return
    }

    // Check authentication
    const token = localStorage.getItem(`guest_token_${slug}`)
    if (!token) {
      router.push(`/guest?slug=${encodeURIComponent(slug)}`)
      return
    }

    // Load client info
    const storedClient = localStorage.getItem(`guest_client_${slug}`)
    if (storedClient) {
      setClientInfo(JSON.parse(storedClient))
    }

    const loadData = async () => {
      await fetchCategories()
      await fetchProducts()
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, router])

  // Fetch products when search/category/page changes (use debouncedSearch)
  useEffect(() => {
    if (!slug) return
    
    const token = localStorage.getItem(`guest_token_${slug}`)
    if (!token) return

    // Only fetch products, don't reload categories
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, page, debouncedSearch, selectedCategory])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdown(null)
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close drawer when category is selected
  useEffect(() => {
    if (selectedCategory) {
      setDrawerOpen(false)
    }
  }, [selectedCategory])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [drawerOpen])

  const fetchCategories = async () => {
    if (!slug) return
    const token = localStorage.getItem(`guest_token_${slug}`)
    if (!token) return

    try {
      const response = await fetch('/api/guest/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(`guest_token_${slug}`)
          router.push(`/guest?slug=${encodeURIComponent(slug)}`)
          return
        }
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProducts = async () => {
    if (!slug) {
      console.log('fetchProducts: No slug, returning')
      return
    }
    const token = localStorage.getItem(`guest_token_${slug}`)
    if (!token) {
      console.log('fetchProducts: No token, returning')
      return
    }

    // Only show products section loading, not full page
    setProductsLoading(true)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedCategory && { category: selectedCategory })
      })

      console.log('Fetching products with params:', {
        page,
        search: debouncedSearch,
        selectedCategory,
        url: `/api/guest/products?${params}`
      })

      const response = await fetch(`/api/guest/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem(`guest_token_${slug}`)
          router.push(`/guest?slug=${encodeURIComponent(slug)}`)
          return
        }
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      console.log('Fetched products data:', {
        productCount: data.products?.length,
        firstProduct: data.products?.[0] ? {
          id: data.products[0].id,
          name: data.products[0].name,
          sku: data.products[0].sku,
          thumbnailUrl: data.products[0].thumbnailUrl,
          imagesLength: data.products[0].images?.length,
          mediaLength: data.products[0].media?.length,
          images: data.products[0].images,
          media: data.products[0].media
        } : null
      })
      setProducts(data.products)
      setTotalPages(data.pagination.pages)
      if (data.client) {
        setClientInfo(data.client)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
      setProductsLoading(false)
    }
  }

  const handleLogout = () => {
    if (!slug) return
    localStorage.removeItem(`guest_token_${slug}`)
    localStorage.removeItem(`guest_client_${slug}`)
    router.push(`/guest?slug=${encodeURIComponent(slug)}`)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Get all available images for a product
  const getProductImages = (product: Product): string[] => {
    const images: string[] = []
    
    console.log('Processing product images:', {
      sku: product.sku,
      thumbnailUrl: product.thumbnailUrl,
      images: product.images,
      media: product.media
    })
    
    // Add images from media array first (these are processed with signed URLs)
    if (product.media && Array.isArray(product.media)) {
      product.media.forEach((mediaItem) => {
        if (mediaItem.kind === 'image' || !mediaItem.kind) {
          const url = mediaItem.url || mediaItem.URL || mediaItem.src
          if (url && typeof url === 'string' && url.startsWith('http') && !images.includes(url)) {
            images.push(url)
          }
        }
      })
    }
    
    // Add images from images array (processed with signed URLs from API)
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (typeof img === 'string' && img.startsWith('http')) {
          if (!images.includes(img)) images.push(img)
        } else if (typeof img === 'object' && img !== null) {
          const url = img.url || img.URL || img.src || img.imageUrl
          if (url && typeof url === 'string' && url.startsWith('http') && !images.includes(url)) {
            images.push(url)
          }
        }
      })
    }
    
    // Add thumbnailUrl if available and not already in images
    if (product.thumbnailUrl && typeof product.thumbnailUrl === 'string' && product.thumbnailUrl.startsWith('http')) {
      if (!images.includes(product.thumbnailUrl)) {
        images.unshift(product.thumbnailUrl) // Add to beginning
      }
    }
    
    console.log('Extracted images:', images)
    
    return images
  }

  // Open image modal
  const openImageModal = (product: Product, imageIndex: number = 0) => {
    const images = getProductImages(product)
    if (images.length > 0) {
      setImageModal({
        isOpen: true,
        images,
        currentIndex: Math.min(imageIndex, images.length - 1),
        productName: product.name
      })
    }
  }

  // Navigate images in modal
  const nextImage = () => {
    if (imageModal.images.length > 0) {
      setImageModal(prev => ({
        ...prev,
        currentIndex: (prev.currentIndex + 1) % prev.images.length
      }))
    }
  }

  const previousImage = () => {
    if (imageModal.images.length > 0) {
      setImageModal(prev => ({
        ...prev,
        currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
      }))
    }
  }

  // Category handlers
  const handleCategoryClick = (categoryId: string) => {
    const newSelected = selectedCategory === categoryId ? null : categoryId
    setSelectedCategory(newSelected)
    setPage(1)
    setSearch('') // Clear search when category is selected
    setOpenDropdown(null)
    // Don't close drawer immediately - let user see the selection
    setTimeout(() => setDrawerOpen(false), 300)
  }

  const handleSubcategoryClick = (subcategoryId: string) => {
    console.log('handleSubcategoryClick called with:', subcategoryId)
    if (!subcategoryId) {
      console.error('No subcategory ID provided')
      return
    }
    
    console.log('Setting selectedCategory to:', subcategoryId)
    
    // Update state in the correct order
    setOpenDropdown(null)
    setSearch('') // Clear search when category is selected
    setPage(1)
    setSelectedCategory(subcategoryId)
    
    console.log('State updated, selectedCategory should now be:', subcategoryId)
    
    // Close drawer after selection
    setTimeout(() => {
      setDrawerOpen(false)
    }, 200)
  }

  const toggleDropdown = (categoryId: string) => {
    setOpenDropdown(openDropdown === categoryId ? null : categoryId)
  }

  const clearCategoryFilter = () => {
    setSelectedCategory(null)
    setPage(1)
    setDrawerOpen(false)
  }

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  // Get selected category name
  const getSelectedCategoryName = (): string | null => {
    if (!selectedCategory) return null
    
    // Search through all categories to find the selected one
    for (const category of categories) {
      if (category.id === selectedCategory) {
        return category.name
      }
      if (category.children) {
        for (const subcategory of category.children) {
          if (subcategory.id === selectedCategory) {
            return subcategory.name
          }
          if (subcategory.children) {
            for (const subsubcategory of subcategory.children) {
              if (subsubcategory.id === selectedCategory) {
                return subsubcategory.name
              }
            }
          }
        }
      }
    }
    return null
  }

  // Handle mobile footer actions
  const handleMobileHome = () => {
    clearCategoryFilter()
    setSearch('')
    setPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleMobileCategories = () => {
    toggleDrawer()
  }

  const handleMobileSearch = () => {
    setSearchFocused(true)
    searchInputRef.current?.focus()
    // Scroll to search on mobile
    if (window.innerWidth < 640) {
      setTimeout(() => {
        searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading catalog...</p>
        </div>
      </div>
    )
  }

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No catalog slug provided</p>
          <Button onClick={() => router.push('/guest')} className="mt-4">
            Go to Guest Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 640px) {
          /* Adjust dropdown positioning on mobile */
          .dropdown-menu {
            right: 0 !important;
            left: auto !important;
            max-width: calc(100vw - 2rem);
          }
          .nested-dropdown {
            right: 100% !important;
            left: auto !important;
            margin-right: 0.5rem;
          }
        }
      `}</style>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-[10px] py-3 sm:py-4">
          {/* Top Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              {/* Home Link */}
              <button
                onClick={handleMobileHome}
                className="flex items-center justify-center p-2 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                aria-label="Home"
              >
                <Home className="w-5 h-5 text-gray-700" />
              </button>
              {clientInfo?.logo && (
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
                  {clientInfo?.name || 'Catalog'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Guest View</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full sm:w-auto flex-shrink-0"
            >
              Logout
            </Button>
          </div>

          {/* Categories Navigation - Hamburger Menu (Desktop only, mobile has footer menu) */}
          {categories.length > 0 && (
            <div className="hidden sm:flex items-center justify-between border-t border-gray-200 pt-3 sm:pt-4">
              {/* Hamburger Menu Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDrawer}
                className="flex items-center space-x-2"
              >
                <MenuIcon className="w-4 h-4" />
                <span>Categories</span>
              </Button>

              {/* Selected Category Display */}
              {selectedCategory && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Filtered by category</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCategoryFilter}
                    className="flex-shrink-0 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-[10px] py-4 sm:py-6 md:py-8 pb-20 sm:pb-4">
        {/* Page Title - Current Category */}
        {(selectedCategory || search) && (
          <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <button
                onClick={handleMobileHome}
                className="flex items-center justify-center p-1.5 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0 text-gray-600 hover:text-gray-900"
                aria-label="Home"
              >
                <Home className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {search ? (
                    <>
                      Search: <span className="text-blue-600">{search}</span>
                    </>
                  ) : (
                    getSelectedCategoryName() || 'Products'
                  )}
                </h2>
                {(selectedCategory || search) && (
                  <button
                    onClick={() => {
                      clearCategoryFilter()
                      setSearch('')
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                  >
                    Clear filter and show all products
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full sm:max-w-md pl-10"
            />
          </div>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => {
                const images = getProductImages(product)
                const displayImage = images[0] || null
                
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div 
                      className={`aspect-square relative bg-gray-100 ${displayImage ? 'cursor-pointer' : ''}`}
                      onClick={() => displayImage && openImageModal(product, 0)}
                    >
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            console.error('Image failed to load:', displayImage, product.sku)
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', displayImage, product.sku)
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs">No Image</p>
                          </div>
                        </div>
                      )}
                    </div>
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-base sm:text-lg mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">{product.sku}</p>
                    {product.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base sm:text-lg font-bold text-blue-600">
                        {formatPrice(Number(product.price))}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                        {product.category}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
                <span className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:hidden">
        <div className="flex items-center justify-around px-4 py-2">
          {/* Home Button */}
          <button
            onClick={handleMobileHome}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors min-w-0 flex-1 ${
              !selectedCategory && !search
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-label="Home"
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Categories Button */}
          <button
            onClick={handleMobileCategories}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors min-w-0 flex-1 relative ${
              drawerOpen
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-label="Categories"
          >
            <MenuIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Categories</span>
            {selectedCategory && (
              <span className="absolute top-1 right-1/4 w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </button>

          {/* Search Button */}
          <button
            onClick={handleMobileSearch}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors min-w-0 flex-1 relative ${
              searchFocused || search
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-label="Search"
          >
            <Search className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Search</span>
            {search && (
              <span className="absolute top-1 right-1/4 w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </button>
        </div>
      </footer>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={() => setImageModal(prev => ({ ...prev, isOpen: false }))}
        images={imageModal.images}
        currentIndex={imageModal.currentIndex}
        onNext={nextImage}
        onPrevious={previousImage}
        productName={imageModal.productName}
      />

      {/* Category Drawer */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div 
            className="fixed top-0 left-0 h-full w-80 sm:w-96 bg-white shadow-2xl z-[201] transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col"
            onClick={(e) => {
              // Only stop propagation if clicking on the drawer background itself
              if (e.target === e.currentTarget) {
                e.stopPropagation()
              }
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* All Products Option */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  clearCategoryFilter()
                }}
                className={`w-full text-left px-4 py-3 rounded-md mb-2 transition-colors cursor-pointer ${
                  !selectedCategory
                    ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                }`}
              >
                All Products
              </button>

              {/* Categories List */}
              <div className="space-y-1">
                {categories.map((category) => {
                  const hasChildren = category.children && category.children.length > 0
                  const isOpen = openDropdown === category.id
                  const isSelected = selectedCategory === category.id

                  return (
                    <div
                      key={category.id}
                      ref={(el) => (dropdownRefs.current[category.id] = el)}
                      className="relative"
                    >
                      {hasChildren ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('Category clicked:', category.name, category.id)
                                handleCategoryClick(category.id)
                              }}
                              className={`flex-1 text-left px-4 py-3 rounded-md transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {category.name}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleDropdown(category.id)
                              }}
                              className={`px-2 py-3 rounded-md transition-colors cursor-pointer ${
                                isOpen
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              aria-label={isOpen ? 'Collapse' : 'Expand'}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </div>

                          {/* Subcategories */}
                          {isOpen && (
                            <div 
                              className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 pl-2"
                              onClick={(e) => e.stopPropagation()}
                              style={{ pointerEvents: 'auto' }}
                            >
                              {/* Parent category option */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleCategoryClick(category.id)
                                }}
                                className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                                  isSelected && selectedCategory === category.id
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                All {category.name}
                              </button>

                              {category.children?.map((subcategory) => {
                                const hasSubChildren = subcategory.children && subcategory.children.length > 0
                                const subIsSelected = selectedCategory === subcategory.id
                                const subDropdownId = `${category.id}-${subcategory.id}`

                                return (
                                  <div 
                                    key={subcategory.id} 
                                    className="relative" 
                                    style={{ pointerEvents: 'auto', zIndex: 10 }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {hasSubChildren ? (
                                      <div className="relative" style={{ pointerEvents: 'auto', zIndex: 10 }}>
                                        <div className="flex items-center gap-2" style={{ pointerEvents: 'auto', zIndex: 10 }}>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              console.log('Subcategory button clicked:', subcategory.name, subcategory.id)
                                              if (subcategory.id) {
                                                handleSubcategoryClick(subcategory.id)
                                              } else {
                                                console.error('Subcategory has no ID:', subcategory)
                                              }
                                            }}
                                            onMouseDown={(e) => {
                                              e.stopPropagation()
                                              console.log('Subcategory button mousedown:', subcategory.name, subcategory.id)
                                              // Also trigger navigation on mousedown
                                              if (subcategory.id && e.button === 0) {
                                                console.log('Handling navigation from mousedown for:', subcategory.id)
                                                handleSubcategoryClick(subcategory.id)
                                              }
                                            }}
                                            onTouchStart={(e) => {
                                              e.stopPropagation()
                                            }}
                                            style={{ pointerEvents: 'auto', zIndex: 30, position: 'relative' }}
                                            className={`flex-1 text-left px-4 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                                              subIsSelected
                                                ? 'bg-blue-50 text-blue-700 font-medium'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                          >
                                            {subcategory.name}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              toggleDropdown(subDropdownId)
                                            }}
                                            className={`px-2 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                                              openDropdown === subDropdownId
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                            aria-label={openDropdown === subDropdownId ? 'Collapse' : 'Expand'}
                                          >
                                            <ChevronDown
                                              className={`w-3 h-3 transition-transform ${
                                                openDropdown === subDropdownId ? 'rotate-180' : ''
                                              }`}
                                            />
                                          </button>
                                        </div>

                                        {/* Sub-subcategories */}
                                        {openDropdown === subDropdownId && (
                                          <div 
                                            className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 pl-2"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ pointerEvents: 'auto' }}
                                          >
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                console.log('Clicking parent subcategory:', subcategory.name, subcategory.id)
                                                handleSubcategoryClick(subcategory.id)
                                              }}
                                              onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                              }}
                                              style={{ pointerEvents: 'auto', zIndex: 30 }}
                                              className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                                                subIsSelected
                                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                                  : 'text-gray-700 hover:bg-gray-100'
                                              }`}
                                            >
                                              All {subcategory.name}
                                            </button>
                                            {subcategory.children?.map((subsubcategory) => {
                                              const subsubIsSelected = selectedCategory === subsubcategory.id
                                              return (
                                                <button
                                                  key={subsubcategory.id}
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    console.log('Sub-subcategory clicked:', subsubcategory.name, subsubcategory.id)
                                                    if (subsubcategory.id) {
                                                      handleSubcategoryClick(subsubcategory.id)
                                                    } else {
                                                      console.error('Sub-subcategory has no ID:', subsubcategory)
                                                    }
                                                  }}
                                                onMouseDown={(e) => {
                                                  e.stopPropagation()
                                                  console.log('Sub-subcategory mousedown:', subsubcategory.name, subsubcategory.id)
                                                  // Also trigger navigation on mousedown
                                                  if (subsubcategory.id && e.button === 0) {
                                                    console.log('Handling navigation from mousedown for:', subsubcategory.id)
                                                    handleSubcategoryClick(subsubcategory.id)
                                                  }
                                                }}
                                                  onTouchStart={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    console.log('Sub-subcategory touchstart:', subsubcategory.name, subsubcategory.id)
                                                    if (subsubcategory.id) {
                                                      handleSubcategoryClick(subsubcategory.id)
                                                    }
                                                  }}
                                                  style={{ 
                                                    pointerEvents: 'auto', 
                                                    zIndex: 30, 
                                                    position: 'relative',
                                                    width: '100%'
                                                  }}
                                                  className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                                                    subsubIsSelected
                                                      ? 'bg-blue-50 text-blue-700 font-medium'
                                                      : 'text-gray-700 hover:bg-gray-100'
                                                  }`}
                                                >
                                                  {subsubcategory.name}
                                                </button>
                                              )
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          console.log('Subcategory button clicked (no children):', subcategory.name, subcategory.id)
                                          if (subcategory.id) {
                                            console.log('Calling handleSubcategoryClick with ID:', subcategory.id)
                                            handleSubcategoryClick(subcategory.id)
                                          } else {
                                            console.error('Subcategory has no ID:', subcategory)
                                          }
                                        }}
                                        onMouseDown={(e) => {
                                          e.stopPropagation()
                                          console.log('Subcategory button mousedown (no children):', subcategory.name, subcategory.id)
                                          // Also trigger navigation on mousedown as primary handler since onClick may not fire
                                          if (subcategory.id && e.button === 0) {
                                            // Only for left mouse button (0 = left, 1 = middle, 2 = right)
                                            console.log('Handling navigation from mousedown for:', subcategory.id)
                                            handleSubcategoryClick(subcategory.id)
                                          }
                                        }}
                                        onTouchEnd={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          console.log('Subcategory button touchend (no children):', subcategory.name, subcategory.id)
                                          if (subcategory.id) {
                                            handleSubcategoryClick(subcategory.id)
                                          }
                                        }}
                                        style={{ pointerEvents: 'auto', zIndex: 30, position: 'relative' }}
                                        className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                                          subIsSelected
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                      >
                                        {subcategory.name}
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Category clicked:', category.name, category.id)
                            handleCategoryClick(category.id)
                          }}
                          className={`w-full text-left px-4 py-3 rounded-md transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {category.name}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function GuestCatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <GuestCatalogPageContent />
    </Suspense>
  )
}

