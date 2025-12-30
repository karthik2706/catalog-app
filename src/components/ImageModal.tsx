'use client'

import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  currentIndex: number
  onNext: () => void
  onPrevious: () => void
  productName: string
}

export default function ImageModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNext,
  onPrevious,
  productName
}: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onPrevious()
      } else if (e.key === 'ArrowRight') {
        onNext()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, onNext, onPrevious])

  if (!isOpen || images.length === 0) return null

  const hasMultiple = images.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Previous Button */}
      {hasMultiple && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Next Button */}
      {hasMultiple && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      )}

      {/* Image */}
      <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center p-4">
        <img
          src={images[currentIndex]}
          alt={productName}
          className="max-w-full max-h-[95vh] object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-image.png'
          }}
        />
      </div>

      {/* Image Counter */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}

