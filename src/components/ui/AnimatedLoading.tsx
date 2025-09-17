'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedLoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'wave'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

const colorClasses = {
  primary: 'text-primary-600',
  secondary: 'text-slate-600',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600'
}

export const AnimatedLoading: React.FC<AnimatedLoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  className
}) => {
  const sizeClass = sizeClasses[size]
  const colorClass = colorClasses[color]

  if (variant === 'spinner') {
    return (
      <motion.div
        className={cn('border-2 border-slate-200 border-t-current rounded-full', sizeClass, colorClass, className)}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    )
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn('w-2 h-2 rounded-full', colorClass)}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn('rounded-full', sizeClass, colorClass, className)}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    )
  }

  if (variant === 'wave') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={cn('w-1 h-4 rounded-full', colorClass)}
            animate={{
              scaleY: [1, 2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    )
  }

  return null
}

export const LoadingOverlay: React.FC<{
  children: React.ReactNode
  loading: boolean
  text?: string
}> = ({ children, loading, text = 'Loading...' }) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <motion.div
          className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <AnimatedLoading size="lg" />
            {text && (
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
