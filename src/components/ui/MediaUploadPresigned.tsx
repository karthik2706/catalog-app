'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { MediaFile } from './MediaUploadNew'
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

interface MediaUploadPresignedProps {
  onFilesChange: (files: MediaFile[]) => void
  files: MediaFile[]
  sku: string
  maxFiles?: number
  acceptedTypes?: string[]
  maxSize?: number
  className?: string
}

export function MediaUploadPresigned({ 
  onFilesChange, 
  files,
  sku, 
  maxFiles = 10, 
  acceptedTypes = ['image/*', 'video/*'],
  maxSize = 50 * 1024 * 1024,
  className = '' 
}: MediaUploadPresignedProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const newMediaFiles: MediaFile[] = acceptedFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
      error: null,
    }))

    const updatedFiles = [...files, ...newMediaFiles]
    onFilesChange(updatedFiles)

    // Start uploading files
    await uploadFiles(newMediaFiles)
  }, [files, onFilesChange, sku])

  const uploadFiles = async (filesToUpload: MediaFile[]) => {
    setUploading(true)
    
    for (const mediaFile of filesToUpload) {
      try {
        // Update file status to uploading
        const updatedFiles = files.map(f => 
          f.id === mediaFile.id 
            ? { ...f, uploading: true, error: null }
            : f
        )
        onFilesChange(updatedFiles)

        // Get pre-signed URL
        const presignedResponse = await fetch('/api/upload-presigned', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            fileName: mediaFile.file.name,
            fileType: mediaFile.file.type,
            fileSize: mediaFile.file.size,
            sku: sku,
          }),
        })

        if (!presignedResponse.ok) {
          const errorData = await presignedResponse.json()
          throw new Error(errorData.error || 'Failed to get upload URL')
        }

        const { signedUrl, key } = await presignedResponse.json()

        // Upload file directly to S3
        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          body: mediaFile.file,
          headers: {
            'Content-Type': mediaFile.file.type,
          },
        })

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
        }

        // Generate the final URL
        const finalUrl = `https://quick-stock-media.s3.us-east-1.amazonaws.com/${key}`

        // Update file status to uploaded
        const uploadedFiles = files.map(f => 
          f.id === mediaFile.id 
            ? { 
                ...f, 
                uploading: false, 
                uploaded: true, 
                url: finalUrl,
                key: key,
                error: null 
              }
            : f
        )
        onFilesChange(uploadedFiles)

        // Update progress
        setUploadProgress(prev => ({ ...prev, [mediaFile.id]: 100 }))

      } catch (error: any) {
        console.error('Upload error for', mediaFile.file.name, ':', error)
        
        // Update file status to error
        const errorFiles = files.map(f => 
          f.id === mediaFile.id 
            ? { 
                ...f, 
                uploading: false, 
                uploaded: false, 
                error: error.message 
              }
            : f
        )
        onFilesChange(errorFiles)
      }
    }

    setUploading(false)
  }

  const removeFile = (fileId: string) => {
    const updated = files.filter(f => f.id !== fileId)
    onFilesChange(updated)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.webm'],
    },
    maxFiles: maxFiles - files.length,
    maxSize: maxSize,
  })

  const getFileIcon = (file: MediaFile) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Upload Media Files'}
        </h3>
        <p className="text-slate-500 mb-4">
          Drag and drop files here, or click to select files
        </p>
        <p className="text-sm text-slate-400">
          Supports images (JPEG, PNG, WebP) and videos (MP4, WebM) up to 50MB
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Uploaded Files</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {file.uploading && (
                    <div className="flex items-center space-x-2">
                      <Loading size="sm" />
                      <span className="text-xs text-slate-500">Uploading...</span>
                    </div>
                  )}
                  
                  {file.uploaded && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Uploaded</span>
                    </div>
                  )}
                  
                  {file.error && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs">Error</span>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {files.some(f => f.error) && (
        <div className="space-y-2">
          {files
            .filter(f => f.error)
            .map((file) => (
              <div key={file.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    {file.name}
                  </span>
                </div>
                <p className="text-sm text-red-600 mt-1">{file.error}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
