'use client'

import React, { useState } from 'react'
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { MediaFile } from './MediaUpload'

interface MediaPreviewProps {
  file: MediaFile
  size?: 'sm' | 'md' | 'lg'
  showControls?: boolean
  className?: string
}

export function MediaPreview({ 
  file, 
  size = 'md', 
  showControls = true,
  className = '' 
}: MediaPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-64 h-64',
  }

  const isImage = file.file.type.startsWith('image/')
  const isVideo = file.file.type.startsWith('video/')
  const displayUrl = file.thumbnailUrl || file.url || file.preview
  const videoUrl = file.url || file.preview // For videos, use the actual video URL, not thumbnail
  const hasThumbnail = file.thumbnailUrl && isImage // Only images have thumbnails

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  if (isImage) {
    return (
      <div className={`relative group ${sizeClasses[size]} ${className}`}>
        <img
          src={hasThumbnail ? file.thumbnailUrl : file.url || file.preview}
          alt={file.file.name}
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-image.png'
          }}
        />
        
        {showControls && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
            <button
              onClick={() => setShowFullscreen(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
            >
              <Play className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
        
        {/* Fullscreen Modal */}
        {showFullscreen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={hasThumbnail ? file.thumbnailUrl : file.url || file.preview}
              alt={file.file.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>
    )
  }

  if (isVideo) {
    return (
      <div className={`relative group ${sizeClasses[size]} ${className}`}>
        <video
          src={videoUrl}
          className="w-full h-full object-cover rounded-lg"
          muted={isMuted}
          controls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('Video load error:', e)
            console.error('Video URL:', videoUrl)
            console.error('File details:', file)
          }}
        />
        
        {showControls && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
              <button
                onClick={handlePlayPause}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white" />
                )}
              </button>
              
              <button
                onClick={handleMuteToggle}
                className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} ${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
      <div className="text-center text-gray-500">
        <div className="text-xs">Unsupported file type</div>
      </div>
    </div>
  )
}

interface MediaGridProps {
  files: MediaFile[]
  onRemove?: (fileId: string) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function MediaGrid({ 
  files, 
  onRemove, 
  size = 'md',
  className = '' 
}: MediaGridProps) {
  if (files.length === 0) {
    return null
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {files.map((file) => (
        <div key={file.id} className="relative group">
          <MediaPreview file={file} size={size} />
          
          {onRemove && (
            <button
              onClick={() => onRemove(file.id)}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
