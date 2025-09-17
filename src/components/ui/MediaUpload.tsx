'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from './Button'
import { Loading } from './Loading'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  File, 
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react'

export interface MediaFile {
  id: string
  file: File
  preview: string
  url?: string
  thumbnailUrl?: string
  key?: string
  uploading: boolean
  uploaded: boolean
  error?: string
}

interface MediaUploadProps {
  onUploadComplete: (files: MediaFile[] | ((prev: MediaFile[]) => MediaFile[])) => void
  onRemove: (fileId: string) => void
  files: MediaFile[]
  sku: string // Required for proper folder structure
  maxFiles?: number
  acceptedTypes?: string[]
  maxSize?: number
  className?: string
}

export function MediaUpload({
  onUploadComplete,
  onRemove,
  files,
  sku,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*'],
  maxSize = 10 * 1024 * 1024, // 10MB
  className = ''
}: MediaUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
    }
    
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })
    
    if (!isValidType) {
      return `File type ${file.type} is not allowed`
    }
    
    return null
  }

  const createPreview = (file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    } else if (file.type.startsWith('video/')) {
      return URL.createObjectURL(file)
    }
    return ''
  }

  const handleFiles = useCallback((newFiles: FileList) => {
    const fileArray = Array.from(newFiles)
    const validFiles: MediaFile[] = []
    
    fileArray.forEach(file => {
      const error = validateFile(file)
      if (!error) {
        const mediaFile: MediaFile = {
          id: Math.random().toString(36).substring(7),
          file,
          preview: createPreview(file),
          uploading: false,
          uploaded: false,
        }
        validFiles.push(mediaFile)
      } else {
        // Show error for invalid files
        console.error(`Invalid file ${file.name}: ${error}`)
      }
    })
    
    if (validFiles.length > 0) {
      onUploadComplete([...files, ...validFiles])
    }
  }, [files, maxSize, acceptedTypes, onUploadComplete])

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
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const uploadFile = async (mediaFile: MediaFile) => {
    console.log('Starting upload for file:', mediaFile.file.name, 'ID:', mediaFile.id)
    
    const formData = new FormData()
    formData.append('file', mediaFile.file)
    formData.append('sku', sku)

    try {
      // First, set uploading state
      onUploadComplete(prevFiles => {
        const uploadingFile = { ...mediaFile, uploading: true }
        return prevFiles.map(f => f.id === mediaFile.id ? uploadingFile : f)
      })

      const token = localStorage.getItem('token')
      const response = await fetch('/api/upload-media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()
      console.log('Upload response for', mediaFile.file.name, ':', result)

      if (result.success) {
        // Update the file with upload results
        const updatedFile = {
          ...mediaFile,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          key: result.key,
          uploading: false,
          uploaded: true,
        }
        
        console.log('Upload successful for', mediaFile.file.name, 'URL:', result.url)
        
        // Update the files array using callback to get current state
        onUploadComplete(prevFiles => {
          return prevFiles.map(f => f.id === mediaFile.id ? updatedFile : f)
        })
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error for', mediaFile.file.name, ':', error)
      const updatedFile = {
        ...mediaFile,
        uploading: false,
        error: error.message,
      }
      
      onUploadComplete(prevFiles => {
        return prevFiles.map(f => f.id === mediaFile.id ? updatedFile : f)
      })
    }
  }

  const handleUpload = async () => {
    setUploading(true)
    const filesToUpload = files.filter(f => !f.uploaded && !f.uploading && !f.error)
    console.log('Starting upload process for', filesToUpload.length, 'files out of', files.length, 'total files')
    console.log('Files to upload:', filesToUpload.map(f => ({ id: f.id, name: f.file.name, uploaded: f.uploaded, error: f.error })))
    
    for (const file of filesToUpload) {
      // Upload the file (this will call onUploadComplete when done)
      await uploadFile(file)
    }
    
    console.log('Upload process completed')
    setUploading(false)
  }

  const getFileIcon = (file: MediaFile) => {
    if (file.file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />
    } else if (file.file.type.startsWith('video/')) {
      return <Video className="w-4 h-4" />
    }
    return <File className="w-4 h-4" />
  }

  const getFileStatus = (file: MediaFile) => {
    if (file.uploading) {
      return <Loading size="sm" />
    } else if (file.uploaded) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else if (file.error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-2">
          <Upload className="w-8 h-8 mx-auto text-gray-400" />
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
              Click to upload
            </span>
            {' '}or drag and drop
          </div>
          <div className="text-xs text-gray-500">
            Images and videos up to {maxSize / 1024 / 1024}MB
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Files ({files.length}/{maxFiles})
            </h3>
            {files.some(f => !f.uploaded && !f.uploading && !f.error) && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                size="sm"
                variant="primary"
              >
                {uploading ? 'Uploading...' : 'Upload All'}
              </Button>
            )}
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    {getFileStatus(file)}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{(file.file.size / 1024 / 1024).toFixed(2)}MB</span>
                    {file.uploaded && file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-500"
                      >
                        View
                      </a>
                    )}
                  </div>
                  
                  {file.error && (
                    <p className="text-xs text-red-500 mt-1">{file.error}</p>
                  )}
                </div>
                
                <button
                  onClick={() => onRemove(file.id)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
