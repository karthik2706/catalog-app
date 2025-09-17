'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton'
  text?: string
  className?: string
  fullScreen?: boolean
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  className,
  fullScreen = false,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  }

  const renderSpinner = () => (
    <Loader2 className={cn('animate-spin text-primary-600', spinnerSizes[size])} />
  )

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-primary-600 rounded-full animate-bounce',
            dotSizes[size]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  )

  const renderPulse = () => (
    <div className={cn('bg-primary-600 rounded-full animate-pulse', sizes[size])} />
  )

  const renderSkeleton = () => (
    <div className="space-y-2 w-full">
      <div className="h-4 bg-slate-200 rounded animate-pulse" />
      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
      <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
    </div>
  )

  const renderContent = () => {
    switch (variant) {
      case 'dots':
        return renderDots()
      case 'pulse':
        return renderPulse()
      case 'skeleton':
        return renderSkeleton()
      default:
        return renderSpinner()
    }
  }

  const content = (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      {renderContent()}
      {text && (
        <p className="text-sm text-slate-600 animate-pulse">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}

export { Loading }
