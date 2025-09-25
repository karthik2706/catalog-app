'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Eye, Edit, MoreVertical, Play, Image as ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { generateSignedUrl } from '@/lib/aws'

interface MediaItem {
  id?: string
  url?: string
  s3Key?: string
  key?: string
  kind?: string
  fileType?: string
  type?: string
  width?: number
  height?: number
  durationMs?: number
}

interface Product {
  id: string
  name: string
  sku: string
  description?: string
  price: number
  category: string
  stockLevel: number
  minStock: number
  thumbnailUrl?: string
  images?: MediaItem[]
  videos?: MediaItem[]
  media?: MediaItem[]
}

interface ProductTileProps {
  product: Product
  clientCurrency: string
  onInventoryClick: (product: Product) => void
}

export default function ProductTile({ product, clientCurrency, onInventoryClick }: ProductTileProps) {
  const router = useRouter()
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({})
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Generate signed URLs for all media
  useEffect(() => {
    const generateUrls = async () => {
      const urlMap: Record<string, string> = {}
      
      // Process legacy images
      const images = product.images || []
      console.log(`Processing legacy images for ${product.sku}:`, {
        images,
        imageCount: images.length,
        firstImage: images[0],
        firstImageType: typeof images[0]
      })
      
      for (const image of images) {
        let s3Key = null
        let imageUrl = null
        
        if (typeof image === 'string') {
          // If image is a string, it might be a direct S3 key or URL
          if (image.startsWith('http')) {
            imageUrl = image
          } else {
            s3Key = image
          }
        } else if (typeof image === 'object' && image !== null) {
          // If image is an object, look for URL first, then S3 key
          imageUrl = image.url || image.URL || image.src || image.imageUrl
          s3Key = image.s3Key || image.key || image.Key || image.s3_key
        }
        
        // If we have a URL, use it directly
        if (imageUrl) {
          console.log(`Using existing URL for ${product.sku} (legacy image):`, imageUrl)
          // Use the s3Key as the key for the urlMap, or generate one if needed
          const key = s3Key || `image_${images.indexOf(image)}`
          urlMap[key] = imageUrl
        } else if (s3Key) {
          try {
            const signedUrl = await generateSignedUrl(s3Key, 7 * 24 * 60 * 60)
            urlMap[s3Key] = signedUrl
            console.log(`Generated signed URL for ${product.sku} (legacy image):`, {
              s3Key,
              signedUrl: signedUrl.substring(0, 100) + '...'
            })
          } catch (error) {
            console.error(`Error generating signed URL for ${product.sku} (legacy image):`, error)
          }
        } else {
          console.log(`No URL or S3 key found for image in ${product.sku}:`, image)
        }
      }
      
      // Process legacy videos
      const videos = product.videos || []
      for (const video of videos) {
        let s3Key = null
        let videoUrl = null
        
        if (typeof video === 'string') {
          if (video.startsWith('http')) {
            videoUrl = video
          } else {
            s3Key = video
          }
        } else if (typeof video === 'object' && video !== null) {
          videoUrl = video.url || video.URL || video.src || video.videoUrl
          s3Key = video.s3Key || video.key || video.Key || video.s3_key
        }
        
        // If we have a URL, use it directly
        if (videoUrl) {
          console.log(`Using existing URL for ${product.sku} (legacy video):`, videoUrl)
          const key = s3Key || `video_${videos.indexOf(video)}`
          urlMap[key] = videoUrl
        } else if (s3Key) {
          try {
            const signedUrl = await generateSignedUrl(s3Key, 7 * 24 * 60 * 60)
            urlMap[s3Key] = signedUrl
            console.log(`Generated signed URL for ${product.sku} (legacy video):`, {
              s3Key,
              signedUrl: signedUrl.substring(0, 100) + '...'
            })
          } catch (error) {
            console.error(`Error generating signed URL for ${product.sku} (legacy video):`, error)
          }
        }
      }
      
      // Process new media table
      const media = product.media || []
      for (const mediaItem of media) {
        const s3Key = mediaItem.s3Key || mediaItem.key
        const mediaUrl = mediaItem.url || mediaItem.URL || mediaItem.src
        
        // If we have a URL, use it directly
        if (mediaUrl) {
          console.log(`Using existing URL for ${product.sku} (new media):`, mediaUrl)
          const key = s3Key || `media_${media.indexOf(mediaItem)}`
          urlMap[key] = mediaUrl
        } else if (s3Key) {
          try {
            const signedUrl = await generateSignedUrl(s3Key, 7 * 24 * 60 * 60)
            urlMap[s3Key] = signedUrl
            console.log(`Generated signed URL for ${product.sku} (new media):`, {
              s3Key,
              signedUrl: signedUrl.substring(0, 100) + '...'
            })
          } catch (error) {
            console.error(`Error generating signed URL for ${product.sku} (new media):`, error)
          }
        }
      }

      setMediaUrls(urlMap)
      setIsLoading(false)
    }

    generateUrls()
  }, [product])

  // Get display media with proper URL resolution
  const getDisplayMedia = () => {
    // Don't return anything if still loading
    if (isLoading) {
      return null
    }
    
    // Check if we have videos - if so, prioritize video display with thumbnail
    const videos = product.videos || []
    const hasVideos = videos.length > 0
    
    // For products with videos, show video thumbnail with play button overlay
    if (hasVideos && product.thumbnailUrl) {
      const video = videos[0]
      let videoUrl = null
      
      if (typeof video === 'object' && video !== null) {
        videoUrl = video.url || video.URL || video.src || video.videoUrl
      }
      
      return { 
        url: product.thumbnailUrl, 
        type: 'video-thumbnail',
        videoUrl: videoUrl,
        media: video
      }
    }
    
    // Priority: thumbnailUrl > first image > first video > first media
    if (product.thumbnailUrl) {
      return { url: product.thumbnailUrl, type: 'image' }
    }

    // Check images first - handle different possible structures
    const images = product.images || []
    if (images.length > 0) {
      const image = images[0]
      
      // Handle different possible structures for legacy images
      let imageUrl = null
      let s3Key = null
      
      if (typeof image === 'string') {
        // If image is a string, it might be a direct S3 key or URL
        if (image.startsWith('http')) {
          imageUrl = image
        } else {
          s3Key = image
        }
      } else if (typeof image === 'object' && image !== null) {
        // If image is an object, look for various possible properties
        imageUrl = image.url || image.URL || image.src || image.imageUrl
        s3Key = image.s3Key || image.key || image.Key || image.s3_key
      }
      
      // Try to get the URL - prioritize signed URL over direct URL
      const url = (s3Key && mediaUrls[s3Key]) || imageUrl
      if (url) {
        return { url, type: 'image', media: image }
      }
    }

    // Check videos - handle different possible structures
    const productVideos = product.videos || []
    if (productVideos.length > 0) {
      const video = productVideos[0]
      
      let videoUrl = null
      let s3Key = null
      
      if (typeof video === 'string') {
        if (video.startsWith('http')) {
          videoUrl = video
        } else {
          s3Key = video
        }
      } else if (typeof video === 'object' && video !== null) {
        videoUrl = video.url || video.URL || video.src || video.videoUrl
        s3Key = video.s3Key || video.key || video.Key || video.s3_key
      }
      
      // Try to get the URL - prioritize signed URL over direct URL
      const url = (s3Key && mediaUrls[s3Key]) || videoUrl
      if (url) {
        return { url, type: 'video', media: video }
      }
    }

    // Check new media table
    const media = product.media || []
    const imageMedia = media.filter(m => 
      m.kind === 'image' ||
      m.fileType?.startsWith('image/') ||
      m.type?.startsWith('image/') ||
      (m.s3Key && /\.(jpg|jpeg|png|gif|webp)$/i.test(m.s3Key))
    )
    
    if (imageMedia.length > 0) {
      const image = imageMedia[0]
      // Try to get the URL - prioritize signed URL over direct URL
      const url = (image.s3Key && mediaUrls[image.s3Key]) || image.url
      if (url) {
        return { url, type: 'image', media: image }
      }
    }

    const videoMedia = media.filter(m => 
      m.kind === 'video' ||
      m.fileType?.startsWith('video/') ||
      m.type?.startsWith('video/') ||
      (m.s3Key && /\.(mp4|webm|mov)$/i.test(m.s3Key))
    )
    
    if (videoMedia.length > 0) {
      const video = videoMedia[0]
      // Try to get the URL - prioritize signed URL over direct URL
      const url = (video.s3Key && mediaUrls[video.s3Key]) || video.url
      if (url) {
        return { url, type: 'video', media: video }
      }
    }

    return null
  }

  // Get stock status
  const getStockStatus = () => {
    if (product.stockLevel === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const, icon: Package }
    } else if (product.stockLevel <= product.minStock) {
      return { label: 'Low Stock', variant: 'warning' as const, icon: Package }
    } else {
      return { label: 'In Stock', variant: 'default' as const, icon: Package }
    }
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  // Get media count
  const getMediaCount = () => {
    // Count legacy images
    const legacyImageCount = (product.images || []).length
    
    // Count legacy videos
    const legacyVideoCount = (product.videos || []).length
    
    // Count new media table images
    const newImageCount = (product.media?.filter(m => 
      m.kind === 'image' ||
      m.fileType?.startsWith('image/') ||
      m.type?.startsWith('image/') ||
      (m.s3Key && /\.(jpg|jpeg|png|gif|webp)$/i.test(m.s3Key))
    ) || []).length
    
    // Count new media table videos
    const newVideoCount = (product.media?.filter(m => 
      m.kind === 'video' ||
      m.fileType?.startsWith('video/') ||
      m.type?.startsWith('video/') ||
      (m.s3Key && /\.(mp4|webm|mov)$/i.test(m.s3Key))
    ) || []).length

    const imageCount = legacyImageCount + newImageCount
    const videoCount = legacyVideoCount + newVideoCount

    return { imageCount, videoCount, total: imageCount + videoCount }
  }

  const displayMedia = getDisplayMedia()
  const stockStatus = getStockStatus()
  const mediaCount = getMediaCount()
  const StatusIcon = stockStatus.icon

  // Debug logging for KB-002
  if (product.sku === 'KB-002') {
    console.log('ProductTile Debug for KB-002:', {
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        thumbnailUrl: product.thumbnailUrl,
        images: product.images,
        videos: product.videos,
        media: product.media
      },
      displayMedia,
      mediaUrls,
      mediaCount,
      isLoading,
      allMediaSources: {
        images: product.images || [],
        videos: product.videos || [],
        media: product.media || []
      }
    })
  }

  return (
    <Card className="card-hover group">
      <CardContent className="p-[12px]">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/products/${product.id}`)}
              title="View Product"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/products/${product.id}/edit`)}
              title="Edit Product"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onInventoryClick(product)}
              title="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {/* Product Media - 16:9 aspect ratio */}
          <div className="w-full aspect-video bg-slate-100 rounded-lg overflow-hidden relative">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : displayMedia ? (
              <>
                {displayMedia.type === 'video' ? (
                  <video
                    src={displayMedia.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : displayMedia.type === 'video-thumbnail' ? (
                  <>
                    <img
                      src={displayMedia.url}
                      alt={`${product.name} - Video Thumbnail`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Video thumbnail load error:', {
                          src: displayMedia.url,
                          productSku: product.sku,
                          error: e
                        })
                        setImageError(true)
                      }}
                      onLoad={() => {
                        setImageError(false)
                        console.log('Video thumbnail loaded successfully:', {
                          src: displayMedia.url,
                          productSku: product.sku,
                          hasVideoUrl: !!displayMedia.videoUrl
                        })
                      }}
                    />
                    {/* Video play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      </div>
                    </div>
                    {/* Video indicator badge */}
                    <div className="absolute top-2 right-2">
                      <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                        VIDEO
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={displayMedia.url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    onLoad={() => {
                      setImageError(false)
                      console.log('Image loaded successfully:', {
                        src: displayMedia.url,
                        productSku: product.sku
                      })
                    }}
                  />
                )}
                
                {/* Video play icon for direct video display */}
                {displayMedia.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Image unavailable</p>
                </div>
              </div>
            )}

          </div>

          {/* Product Info */}
          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors text-sm">
              {product.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              SKU: {product.sku}
            </p>
            {product.description && (
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Category and Status */}
          <div className="flex items-center justify-between">
            <Badge variant="default" size="sm" className="text-xs">
              {product.category}
            </Badge>
            <Badge variant={stockStatus.variant} size="sm" className="text-xs">
              <StatusIcon className="w-3 h-3 mr-1" />
              {stockStatus.label}
            </Badge>
          </div>

          {/* Price and Stock */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(Number(product.price), clientCurrency)}
              </p>
              <p className="text-xs text-slate-500">
                Stock: {product.stockLevel}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Min Stock</p>
              <p className="text-sm font-medium text-slate-900">{product.minStock}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
