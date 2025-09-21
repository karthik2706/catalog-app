'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { MediaFile } from './MediaUploadNew'
import { Button } from './Button'
import { Loading } from './Loading'
import { S3_CONFIG } from '@/lib/aws'
import { useAuth } from '@/components/AuthProvider'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  File, 
  FileText,
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
  clientId?: string // For SUPER_ADMIN users
}

export function MediaUploadPresigned({ 
  onFilesChange, 
  files,
  sku, 
  maxFiles = 10, 
  acceptedTypes = ['image/*', 'video/*'],
  maxSize = 50 * 1024 * 1024,
  className = '',
  clientId: propClientId
}: MediaUploadPresignedProps) {
  const { token, user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('Files dropped/selected:', acceptedFiles.length, acceptedFiles)
    console.log('Current SKU:', sku)
    if (acceptedFiles.length === 0) {
      console.log('No files accepted')
      return
    }

    if (!sku || sku.trim() === '') {
      console.error('SKU is required for file upload')
      // Still add files to the list but don't upload them
      const newMediaFiles: MediaFile[] = acceptedFiles.map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        uploaded: false,
        error: 'SKU is required for upload',
      }))
      const updatedFiles = [...files, ...newMediaFiles]
      onFilesChange(updatedFiles)
      return
    }

    const newMediaFiles: MediaFile[] = acceptedFiles.map(file => {
      const mediaFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        uploaded: false,
        error: null,
      }
      console.log('Created media file:', mediaFile)
      return mediaFile
    })

    console.log('Created media files:', newMediaFiles)
    const updatedFiles = [...files, ...newMediaFiles]
    console.log('Updated files list:', updatedFiles.map(f => ({ id: f.id, name: f.file?.name, uploaded: f.uploaded })))
    onFilesChange(updatedFiles)

    // Start uploading files with the updated files list
    console.log('Starting upload process...')
    await uploadFiles(newMediaFiles, updatedFiles)
  }, [files, onFilesChange, sku, token, user, propClientId])

  const uploadFiles = async (filesToUpload: MediaFile[], currentFilesList: MediaFile[]) => {
    console.log('uploadFiles called with:', filesToUpload.length, 'files')
    console.log('Current token:', token ? 'Present' : 'Missing')
    console.log('Token from localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing')
    
    // Filter out files that don't have a valid file property
    const validFilesToUpload = filesToUpload.filter(mediaFile => {
      if (!mediaFile.file) {
        console.warn('Skipping MediaFile without file property:', mediaFile)
        return false
      }
      return true
    })
    
    if (validFilesToUpload.length === 0) {
      console.log('No valid files to upload')
      return
    }
    
    console.log('Valid files to upload:', validFilesToUpload.length)
    
    // Check if user is authenticated - try context token first, then localStorage
    const authToken = token || localStorage.getItem('token')
    if (!authToken) {
      console.error('No authentication token available')
      const errorFiles = filesToUpload.map(f => ({
        ...f,
        uploading: false,
        error: 'Authentication required. Please log in.'
      }))
      const updatedFiles = currentFilesList.map(f => {
        const errorFile = errorFiles.find(ef => ef.id === f.id)
        return errorFile || f
      })
      onFilesChange(updatedFiles)
      return
    }
    
    setUploading(true)
    
    // Use the provided current files list instead of the component state
    let currentFiles = [...currentFilesList]
    
    for (const mediaFile of validFilesToUpload) {
      // Safety check for file property
      if (!mediaFile.file) {
        console.error('MediaFile missing file property:', mediaFile)
        continue
      }
      
      console.log('Processing file:', mediaFile.file.name, mediaFile.file.type, mediaFile.file.size)
      try {
        // Update file status to uploading
        currentFiles = currentFiles.map(f => 
          f.id === mediaFile.id 
            ? { ...f, uploading: true, error: null }
            : f
        )
        onFilesChange(currentFiles)

        // Get pre-signed URL
        console.log('Requesting pre-signed URL for:', mediaFile.file?.name || 'unknown')
        // Determine clientId for the request
        let requestClientId = undefined
        if (user?.role === 'SUPER_ADMIN' && propClientId) {
          requestClientId = propClientId
        }

        const presignedResponse = await fetch('/api/upload-presigned', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            fileName: mediaFile.file?.name || 'unknown',
            fileType: mediaFile.file?.type || 'application/octet-stream',
            fileSize: mediaFile.file?.size || 0,
            sku: sku,
            ...(requestClientId && { clientId: requestClientId }),
          }),
        })

        console.log('Pre-signed URL response status:', presignedResponse.status)
        if (!presignedResponse.ok) {
          const errorData = await presignedResponse.json()
          console.error('Pre-signed URL error:', errorData)
          throw new Error(errorData.error || 'Failed to get upload URL')
        }

        const { signedUrl, key } = await presignedResponse.json()
        console.log('Got pre-signed URL:', signedUrl)

        // Upload file directly to S3
        console.log('Uploading to S3...')
        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          body: mediaFile.file,
          headers: {
            'Content-Type': mediaFile.file?.type || 'application/octet-stream',
          },
        })

        console.log('S3 upload response status:', uploadResponse.status)
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.error('S3 upload error:', errorText)
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
        }

        // Use the signed URL directly from the server response (it already has the correct region)
        // Remove the query parameters to get the clean S3 URL
        const finalUrl = signedUrl.split('?')[0]
        console.log('Using signed URL as final URL:', finalUrl)

        // Update file status to uploaded
        currentFiles = currentFiles.map(f => {
          if (f.id === mediaFile.id) {
            const updatedFile = { 
              ...f, 
              uploading: false, 
              uploaded: true, 
              url: finalUrl,
              key: key,
              error: null 
            }
            console.log('Updated file object:', updatedFile)
            return updatedFile
          }
          return f
        })
        console.log('Updating file status to uploaded for:', mediaFile.file?.name || 'unknown')
        console.log('File details:', {
          id: mediaFile.id,
          name: mediaFile.file?.name || 'unknown',
          url: finalUrl,
          key: key,
          uploaded: true
        })
        onFilesChange(currentFiles)

        // Update progress
        setUploadProgress(prev => ({ ...prev, [mediaFile.id]: 100 }))
        console.log('Upload completed successfully for:', mediaFile.file?.name || 'unknown')

      } catch (error: any) {
        console.error('Upload error for', mediaFile.file?.name || 'unknown', ':', error)
        
        // Update file status to error
        currentFiles = currentFiles.map(f => 
          f.id === mediaFile.id 
            ? { 
                ...f, 
                uploading: false, 
                uploaded: false, 
                error: error.message 
              }
            : f
        )
        onFilesChange(currentFiles)
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
    if (!file) {
      console.warn('File is undefined:', file)
      return <File className="w-4 h-4" />
    }
    
    // Handle both component MediaFile (with file property) and database MediaFile (with fileType property)
    let fileType = ''
    if (file.file) {
      // Component MediaFile structure
      fileType = file.file.type || ''
    } else if (file.fileType) {
      // Database MediaFile structure
      fileType = file.fileType || ''
    } else {
      console.warn('File type not found in MediaFile:', file)
      return <File className="w-4 h-4" />
    }
    
    if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />
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
                      {file.file?.name || file.fileName || 'Unknown file'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.file?.size || file.fileSize || 0)} ({file.file?.size || file.fileSize || 0} bytes)
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

      {/* Media Preview Section */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Uploaded Media ({files.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file) => {
              console.log('Rendering file:', {
                id: file.id,
                name: file.file?.name,
                type: file.file?.type,
                preview: file.preview,
                url: file.url,
                uploaded: file.uploaded
              })
              return (
              <div key={file.id} className="relative group">
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  {(() => {
                    const fileType = file.file?.type || ''
                    const previewUrl = file.preview || file.url
                    
                    // Validate previewUrl
                    if (!previewUrl) {
                      return (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                          <div className="text-center text-slate-500">
                            <FileText className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">No preview available</p>
                          </div>
                        </div>
                      )
                    }
                    
                    // Try to determine if it's an image or video based on URL extension if file type is not available
                    const isImage = fileType.startsWith('image/') || 
                      (previewUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(previewUrl))
                    const isVideo = fileType.startsWith('video/') || 
                      (previewUrl && /\.(mp4|webm|mov)$/i.test(previewUrl))
                    
                    if (isImage) {
                      return (
                        <img
                          src={previewUrl}
                          alt={file.file?.name || 'Preview'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image load error for', file.file?.name, 'URL:', previewUrl, 'Error:', e)
                            e.currentTarget.style.display = 'none'
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', file.file?.name)
                          }}
                        />
                      )
                    } else if (isVideo) {
                      return (
                        <video
                          src={previewUrl}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                          onError={(e) => {
                            console.error('Video load error for', file.file?.name, ':', e)
                            console.error('Video URL:', previewUrl)
                            console.error('Video file type:', fileType)
                            e.currentTarget.style.display = 'none'
                          }}
                          onLoadStart={() => {
                            console.log('Video load started for:', file.file?.name, 'URL:', previewUrl)
                          }}
                          onLoadedData={() => {
                            console.log('Video loaded successfully:', file.file?.name)
                          }}
                          onCanPlay={() => {
                            console.log('Video can play:', file.file?.name)
                          }}
                        />
                      )
                    } else {
                      return (
                        <div className="w-full h-full flex items-center justify-center">
                          <File className="w-8 h-8 text-slate-400" />
                        </div>
                      )
                    }
                  })()}
                </div>
                
                {/* Overlay with status and actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    {file.uploading && (
                      <div className="flex items-center space-x-2 text-white">
                        <Loading size="sm" />
                        <span className="text-xs">Uploading...</span>
                      </div>
                    )}
                    
                    {file.uploaded && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Uploaded</span>
                      </div>
                    )}
                    
                    {file.error && (
                      <div className="flex items-center space-x-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">Error</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Remove button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                
                {/* File name */}
                <div className="mt-2">
                  <p className="text-xs text-slate-600 truncate" title={file.file?.name}>
                    {file.file?.name || 'Unknown file'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(file.file?.size || 0)}
                  </p>
                </div>
              </div>
              )
            })}
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
                    {file.file?.name || 'Unknown file'}
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
