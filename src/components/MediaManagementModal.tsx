'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Badge } from './ui/Badge'
import { Loading } from './ui/Loading'
import { 
  Upload, 
  Image, 
  Video, 
  File, 
  Trash2, 
  Eye, 
  Download,
  RotateCw,
  Crop,
  Filter,
  Settings,
  Search,
  Grid,
  List,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react'

interface MediaFile {
  id: string
  s3Key: string
  kind: 'image' | 'video' | 'audio' | 'document'
  originalName: string
  mimeType: string
  fileSize: number
  width?: number
  height?: number
  durationMs?: number
  altText?: string
  caption?: string
  sortOrder: number
  isPrimary: boolean
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  url?: string
  thumbnailUrl?: string
  createdAt: string
  updatedAt: string
}

interface Product {
  id: string
  name: string
  sku: string
}

interface MediaManagementModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onMediaUpdate: () => void
}

export default function MediaManagementModal({ 
  isOpen, 
  onClose, 
  product, 
  onMediaUpdate 
}: MediaManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload' | 'analytics'>('gallery')
  const [loading, setLoading] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  
  // Upload state
  const [dragActive, setDragActive] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])

  useEffect(() => {
    if (isOpen && product) {
      fetchMediaFiles()
    }
  }, [isOpen, product])

  const fetchMediaFiles = async () => {
    if (!product) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/media?productId=${product.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setMediaFiles(data.mediaFiles || [])
      }
    } catch (error) {
      console.error('Error fetching media files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (!product || files.length === 0) return

    setUploading(true)
    const newUploadProgress: { [key: string]: number } = {}

    try {
      for (const file of files) {
        const fileId = `${file.name}-${Date.now()}`
        newUploadProgress[fileId] = 0

        // Create FormData
        const formData = new FormData()
        formData.append('file', file)
        formData.append('sku', product.sku)
        formData.append('productId', product.id)

        // Upload file
        const token = localStorage.getItem('token')
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })

        if (response.ok) {
          newUploadProgress[fileId] = 100
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }
      }

      // Refresh media files
      await fetchMediaFiles()
      onMediaUpdate()
      
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
      setUploadProgress({})
      setUploadFiles([])
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      setUploadFiles(files)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setUploadFiles(files)
    }
  }

  const deleteMediaFile = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media file?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchMediaFiles()
        onMediaUpdate()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert(`Delete failed: ${error.message}`)
    }
  }

  const setPrimaryMedia = async (mediaId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/media/${mediaId}/primary`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await fetchMediaFiles()
        onMediaUpdate()
      }
    } catch (error) {
      console.error('Set primary error:', error)
    }
  }

  const updateMediaMetadata = async (mediaId: string, updates: Partial<MediaFile>) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        await fetchMediaFiles()
        onMediaUpdate()
      }
    } catch (error) {
      console.error('Update metadata error:', error)
    }
  }

  const getFileIcon = (kind: string) => {
    switch (kind) {
      case 'image':
        return <Image className="w-5 h-5" />
      case 'video':
        return <Video className="w-5 h-5" />
      case 'audio':
        return <File className="w-5 h-5" />
      default:
        return <File className="w-5 h-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredMediaFiles = mediaFiles.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || file.kind === filterType
    return matchesSearch && matchesFilter
  })

  if (!product) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Media Management - ${product.name}`}
      size="full"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
            <p className="text-sm text-slate-600">SKU: {product.sku}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="default" size="sm">
              {mediaFiles.length} files
            </Badge>
            <Badge variant="success" size="sm">
              {mediaFiles.filter(f => f.status === 'completed').length} ready
            </Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'gallery'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-4 h-4 inline mr-2" />
            Gallery
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </div>

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search media files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="input"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
              </select>
              <div className="flex space-x-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Media Grid/List */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loading />
              </div>
            ) : filteredMediaFiles.length === 0 ? (
              <div className="text-center py-12">
                <Image className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No media files found</p>
                <p className="text-sm text-slate-400">Upload some files to get started</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
                {filteredMediaFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`relative group border border-slate-200 rounded-lg overflow-hidden ${
                      viewMode === 'grid' ? 'aspect-square' : 'flex items-center space-x-4 p-4'
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        {/* Grid View */}
                        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                          {file.kind === 'image' && file.url ? (
                            <img
                              src={file.url}
                              alt={file.altText || file.originalName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-slate-400">
                              {getFileIcon(file.kind)}
                            </div>
                          )}
                        </div>
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deleteMediaFile(file.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Status and Primary Badge */}
                        <div className="absolute top-2 left-2 flex space-x-1">
                          {getStatusIcon(file.status)}
                          {file.isPrimary && (
                            <Badge variant="success" size="sm">Primary</Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* List View */}
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(file.kind)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{file.originalName}</p>
                          <p className="text-sm text-slate-600">
                            {file.kind} • {formatFileSize(file.fileSize)}
                            {file.width && file.height && ` • ${file.width}×${file.height}`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(file.status)}
                          {file.isPrimary && (
                            <Badge variant="success" size="sm">Primary</Badge>
                          )}
                          <Button size="sm" variant="outline" onClick={() => deleteMediaFile(file.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-primary-500 bg-primary-50' : 'border-slate-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Upload Media Files
              </h3>
              <p className="text-slate-600 mb-4">
                Drag and drop files here, or click to select files
              </p>
              <input
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button as="span" variant="outline">
                  Select Files
                </Button>
              </label>
            </div>

            {/* Selected Files */}
            {uploadFiles.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Selected Files</h4>
                <div className="space-y-2">
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type.startsWith('image/') ? 'image' : 'video')}
                        <div>
                          <p className="font-medium text-slate-900">{file.name}</p>
                          <p className="text-sm text-slate-600">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setUploadFiles(files => files.filter((_, i) => i !== index))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleFileUpload(uploadFiles)}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? <Loading size="sm" /> : 'Upload Files'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setUploadFiles([])}
                    disabled={uploading}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center space-x-2">
                  <Image className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Total Files</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-2">
                  {mediaFiles.length}
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Ready</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {mediaFiles.filter(f => f.status === 'completed').length}
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Total Size</span>
                </div>
                <p className="text-2xl font-bold text-purple-900 mt-2">
                  {formatFileSize(mediaFiles.reduce((sum, file) => sum + file.fileSize, 0))}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-3">File Types</h4>
                <div className="space-y-2">
                  {['image', 'video', 'audio', 'document'].map(type => {
                    const count = mediaFiles.filter(f => f.kind === type).length
                    return (
                      <div key={type} className="flex justify-between">
                        <span className="text-sm text-slate-600 capitalize">{type}s</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <h4 className="font-medium text-slate-900 mb-3">Status Overview</h4>
                <div className="space-y-2">
                  {['completed', 'processing', 'pending', 'failed'].map(status => {
                    const count = mediaFiles.filter(f => f.status === status).length
                    return (
                      <div key={status} className="flex justify-between">
                        <span className="text-sm text-slate-600 capitalize">{status}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
