'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Image, 
  Video, 
  File, 
  Music,
  Package,
  Check,
  X,
  Plus,
  Minus
} from 'lucide-react'
import VideoPreview from './VideoPreview'

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

interface MediaSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (assets: MediaAsset[]) => void
  productId?: string
  productName?: string
  currentMedia?: MediaAsset[]
  className?: string
}

export default function MediaSelectorModal({
  isOpen,
  onClose,
  onSelect,
  productId,
  productName,
  currentMedia = [],
  className = ''
}: MediaSelectorModalProps) {
  const { token } = useAuth()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>(currentMedia)
  const [assigning, setAssigning] = useState(false)

  const fetchAssets = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: '1',
        limit: '100' // Get more assets for selection
      })

      if (search) params.append('search', search)
      if (typeFilter !== 'all') params.append('type', typeFilter)

      const response = await fetch(`/api/media/assets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch media assets')
      }

      const data = await response.json()
      setAssets(data.assets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAssets()
      setSelectedAssets(currentMedia)
    }
  }, [isOpen, search, typeFilter])

  const getFileIcon = (asset: MediaAsset) => {
    switch (asset.kind) {
      case 'image': return <Image className="w-5 h-5 text-blue-500" />
      case 'video': return <Video className="w-5 h-5 text-red-500" />
      case 'audio': return <Music className="w-5 h-5 text-green-500" />
      default: return <File className="w-5 h-5 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSelectAsset = (asset: MediaAsset) => {
    setSelectedAssets(prev => {
      const isSelected = prev.some(selected => selected.id === asset.id)
      if (isSelected) {
        return prev.filter(selected => selected.id !== asset.id)
      } else {
        return [...prev, asset]
      }
    })
  }

  const handleAssignMedia = async () => {
    if (!productId || selectedAssets.length === 0) return

    try {
      setAssigning(true)

      const response = await fetch('/api/media/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mediaIds: selectedAssets.map(asset => asset.id),
          productId: productId,
          isPrimary: false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assign media')
      }

      const result = await response.json()
      onSelect(result.assignedMedia)
      onClose()
    } catch (err) {
      console.error('Assign error:', err)
      alert('Failed to assign media assets')
    } finally {
      setAssigning(false)
    }
  }

  const handleSelectMedia = () => {
    if (selectedAssets.length === 0) return
    onSelect(selectedAssets)
    onClose()
  }

  const isAssetSelected = (asset: MediaAsset) => {
    return selectedAssets.some(selected => selected.id === asset.id)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Select Media Assets</h2>
            {productName && (
              <p className="text-xs sm:text-sm text-slate-600 truncate">Assigning to: {productName}</p>
            )}
          </div>
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            <Badge variant="outline" className="flex-shrink-0">
              {selectedAssets.length} selected
            </Badge>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 sm:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 min-w-0 sm:min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search media assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm w-full sm:w-auto"
          >
            <option value="all">All Types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-slate-300 rounded-md w-full sm:w-auto">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none flex-1 sm:flex-initial"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none flex-1 sm:flex-initial"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Assets Grid/List */}
        {!loading && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 max-h-[50vh] sm:max-h-96 overflow-y-auto">
                {assets.map(asset => (
                  <div
                    key={asset.id}
                    className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
                      isAssetSelected(asset)
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => handleSelectAsset(asset)}
                  >
                    {/* Selection Indicator */}
                    {isAssetSelected(asset) && (
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
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
                      ) : asset.kind === 'video' ? (
                        <VideoPreview
                          src={asset.url}
                          alt={asset.altText || asset.originalName}
                          className="w-full h-full"
                          showControls={true}
                          muted={true}
                          poster={asset.thumbnailUrl}
                        />
                      ) : (
                        <div className="text-center">
                          {getFileIcon(asset)}
                          <p className="text-xs text-slate-500 mt-1">{asset.kind}</p>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-1.5 sm:p-2">
                      <p className="text-xs font-medium text-slate-700 truncate">
                        {asset.originalName}
                      </p>
                      <div className="flex items-center justify-between mt-1 gap-1">
                        <Badge
                          variant="outline"
                          className={`text-xs flex-shrink-0 ${
                            asset.assigned ? 'text-green-600' : 'text-slate-500'
                          }`}
                        >
                          <span className="hidden sm:inline">{asset.assigned ? 'Assigned' : 'Unassigned'}</span>
                          <span className="sm:hidden">{asset.assigned ? '✓' : '-'}</span>
                        </Badge>
                        <span className="text-xs text-slate-500 truncate text-right">
                          {formatFileSize(asset.fileSize)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] sm:max-h-96 overflow-y-auto">
                {assets.map(asset => (
                  <div
                    key={asset.id}
                    className={`flex items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                      isAssetSelected(asset)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => handleSelectAsset(asset)}
                  >
                    {/* Selection Indicator */}
                    <div className="mr-2 sm:mr-4 flex-shrink-0">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 border-2 rounded ${
                        isAssetSelected(asset)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-slate-300'
                      }`}>
                        {isAssetSelected(asset) && (
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded flex items-center justify-center mr-2 sm:mr-4 overflow-hidden flex-shrink-0">
                      {asset.kind === 'image' ? (
                        <img
                          src={asset.thumbnailUrl || asset.url}
                          alt={asset.altText || asset.originalName}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : asset.kind === 'video' ? (
                        <VideoPreview
                          src={asset.url}
                          alt={asset.altText || asset.originalName}
                          className="w-full h-full rounded"
                          showControls={false}
                          muted={true}
                          poster={asset.thumbnailUrl}
                        />
                      ) : (
                        getFileIcon(asset)
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-slate-700 truncate">
                          {asset.originalName}
                        </p>
                        {asset.isPrimary && (
                          <Badge variant="outline" className="text-xs text-blue-600">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-slate-500">
                          {formatFileSize(asset.fileSize)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            asset.assigned ? 'text-green-600' : 'text-slate-500'
                          }`}
                        >
                          {asset.assigned ? (
                            <span className="flex items-center">
                              <Package className="w-3 h-3 mr-1" />
                              {asset.productName}
                            </span>
                          ) : (
                            'Unassigned'
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {assets.length === 0 && (
              <div className="text-center py-12">
                <Image className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">No media assets found</h3>
                <p className="text-slate-500">
                  {search || typeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Upload some media assets to get started'
                  }
                </p>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-4 border-t">
          <div className="text-sm text-slate-600 text-center sm:text-left">
            {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={productId ? handleAssignMedia : handleSelectMedia}
              disabled={selectedAssets.length === 0 || assigning}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {assigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">{productId ? 'Assigning...' : 'Selecting...'}</span>
                  <span className="sm:hidden">{productId ? 'Assigning' : 'Selecting'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">
                    {productId ? 'Assign' : 'Select'} {selectedAssets.length} Asset{selectedAssets.length !== 1 ? 's' : ''}
                  </span>
                  <span className="sm:hidden">
                    {productId ? 'Assign' : 'Select'} ({selectedAssets.length})
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
