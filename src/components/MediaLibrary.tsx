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
  assigned: boolean
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
  const [assignedFilter, setAssignedFilter] = useState('all')
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
      if (assignedFilter !== 'all') params.append('assigned', assignedFilter)

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
  }, [page, search, typeFilter, assignedFilter])

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
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Media Library</h2>
          <p className="text-slate-600">Manage your media assets</p>
        </div>
        {selectionMode && (
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
            >
              <Check className="w-4 h-4 mr-1" />
              Select All
            </Button>
            <Button
              onClick={handleDeselectAll}
              variant="outline"
              size="sm"
            >
              <X className="w-4 h-4 mr-1" />
              Deselect All
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-sm text-slate-600">Total Assets</div>
            </CardContent>
          </Card>
          {Object.entries(stats.byType).map(([type, data]: [string, any]) => (
            <Card key={type}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-slate-900">{data.count}</div>
                <div className="text-sm text-slate-600 capitalize">{type}s</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
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
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
            </select>

            {/* Assigned Filter */}
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="all">All Assets</option>
              <option value="false">Unassigned</option>
              <option value="true">Assigned</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-slate-300 rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
              <div className="p-2">
                <p className="text-xs font-medium text-slate-700 truncate">
                  {asset.originalName}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      asset.assigned ? 'text-green-600' : 'text-slate-500'
                    }`}
                  >
                    {asset.assigned ? 'Assigned' : 'Unassigned'}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {formatFileSize(asset.fileSize)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!selectionMode && (
                <div className="absolute top-2 left-2 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-6 h-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(asset.url, '_blank')
                      }}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-6 h-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        const link = document.createElement('a')
                        link.href = asset.url
                        link.download = asset.originalName
                        link.click()
                      }}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-6 h-6 p-0 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteAsset(asset.id)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {assets.map(asset => (
            <div
              key={asset.id}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                selectedIds.includes(asset.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => handleSelectAsset(asset.id)}
            >
              {/* Selection Indicator */}
              {selectionMode && (
                <div className="mr-4">
                  <div className={`w-5 h-5 border-2 rounded ${
                    selectedIds.includes(asset.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-slate-300'
                  }`}>
                    {selectedIds.includes(asset.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center mr-4 overflow-hidden">
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
                  <span className="text-sm text-slate-500">
                    {formatDate(asset.createdAt)}
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

              {/* Actions */}
              {!selectionMode && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(asset.url, '_blank')
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      const link = document.createElement('a')
                      link.href = asset.url
                      link.download = asset.originalName
                      link.click()
                    }}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
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
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
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
            {search || typeFilter !== 'all' || assignedFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Upload some media assets to get started'
            }
          </p>
        </div>
      )}
    </div>
  )
}
