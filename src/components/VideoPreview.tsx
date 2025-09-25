'use client'

import React, { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react'

interface VideoPreviewProps {
  src: string
  alt?: string
  className?: string
  showControls?: boolean
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  poster?: string
  onClick?: () => void
}

export default function VideoPreview({
  src,
  alt = 'Video preview',
  className = '',
  showControls = true,
  autoPlay = false,
  muted = true,
  loop = false,
  poster,
  onClick
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!videoRef.current) return

    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!videoRef.current) return

    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
    }
  }

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handlePlayPause(e)
  }

  const handleLoadStart = () => {
    setIsLoading(true)
    setHasError(false)
  }

  const handleLoadedData = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  if (hasError) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center ${className}`}>
        <div className="text-center text-slate-500">
          <div className="w-8 h-8 mx-auto mb-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/>
            </svg>
          </div>
          <p className="text-xs">Video Error</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`relative bg-slate-100 overflow-hidden cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        muted={isMuted}
        loop={loop}
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        onClick={handleVideoClick}
        preload="metadata"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isPlaying ? (
              <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <Pause className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && !isLoading && !hasError && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex space-x-1">
            <button
              onClick={handleMuteToggle}
              className="w-6 h-6 bg-black bg-opacity-50 rounded flex items-center justify-center hover:bg-opacity-70 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-3 h-3 text-white" />
              ) : (
                <Volume2 className="w-3 h-3 text-white" />
              )}
            </button>
            <button
              onClick={handleFullscreen}
              className="w-6 h-6 bg-black bg-opacity-50 rounded flex items-center justify-center hover:bg-opacity-70 transition-colors"
            >
              <Maximize2 className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Video Type Badge */}
      <div className="absolute top-2 left-2">
        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
          video
        </div>
      </div>
    </div>
  )
}
