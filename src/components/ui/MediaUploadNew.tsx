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
  onFilesChange: (files: MediaFile[]) => void
  files: MediaFile[]
  sku: string
  maxFiles?: number
  acceptedTypes?: string[]
  maxSize?: number
  className?: string
}

export function MediaUploadNew({
  onFilesChange,
  files,
  sku,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*'],
  maxSize = 50 * 1024 * 1024, // 50MB
  className = ''
}: MediaUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateId = () => Math.random().toString(36).substring(2, 15)

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    }
    
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })
    
    if (!isValidType) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`
    }
    
    return null
  }

  const createMediaFile = (file: File): MediaFile => {
    const validationError = validateFile(file)
    return {
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
      error: validationError || undefined
    }
  }

  const handleFiles = useCallback((newFiles: FileList) => {
    const fileArray = Array.from(newFiles)
    const validFiles = fileArray.filter(file => !validateFile(file))
    
    if (files.length + validFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    const newMediaFiles = validFiles.map(createMediaFile)
    onFilesChange([...files, ...newMediaFiles])
  }, [files, maxFiles, onFilesChange])

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

  const uploadFile = async (mediaFile: MediaFile): Promise<MediaFile> => {
    console.log('Uploading file:', mediaFile.file.name, 'ID:', mediaFile.id)
    
    const formData = new FormData()
    formData.append('file', mediaFile.file)
    formData.append('sku', sku)

    try {
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
        return {
          ...mediaFile,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          key: result.key,
          uploading: false,
          uploaded: true,
        }
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Upload error for', mediaFile.file.name, ':', error)
      return {
        ...mediaFile,
        uploading: false,
        error: error.message,
      }
    }
  }

  const handleUpload = async () => {
    const filesToUpload = files.filter(f => !f.uploaded && !f.uploading && !f.error)
    
    if (filesToUpload.length === 0) return

    setUploading(true)
    console.log('Starting upload for', filesToUpload.length, 'files')

    // Update all files to uploading state
    const uploadingFiles = files.map(f => 
      filesToUpload.some(ftu => ftu.id === f.id) 
        ? { ...f, uploading: true }
        : f
    )
    onFilesChange(uploadingFiles)

    // Upload files sequentially
    const updatedFiles = [...files]
    for (const file of filesToUpload) {
      const index = updatedFiles.findIndex(f => f.id === file.id)
      if (index !== -1) {
        const result = await uploadFile(file)
        updatedFiles[index] = result
        onFilesChange([...updatedFiles])
      }
    }

    console.log('Upload completed')
    setUploading(false)
  }

  const handleRemove = (fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId))
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
    if (file.error) {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    } else if (file.uploaded) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else if (file.uploading) {
      return <Loading className="w-4 h-4" />
    }
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-300 hover:border-slate-400'
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
          <Upload className="w-8 h-8 mx-auto text-slate-400" />
          <div className="text-sm text-slate-600">
            <span className="font-medium text-primary-600 hover:text-primary-500 cursor-pointer">
              Click to upload
            </span>
            {' '}or drag and drop
          </div>
          <div className="text-xs text-slate-500">
            {acceptedTypes.join(', ')} up to {Math.round(maxSize / 1024 / 1024)}MB
          </div>
        </div>
      </div>

      {/* Upload Button */}
      {files.some(f => !f.uploaded && !f.uploading && !f.error) && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          loading={uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : `Upload ${files.filter(f => !f.uploaded && !f.uploading && !f.error).length} files`}
        </Button>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Files ({files.length})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {Math.round(file.file.size / 1024)}KB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getFileStatus(file)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(file.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
