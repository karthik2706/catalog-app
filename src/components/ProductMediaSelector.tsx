'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import MediaSelectorModal from '@/components/MediaSelectorModal'
import { 
  Image, 
  Video, 
  Plus, 
  X, 
  Eye,
  Download,
  Trash2,
  Edit,
  Star,
  StarOff
} from 'lucide-react'

interface MediaAsset {
  id: string
  kind: string
  s3Key: string
  originalName: string
  mimeType: string
  fileSize: number
  width?: number
  height?: number
  durationMs?: number
  altText?: string
  caption?: string
  isPrimary: boolean
  status: string
  createdAt: string
  updatedAt: string
  url: string
  thumbnailUrl?: string
  folder: string
  assigned: boolean
  productName?: string
  productSku?: string
}

interface ProductMediaSelectorProps {
  productId: string
  productName?: string
  onMediaUpdate?: () => void
  className?: string
}

export default function ProductMediaSelector({
  productId,
  productName,
  onMediaUpdate,
  className = ''
}: ProductMediaSelectorProps) {
  const { token } = useAuth()
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const fetchProductMedia = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/media/assets?assigned=true&productId=${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch product media')
      }

      const data = await response.json()
      // Filter to only show media assigned to this specific product
      const productMedia = data.assets.filter((asset: MediaAsset) => 
        asset.assigned && asset.productSku // Assuming we can identify by productSku or similar
      )
      setMediaAssets(productMedia)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId) {
      fetchProductMedia()
    }
  }, [productId])

  const handleSelectMedia = (selectedAssets: MediaAsset[]) => {
    setMediaAssets(prev => {
      // Add new assets that aren't already assigned
      const newAssets = selectedAssets.filter(selected => 
        !prev.some(existing => existing.id === selected.id)
      )
      return [...prev, ...newAssets]
    })
    onMediaUpdate?.()
  }

  const handleRemoveMedia = async (assetId: string) => {
    try {
      setRemoving(assetId)

      const response = await fetch(`/api/media/assign?mediaIds=${assetId}&productId=${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to remove media')
      }

      setMediaAssets(prev => prev.filter(asset => asset.id !== assetId))
      onMediaUpdate?.()
    } catch (err) {
      console.error('Remove error:', err)
      alert('Failed to remove media asset')
    } finally {
      setRemoving(null)
    }
  }

  const handleSetPrimary = async (assetId: string) => {
    try {
      const response = await fetch('/api/media/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mediaIds: [assetId],
          productId: productId,
          isPrimary: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to set primary media')
      }

      // Update local state
      setMediaAssets(prev => prev.map(asset => ({
        ...asset,
        isPrimary: asset.id === assetId
      })))
      onMediaUpdate?.()
    } catch (err) {
      console.error('Set primary error:', err)
      alert('Failed to set primary media')
    }
  }

  const getFileIcon = (asset: MediaAsset) => {
    switch (asset.kind) {
      case 'image': return <Image className="w-5 h-5 text-blue-500" />
      case 'video': return <Video className="w-5 h-5 text-red-500" />
      default: return <Image className="w-5 h-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Image className="w-5 h-5 text-blue-600" />
              <span>Product Media</span>
            </CardTitle>
            <Button
              onClick={() => setSelectorOpen(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Media
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {mediaAssets.length === 0 ? (
            <div className="text-center py-8">
              <Image className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">No media assigned</h3>
              <p className="text-slate-500 mb-4">
                Add media assets to showcase this product
              </p>
              <Button
                onClick={() => setSelectorOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Select Media
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaAssets.map(asset => (
                <div key={asset.id} className="relative border border-slate-200 rounded-lg overflow-hidden group">
                  {/* Primary Badge */}
                  {asset.isPrimary && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-yellow-500 text-white text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Primary
                      </Badge>
                    </div>
                  )}

                  {/* Preview */}
                  <div className="aspect-square bg-slate-100 flex items-center justify-center">
                    {asset.kind === 'image' ? (
                      <img
                        src={asset.thumbnailUrl || asset.url}
                        alt={asset.altText || asset.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        {getFileIcon(asset)}
                        <p className="text-xs text-slate-500 mt-1">{asset.kind}</p>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-700 truncate mb-1">
                      {asset.originalName}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatFileSize(asset.fileSize)}</span>
                      <Badge variant="outline" className="text-xs">
                        {asset.kind}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 p-0"
                        onClick={() => window.open(asset.url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 p-0"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = asset.url
                          link.download = asset.originalName
                          link.click()
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {!asset.isPrimary && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-8 h-8 p-0"
                          onClick={() => handleSetPrimary(asset.id)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveMedia(asset.id)}
                        disabled={removing === asset.id}
                      >
                        {removing === asset.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Selector Modal */}
      <MediaSelectorModal
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleSelectMedia}
        productId={productId}
        productName={productName}
        currentMedia={mediaAssets}
      />
    </>
  )
}
