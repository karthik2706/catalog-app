'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
  Eye,
  Download,
  Trash2,
  Edit,
  Check,
  X
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
  productName?: string
  productSku?: string
}

interface MediaLibraryProps {
  onSelectMedia?: (assets: MediaAsset[]) => void
  selectionMode?: boolean
  selectedAssets?: string[]
  className?: string
}

export default function MediaLibrary({ 
  onSelectMedia, 
  selectionMode = false, 
  selectedAssets = [], 
  className = '' 
}: MediaLibraryProps) {
  const { token } = useAuth()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedAssets)
  const [stats, setStats] = useState<any>(null)

  const fetchAssets = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24'
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
      setTotalPages(data.pagination.pages)
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [page, search, typeFilter])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getUniqueFileName = (s3Key: string) => {
    return s3Key.split('/').pop() || s3Key
  }

  const handleSelectAsset = (assetId: string) => {
    if (!selectionMode) return

    setSelectedIds(prev => {
      const newSelection = prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
      
      const selectedAssets = assets.filter(asset => newSelection.includes(asset.id))
      onSelectMedia?.(selectedAssets)
      
      return newSelection
    })
  }

  const handleSelectAll = () => {
    if (!selectionMode) return

    const allIds = assets.map(asset => asset.id)
    setSelectedIds(allIds)
    onSelectMedia?.(assets)
  }

  const handleDeselectAll = () => {
    if (!selectionMode) return

    setSelectedIds([])
    onSelectMedia?.([])
  }

  const deleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this media asset?')) return

    try {
      const response = await fetch(`/api/media/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (response.ok) {
        setAssets(prev => prev.filter(asset => asset.id !== assetId))
      } else {
        throw new Error('Failed to delete asset')
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete asset')
    }
  }

  if (loading && assets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Media Library</h2>
          <p className="text-sm sm:text-base text-slate-600">Manage your media assets</p>
        </div>
        {selectionMode && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial"
            >
              <Check className="w-4 h-4 mr-1" />
              Select All
            </Button>
            <Button
              onClick={handleDeselectAll}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial"
            >
              <X className="w-4 h-4 mr-1" />
              Deselect All
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{stats.total ?? 0}</div>
              <div className="text-xs sm:text-sm text-slate-600">Total Assets</div>
            </CardContent>
          </Card>
          {Object.entries(stats.byType || {}).map(([type, data]: [string, any]) => (
            <Card key={type}>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl font-bold text-slate-900">{data?.count ?? 0}</div>
                <div className="text-xs sm:text-sm text-slate-600 capitalize">{type}s</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
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
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-xs sm:text-sm w-full sm:w-auto"
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
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Assets Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
          {assets.map(asset => (
            <div
              key={asset.id}
              className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedIds.includes(asset.id)
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => handleSelectAsset(asset.id)}
            >
              {/* Selection Indicator */}
              {selectionMode && selectedIds.includes(asset.id) && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
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
                <p className="text-[10px] sm:text-xs font-medium text-slate-700 truncate" title={asset.originalName || ''}>
                  {getUniqueFileName(asset.s3Key || '')}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden sm:block" title={asset.originalName || ''}>
                  Original: {asset.originalName || 'N/A'}
                </p>
                <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                  <span className="text-[10px] sm:text-xs text-slate-500">
                    {formatFileSize(asset.fileSize ?? 0)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!selectionMode && (
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-md p-0.5 sm:p-1 shadow-sm">
                  <div className="flex space-x-0.5 sm:space-x-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-5 h-5 sm:w-6 sm:h-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(asset.url, '_blank')
                      }}
                    >
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-5 h-5 sm:w-6 sm:h-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        const link = document.createElement('a')
                        link.href = asset.url
                        link.download = asset.originalName
                        link.click()
                      }}
                    >
                      <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-5 h-5 sm:w-6 sm:h-6 p-0 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteAsset(asset.id)
                      }}
                    >
                      <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {assets.map(asset => (
            <div
              key={asset.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                selectedIds.includes(asset.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => handleSelectAsset(asset.id)}
            >
              {/* Selection Indicator */}
              {selectionMode && (
                <div className="mr-2 sm:mr-4 flex-shrink-0">
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 border-2 rounded ${
                    selectedIds.includes(asset.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-slate-300'
                  }`}>
                    {selectedIds.includes(asset.id) && (
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    )}
                  </div>
                </div>
              )}

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
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base text-slate-700 truncate" title={asset.originalName || ''}>
                      {getUniqueFileName(asset.s3Key || '')}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 truncate hidden sm:block" title={asset.originalName || ''}>
                      Original: {asset.originalName || 'N/A'}
                    </p>
                  </div>
                  {asset.isPrimary && (
                    <Badge variant="outline" className="text-xs text-blue-600 flex-shrink-0">
                      Primary
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:space-x-4 mt-1">
                  <span className="text-xs sm:text-sm text-slate-500">
                    {formatFileSize(asset.fileSize ?? 0)}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500">
                    {asset.createdAt ? formatDate(asset.createdAt) : 'Unknown date'}
                  </span>
                  {asset.productName && (
                    <Badge
                      variant="outline"
                      className="text-xs text-green-600"
                    >
                      <span className="flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-[100px] sm:max-w-none">{asset.productName}</span>
                      </span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!selectionMode && (
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(asset.url, '_blank')
                    }}
                    className="flex-1 sm:flex-initial"
                  >
                    <Eye className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      const link = document.createElement('a')
                      link.href = asset.url
                      link.download = asset.originalName || 'download'
                      link.click()
                    }}
                    className="flex-1 sm:flex-initial"
                  >
                    <Download className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 flex-1 sm:flex-initial"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteAsset(asset.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>
          <span className="text-xs sm:text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="w-full sm:w-auto"
          >
            Next
          </Button>
        </div>
      )}

      {/* Empty State */}
      {assets.length === 0 && !loading && (
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
    </div>
  )
}
