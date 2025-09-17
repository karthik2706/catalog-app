'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
  dot?: boolean
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      rounded = true,
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center font-medium'
    
    const variants = {
      default: 'bg-slate-100 text-slate-800',
      primary: 'bg-primary-100 text-primary-800',
      success: 'bg-success-100 text-success-800',
      warning: 'bg-warning-100 text-warning-800',
      error: 'bg-error-100 text-error-800',
      secondary: 'bg-slate-200 text-slate-700',
    }
    
    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1 text-xs',
      lg: 'px-4 py-2 text-sm',
    }
    
    const roundedClasses = rounded ? 'rounded-full' : 'rounded-md'

    return (
      <div
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          roundedClasses,
          className
        )}
        ref={ref}
        {...props}
      >
        {dot && (
          <div
            className={cn(
              'w-2 h-2 rounded-full mr-2',
              variant === 'default' && 'bg-slate-400',
              variant === 'primary' && 'bg-primary-500',
              variant === 'success' && 'bg-success-500',
              variant === 'warning' && 'bg-warning-500',
              variant === 'error' && 'bg-error-500',
              variant === 'secondary' && 'bg-slate-500'
            )}
          />
        )}
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
