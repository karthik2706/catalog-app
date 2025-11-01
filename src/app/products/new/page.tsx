'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { ProductVariation } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { FadeIn, StaggerWrapper } from '@/components/ui/AnimatedWrapper'
import { CategorySelect } from '@/components/ui/CategorySelect'
import MediaSelectorModal from '@/components/MediaSelectorModal'
import { formatCurrency, getCurrencyIcon } from '@/lib/utils'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  Package, 
  DollarSign, 
  Hash, 
  FileText, 
  Tag, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Palette,
  Ruler,
  Image as ImageIcon,
  Video,
  Star,
  Camera
} from 'lucide-react'

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [variations, setVariations] = useState<ProductVariation[]>([])
  const [newVariation, setNewVariation] = useState({ name: '', value: '', priceAdjustment: 0 })
  const [variationModalOpen, setVariationModalOpen] = useState(false)
  const [categories, setCategories] = useState<Array<{id: string, name: string, parentId?: string, children?: any[]}>>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [clientCurrency, setClientCurrency] = useState<string>('USD')

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
    allowPreorder: false,
    path: '', // S3 path for uploaded asset
  })

  // Media selector modal state
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<any[]>([])

  // Barcode scanner state
  const [isScanning, setIsScanning] = useState(false)
  const [barcodeReader, setBarcodeReader] = useState<any>(null)
  const [scanFieldName, setScanFieldName] = useState<'name' | 'sku' | null>(null)
  
  // Use refs to track scanner state to avoid stale closures
  const readerRef = useRef<any>(null)
  const fieldNameRef = useRef<'name' | 'sku' | null>(null)
  const isInitializingRef = useRef(false)

  // Function to properly stop the camera
  const stopCamera = useCallback(() => {
    // Stop ZXing reader
    if (readerRef.current) {
      try {
        readerRef.current.reset()
      } catch (e) {
        console.warn('Error resetting reader:', e)
      }
      readerRef.current = null
      setBarcodeReader(null)
    }
    
    // Manually stop all video tracks
    const videoElement = document.getElementById('video-barcode-preview') as HTMLVideoElement
    if (videoElement && videoElement.srcObject) {
      try {
        const stream = videoElement.srcObject as MediaStream
        stream.getTracks().forEach(track => {
          track.stop()
        })
        videoElement.srcObject = null
      } catch (e) {
        console.warn('Error stopping video tracks:', e)
      }
    }
    
    setIsScanning(false)
    setScanFieldName(null)
    fieldNameRef.current = null
    isInitializingRef.current = false
  }, [])

  // Load categories and currency on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch('/api/categories', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        } else {
          console.error('Failed to load categories:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }

    const fetchClientCurrency = async () => {
      try {
        const token = localStorage.getItem('token')
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


    loadCategories()
    fetchClientCurrency()
  }, [])

  // Initialize barcode scanner when modal opens and video element is ready
  useEffect(() => {
    if (!isScanning || !scanFieldName) {
      return
    }
    
    // Prevent multiple initializations
    if (isInitializingRef.current || readerRef.current) {
      return
    }
    
    isInitializingRef.current = true
    fieldNameRef.current = scanFieldName

    const initializeScanner = async () => {
      const cleanup = () => {
        // Stop ZXing reader
        if (readerRef.current) {
          try {
            readerRef.current.reset()
          } catch (e) {
            console.warn('Error resetting reader:', e)
          }
          readerRef.current = null
          setBarcodeReader(null)
        }
        
        // Manually stop all video tracks
        const videoElement = document.getElementById('video-barcode-preview') as HTMLVideoElement
        if (videoElement && videoElement.srcObject) {
          try {
            const stream = videoElement.srcObject as MediaStream
            stream.getTracks().forEach(track => {
              track.stop()
            })
            videoElement.srcObject = null
          } catch (e) {
            console.warn('Error stopping video tracks:', e)
          }
        }
        
        setIsScanning(false)
        setScanFieldName(null)
        fieldNameRef.current = null
        isInitializingRef.current = false
      }

      try {
        // Wait for React to render the Modal - give it time to mount
        await new Promise(resolve => requestAnimationFrame(resolve))
        await new Promise(resolve => requestAnimationFrame(resolve))
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Wait for video element to be rendered
        let videoElement = null
        let attempts = 0
        const maxAttempts = 20
        
        while (!videoElement && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100))
          videoElement = document.getElementById('video-barcode-preview')
          attempts++
        }
        
        if (!videoElement) {
          console.error('Video element not found after attempts')
          cleanup()
          alert("Barcode scan failed: element with id 'video-barcode-preview' not found. Please try again.")
          return
        }
        
        // Ensure video element is clean
        if (videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream
          stream.getTracks().forEach(track => track.stop())
          videoElement.srcObject = null
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Import ZXing dynamically
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader
        setBarcodeReader(reader)
        
        // Find the best camera device
        let deviceId: string | undefined = undefined
        
        try {
          const videoInputDevices = await reader.listVideoInputDevices()
          
          if (videoInputDevices.length > 0) {
            // Try to find back camera (preferred for barcode scanning on mobile)
            const backCamera = videoInputDevices.find((device: any) => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('environment')
            )
            if (backCamera) {
              deviceId = backCamera.deviceId
            } else if (videoInputDevices.length > 1) {
              // If multiple cameras and no "back" found, try the last one (usually back on mobile)
              deviceId = videoInputDevices[videoInputDevices.length - 1].deviceId
            } else {
              // Fallback to first camera
              deviceId = videoInputDevices[0].deviceId
            }
          }
        } catch (listDevicesError: any) {
          // On iOS, listVideoInputDevices might fail - that's okay, use default camera
          console.log('Could not list video devices, using default camera:', listDevicesError?.message)
        }
        
        // Final check that element still exists
        const finalCheckElement = document.getElementById('video-barcode-preview')
        if (!finalCheckElement) {
          reader.reset()
          readerRef.current = null
          setBarcodeReader(null)
          cleanup()
          alert("Barcode scan failed: element with id 'video-barcode-preview' not found. Please try again.")
          return
        }
        
        // Start scanning
        reader.decodeFromVideoDevice(deviceId, 'video-barcode-preview', (result: any) => {
          if (result) {
            try {
              const barcodeText = result.getText()
              const fieldName = fieldNameRef.current
              
              // Stop everything first
              if (readerRef.current) {
                try {
                  readerRef.current.reset()
                } catch (e) {
                  console.warn('Error resetting reader:', e)
                }
              }
              
              // Stop video tracks
              const videoEl = document.getElementById('video-barcode-preview') as HTMLVideoElement
              if (videoEl && videoEl.srcObject) {
                const stream = videoEl.srcObject as MediaStream
                stream.getTracks().forEach(track => track.stop())
                videoEl.srcObject = null
              }
              
              // Clear refs and state
              readerRef.current = null
              setBarcodeReader(null)
              isInitializingRef.current = false
              
              // Update UI state
              setIsScanning(false)
              setScanFieldName(null)
              
              // Update the input field
              if (fieldName) {
                setFormData(prev => ({
                  ...prev,
                  [fieldName]: barcodeText
                }))
              }
            } catch (callbackError: any) {
              console.error('Error in barcode scan callback:', callbackError)
              cleanup()
              alert(`Error processing barcode: ${callbackError.message || 'Unknown error'}`)
            }
          }
        }).catch((scanError: any) => {
          console.error('Barcode scan error:', scanError)
          cleanup()
          
          if (scanError.name === 'NotAllowedError' || scanError.message?.includes('permission')) {
            alert('Please allow camera access to scan barcodes. You may need to grant permission in your browser settings.')
          } else if (scanError.name === 'NotFoundError') {
            alert('No camera found on your device')
          } else {
            alert(`Barcode scan failed: ${scanError.message || 'Unknown error'}. Please try again.`)
          }
        })
      } catch (error: any) {
        console.error('Barcode scanner initialization error:', error)
        cleanup()
        
        const errorMessage = error.message || 'Unknown error'
        if (errorMessage.includes("element with id 'video-barcode-preview' not found")) {
          alert(`Barcode scan failed: ${errorMessage}. Please try again.`)
        } else {
          alert(`Failed to initialize barcode scanner: ${errorMessage}. Please try again.`)
        }
      }
    }

    initializeScanner()
    
    // Cleanup function
    return () => {
      if (readerRef.current) {
        try {
          readerRef.current.reset()
        } catch (e) {
          // Ignore errors during cleanup
        }
        readerRef.current = null
      }
      isInitializingRef.current = false
    }
  }, [isScanning, scanFieldName])

  // Cleanup barcode reader on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      setScanFieldName(null)
    }
  }, [stopCamera])


  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleBarcodeScan = (fieldName: 'name' | 'sku' = 'name') => {
    // If already scanning, stop first and wait a moment before starting new scan
    if (isScanning || isInitializingRef.current) {
      stopCamera()
      // Wait for cleanup to complete before starting new scan
      setTimeout(() => {
        setScanFieldName(fieldName)
        setIsScanning(true)
      }, 300)
      return
    }

    // Clean up any existing video element before starting
    const existingVideoElement = document.getElementById('video-barcode-preview') as HTMLVideoElement
    if (existingVideoElement && existingVideoElement.srcObject) {
      const stream = existingVideoElement.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      existingVideoElement.srcObject = null
    }

    // Set state to trigger modal rendering and useEffect initialization
    setScanFieldName(fieldName)
    setIsScanning(true)
  }





  const handleRemoveMedia = (mediaId: string) => {
    setSelectedMedia(prev => prev.filter(media => media.id !== mediaId))
  }

  const handleSetThumbnail = (mediaId: string) => {
    // For now, we'll just track which media is selected as thumbnail
    // The actual thumbnail assignment will happen during product creation
    setSelectedMedia(prev => prev.map(media => ({
      ...media,
      isPrimary: media.id === mediaId
    })))
  }

  // Media selector modal handlers
  const handleOpenMediaModal = () => {
    setIsMediaModalOpen(true)
  }

  const handleCloseMediaModal = () => {
    setIsMediaModalOpen(false)
  }

  const handleMediaSelect = (assets: any[]) => {
    setSelectedMedia(assets)
    setIsMediaModalOpen(false)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Validate required fields
      if (!formData.name || !formData.sku || !formData.price || formData.categoryIds.length === 0) {
        setError('Please fill in all required fields: Name, SKU, Price, and at least one Category')
        return
      }

      // Step 1: Create the product first (without media assignment)
      const productResponse = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryIds[0], // Send first selected category as categoryId
          categoryIds: formData.categoryIds, // Keep categoryIds for multiple categories
          variations,
          // Don't include media in product creation - will be assigned separately
        }),
      })

      if (!productResponse.ok) {
        const errorData = await productResponse.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const productData = await productResponse.json()
      const newProductId = productData.id

      // Step 2: Assign selected media to the newly created product
      if (selectedMedia.length > 0) {
        try {
          const mediaResponse = await fetch('/api/media/assign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              mediaIds: selectedMedia.map(media => media.id),
              productId: newProductId,
              isPrimary: false // We'll handle primary selection separately
            })
          })

          if (!mediaResponse.ok) {
            console.warn('Failed to assign media to product, but product was created successfully')
            // Don't throw error here - product creation was successful
          } else {
            // Set primary thumbnail if one is selected
            const primaryMedia = selectedMedia.find(media => media.isPrimary)
            if (primaryMedia) {
              await fetch('/api/media/assign', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                  mediaIds: [primaryMedia.id],
                  productId: newProductId,
                  isPrimary: true
                })
              })
            } else {
              // If no primary is selected, set the first image as primary
              const firstImage = selectedMedia.find(media => media.kind === 'image')
              if (firstImage) {
                await fetch('/api/media/assign', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  },
                  body: JSON.stringify({
                    mediaIds: [firstImage.id],
                    productId: newProductId,
                    isPrimary: true
                  })
                })
              }
            }
          }
        } catch (mediaError) {
          console.warn('Error assigning media to product:', mediaError)
          // Don't throw error here - product creation was successful
        }
      }

      setSuccess('Product saved successfully!')
      setTimeout(() => {
        router.push('/products')
      }, 1500)
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-[10px] py-4 sm:py-6 lg:py-8">
          <FadeIn>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4 sm:mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/products')}
                  className="flex items-center space-x-2 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Products</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Create New Product</h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1">Add a new product to your inventory</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 sm:space-x-3 sm:flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/products')}
                    className="flex items-center space-x-2 flex-1 sm:flex-initial"
                  >
                    <ArrowLeft className="w-4 h-4 sm:hidden" />
                    <span className="sm:inline">Cancel</span>
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center space-x-2 flex-1 sm:flex-initial"
                  >
                    {saving ? (
                      <>
                        <Loading className="w-4 h-4" />
                        <span className="hidden sm:inline">Saving...</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">Save Product</span>
                        <span className="sm:hidden">Save</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <StaggerWrapper>
                  {/* Basic Information */}
                  <Card className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="p-4 sm:p-6 border-b border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">Basic Information</h2>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <FadeIn delay={0.1}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <span>Product Name</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Input
                                placeholder="Enter the product name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => handleBarcodeScan('name')}
                                disabled={isScanning}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                                title="Scan barcode"
                              >
                                {isScanning ? (
                                  <Loading className="w-5 h-5" />
                                ) : (
                                  <Camera className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </FadeIn>

                        <FadeIn delay={0.2}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <Hash className="w-4 h-4" />
                              <span>SKU</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Input
                                placeholder="Enter unique product identifier"
                                value={formData.sku}
                                onChange={(e) => handleInputChange('sku', e.target.value)}
                                className="w-full pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => handleBarcodeScan('sku')}
                                disabled={isScanning}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                                title="Scan barcode"
                              >
                                {isScanning ? (
                                  <Loading className="w-5 h-5" />
                                ) : (
                                  <Camera className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-slate-500">Enter a unique SKU for this product</p>
                          </div>
                        </FadeIn>
                      </div>

                      <FadeIn delay={0.3}>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Description</label>
                          <textarea
                            placeholder="Product description and details"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                          />
                        </div>
                      </FadeIn>
                    </div>
                  </Card>

                  {/* Pricing & Inventory */}
                  <Card className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="p-4 sm:p-6 border-b border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          {React.createElement(getCurrencyIcon(clientCurrency), { className: "w-4 h-4 text-green-600" })}
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">Pricing & Inventory</h2>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <FadeIn delay={0.1}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              {React.createElement(getCurrencyIcon(clientCurrency), { className: "w-4 h-4" })}
                              <span>Price</span>
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                                className="w-full pl-8"
                                step="0.01"
                                min="0"
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                                {clientCurrency === 'INR' ? '₹' : '$'}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">Product price in {clientCurrency}</p>
                          </div>
                        </FadeIn>


                        <FadeIn delay={0.3}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <BarChart3 className="w-4 h-4" />
                              <span>Stock Level</span>
                            </label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={formData.stockLevel}
                              onChange={(e) => handleInputChange('stockLevel', parseInt(e.target.value) || 0)}
                              className="w-full"
                              min="0"
                            />
                            <p className="text-xs text-slate-500">Current stock quantity</p>
                          </div>
                        </FadeIn>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
                        <FadeIn delay={0.4}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Minimum Stock</span>
                            </label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={formData.minStock}
                              onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
                              className="w-full"
                              min="0"
                            />
                            <p className="text-xs text-slate-500">Minimum stock before reorder alert</p>
                          </div>
                        </FadeIn>

                        <FadeIn delay={0.45}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <Package className="w-4 h-4" />
                              <span>Allow Preorders</span>
                            </label>
                            <select
                              value={formData.allowPreorder ? 'true' : 'false'}
                              onChange={(e) => handleInputChange('allowPreorder', e.target.value === 'true')}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="false">No</option>
                              <option value="true">Yes</option>
                            </select>
                            <p className="text-xs text-slate-500">Allow customers to preorder when out of stock</p>
                          </div>
                        </FadeIn>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
                        <FadeIn delay={0.5}>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center space-x-1">
                              <Settings className="w-4 h-4" />
                              <span>Status</span>
                            </label>
                            <select
                              value={formData.isActive ? 'true' : 'false'}
                              onChange={(e) => handleInputChange('isActive', e.target.value === 'true')}
                              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </div>
                        </FadeIn>
                      </div>
                    </div>
                  </Card>

                  {/* Product Variations */}
                  <Card className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="p-4 sm:p-6 border-b border-slate-200">
                      <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Palette className="w-4 h-4 text-purple-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-slate-900">Product Variations</h2>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setVariationModalOpen(true)}
                          className="flex items-center space-x-2 w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Variation</span>
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6">
                      {variations.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {variations.map((variation) => (
                            <Badge
                              key={variation.id}
                              variant="secondary"
                              className="flex items-center space-x-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-full"
                            >
                              <span>{variation.name}: {variation.value}</span>
                              {variation.priceAdjustment !== 0 && (
                                <span className="text-xs">
                                  ({variation.priceAdjustment > 0 ? '+' : ''}{clientCurrency === 'INR' ? '₹' : '$'}{variation.priceAdjustment})
                                </span>
                              )}
                              <button
                                onClick={() => handleRemoveVariation(variation.id)}
                                className="ml-2 hover:bg-slate-200 rounded-full p-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 mb-4">No variations added yet</p>
                          <p className="text-sm text-slate-400">Click "Add Variation" to add colors, sizes, materials, etc.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </StaggerWrapper>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  {/* Categories Section */}
                  <Card className="mb-4 sm:mb-6">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Tag className="w-4 h-4 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Categories</h3>
                        <span className="text-red-500">*</span>
                      </div>
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
                        loading={categoriesLoading}
                      />
                      {formData.categoryIds.length === 0 && !categoriesLoading && (
                        <p className="text-sm text-slate-500 mt-2">
                          {categories.length === 0 
                            ? 'No categories available. Please contact your administrator to create categories.'
                            : 'Select at least one category for this product'
                          }
                        </p>
                      )}
                    </div>
                  </Card>


                  {/* Media Selection */}
                  <Card className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="p-4 sm:p-6 border-b border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">Product Media</h2>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-slate-600 mb-4">
                            Select images and videos from your media library for this product
                          </p>
                        </div>

                        {/* Media Selection Button */}
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 sm:p-8 text-center hover:border-slate-400 transition-colors">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-slate-900 mb-2">Select Media Files</h3>
                              <p className="text-sm text-slate-600 mb-4">
                                Choose from your existing media library or upload new files
                              </p>
                              <Button
                                onClick={handleOpenMediaModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Select Media
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Selected Media Preview */}
                        {selectedMedia.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-slate-900 mb-3">
                              Selected Media ({selectedMedia.length} file{selectedMedia.length !== 1 ? 's' : ''})
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {selectedMedia.map((media) => (
                                <div key={media.id} className="relative group">
                                  <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                                    {media.kind === 'image' ? (
                                      <img
                                        src={media.thumbnailUrl || media.url}
                                        alt={media.altText || media.originalName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : media.kind === 'video' ? (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                        <Video className="w-8 h-8 text-slate-600" />
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                        <FileText className="w-8 h-8 text-slate-600" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="w-6 h-6 p-0 bg-white/80 hover:bg-white"
                                      onClick={() => handleRemoveMedia(media.id)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="mt-1">
                                    <p className="text-xs text-slate-600 truncate">
                                      {media.originalName}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <Badge variant="outline" className="text-xs">
                                        {media.kind}
                                      </Badge>
                                      {media.kind === 'image' && (
                                        <Button
                                          size="sm"
                                          variant={media.isPrimary ? "default" : "outline"}
                                          className="w-6 h-6 p-0"
                                          onClick={() => handleSetThumbnail(media.id)}
                                        >
                                          <Star className={`w-3 h-3 ${media.isPrimary ? 'text-white' : 'text-slate-600'}`} />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </Card>

                  <Card>
                    <div className="p-4 sm:p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Form Progress</h3>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${formData.name ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <span className="text-sm text-slate-600">Product Name</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${formData.sku ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <span className="text-sm text-slate-600">SKU</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${formData.price > 0 ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <span className="text-sm text-slate-600">Price</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${formData.categoryIds.length > 0 ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <span className="text-sm text-slate-600">Categories</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
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
                placeholder="e.g., Color, Size, Material"
                value={newVariation.name}
                onChange={(e) => setNewVariation(prev => ({ ...prev, name: e.target.value }))}
              />
              <p className="text-xs text-slate-500">Type of variation (e.g., Color, Size, Material)</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Variation Value</label>
              <Input
                placeholder="e.g., Red, Large, Cotton"
                value={newVariation.value}
                onChange={(e) => setNewVariation(prev => ({ ...prev, value: e.target.value }))}
              />
              <p className="text-xs text-slate-500">Specific value for this variation</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Price Adjustment</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newVariation.priceAdjustment}
                  onChange={(e) => setNewVariation(prev => ({ ...prev, priceAdjustment: parseFloat(e.target.value) || 0 }))}
                  className="pl-8"
                  step="0.01"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                  {clientCurrency === 'INR' ? '₹' : '$'}
                </div>
              </div>
              <p className="text-xs text-slate-500">Additional cost for this variation (can be negative for discounts)</p>
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

        {/* Media Selector Modal */}
        <MediaSelectorModal
          isOpen={isMediaModalOpen}
          onClose={handleCloseMediaModal}
          onSelect={handleMediaSelect}
          productName={formData.name || 'New Product'}
          currentMedia={selectedMedia}
        />

        {/* Barcode Scanner Modal */}
        <Modal
          isOpen={isScanning}
          onClose={stopCamera}
          title="Scan Barcode"
          description="Point your camera at the barcode"
          size="full"
          className="!max-w-none !mx-0 !p-0"
          showCloseButton={false}
          closeOnOverlayClick={false}
        >
          <div className="relative w-full h-[80vh] bg-black rounded-lg overflow-hidden">
            <video 
              id="video-barcode-preview"
              className="w-full h-full object-cover"
              playsInline
              autoPlay
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white/50 rounded-lg w-[80%] h-[40%] flex items-center justify-center">
                <span className="text-white/70 text-xs sm:text-sm">Position barcode here</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={stopCamera}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white z-10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
