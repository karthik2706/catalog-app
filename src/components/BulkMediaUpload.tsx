'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Image, 
  Video, 
  File, 
  Music,
  Folder,
  Plus,
  Trash2
} from 'lucide-react'

interface UploadFile {
  id: string
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  error: string | null
  result?: {
    id: string
    url: string
    s3Key: string
  }
}

interface BulkMediaUploadProps {
  onUploadComplete?: () => void
  className?: string
}

export default function BulkMediaUpload({ onUploadComplete, className = '' }: BulkMediaUploadProps) {
  const { token } = useAuth()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [folder, setFolder] = useState('general')
  const [customFolder, setCustomFolder] = useState('')
  const [showCustomFolder, setShowCustomFolder] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5 text-red-500" />
    if (file.type.startsWith('audio/')) return <Music className="w-5 h-5 text-green-500" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  const getFileType = (file: File) => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      const droppedFiles = Array.from(e.dataTransfer.files)
      addFiles(droppedFiles)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        return false
      }
      return true
    })

    const uploadFiles: UploadFile[] = validFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
      error: null
    }))

    setFiles(prev => [...prev, ...uploadFiles])
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    // Client-side validation
    const maxFileSize = 50 * 1024 * 1024 // 50MB per file
    const maxTotalSize = 4 * 1024 * 1024 // 4MB total (Vercel limit)
    
    let totalSize = 0
    const oversizedFiles = []
    
    for (const fileObj of files) {
      if (fileObj.file.size > maxFileSize) {
        oversizedFiles.push(`${fileObj.file.name} (${(fileObj.file.size / 1024 / 1024).toFixed(1)}MB)`)
      }
      totalSize += fileObj.file.size
    }
    
    if (oversizedFiles.length > 0) {
      alert(`Files too large:\n${oversizedFiles.join('\n')}\n\nMaximum file size: 50MB per file`)
      return
    }
    
    if (totalSize > maxTotalSize) {
      alert(`Total upload size too large: ${(totalSize / 1024 / 1024).toFixed(1)}MB\n\nMaximum total size: 4MB\n\nPlease upload files individually or reduce file sizes.`)
      return
    }

    setUploading(true)
    const finalFolder = showCustomFolder && customFolder.trim() ? customFolder.trim() : folder

    try {
      const formData = new FormData()
      files.forEach(fileObj => {
        formData.append('files', fileObj.file)
      })
      formData.append('folder', finalFolder)

      const response = await fetch('/api/media/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Upload failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        } catch (parseError) {
          // If we can't parse JSON, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
          if (response.status === 413) {
            errorMessage = 'File too large. Please reduce file size or upload files individually.'
          }
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      if (result.success) {
        // Update files with upload results
        setFiles(prev => prev.map(fileObj => {
          const uploadResult = result.results.find((r: any) => r.name === fileObj.file.name)
          if (uploadResult) {
            return {
              ...fileObj,
              uploading: false,
              uploaded: true,
              result: {
                id: uploadResult.id,
                url: uploadResult.url,
                s3Key: uploadResult.s3Key
              }
            }
          }
          return fileObj
        }))

        // Show errors if any
        if (result.errors && result.errors.length > 0) {
          console.error('Upload errors:', result.errors)
        }

        onUploadComplete?.()
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setFiles(prev => prev.map(fileObj => ({
        ...fileObj,
        uploading: false,
        error: error.message
      })))
    } finally {
      setUploading(false)
    }
  }

  const clearFiles = () => {
    files.forEach(file => {
      URL.revokeObjectURL(file.preview)
    })
    setFiles([])
  }

  const folderOptions = [
    { value: 'general', label: 'General' },
    { value: 'products', label: 'Products' },
    { value: 'banners', label: 'Banners' },
    { value: 'icons', label: 'Icons' },
    { value: 'documents', label: 'Documents' },
    { value: 'custom', label: 'Custom Folder' }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Bulk Media Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Folder Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Upload to Folder:</label>
            <div className="flex flex-wrap gap-2">
              {folderOptions.map(option => (
                <Button
                  key={option.value}
                  variant={folder === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (option.value === 'custom') {
                      setShowCustomFolder(true)
                    } else {
                      setShowCustomFolder(false)
                      setFolder(option.value)
                    }
                  }}
                  className="flex items-center space-x-1"
                >
                  <Folder className="w-4 h-4" />
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
            {showCustomFolder && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Enter custom folder name"
                  value={customFolder}
                  onChange={(e) => setCustomFolder(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md text-sm w-full max-w-xs"
                />
              </div>
            )}
          </div>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-300 hover:border-slate-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Supports images, videos, audio, and documents (max 50MB each)
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="mb-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-700">
                  Files to Upload ({files.length})
                </h3>
                <div className="flex space-x-2">
                  <Button
                    onClick={clearFiles}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                  <Button
                    onClick={uploadFiles}
                    disabled={uploading || files.some(f => f.uploaded)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload All
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map(fileObj => (
                  <div key={fileObj.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getFileIcon(fileObj.file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">
                            {fileObj.file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(fileObj.file.size)} • {getFileType(fileObj.file)}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeFile(fileObj.id)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Preview */}
                    {fileObj.file.type.startsWith('image/') && (
                      <div className="mb-2">
                        <img
                          src={fileObj.preview}
                          alt={fileObj.file.name}
                          className="w-full h-20 object-cover rounded"
                        />
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      {fileObj.uploading && (
                        <Badge variant="outline" className="text-blue-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                          Uploading
                        </Badge>
                      )}
                      {fileObj.uploaded && (
                        <Badge variant="outline" className="text-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Uploaded
                        </Badge>
                      )}
                      {fileObj.error && (
                        <Badge variant="outline" className="text-red-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Error
                        </Badge>
                      )}
                      {!fileObj.uploading && !fileObj.uploaded && !fileObj.error && (
                        <Badge variant="outline" className="text-slate-600">
                          Ready
                        </Badge>
                      )}
                    </div>

                    {fileObj.error && (
                      <p className="text-xs text-red-600 mt-1">{fileObj.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
