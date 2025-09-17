'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled' | 'outlined'
  size?: 'sm' | 'md' | 'lg'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      size = 'md',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    const baseClasses = 'block w-full border rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200'
    
    const variants = {
      default: 'border-slate-300 focus:ring-primary-500 focus:border-transparent',
      filled: 'border-transparent bg-slate-100 focus:ring-primary-500 focus:bg-white',
      outlined: 'border-2 border-slate-300 focus:ring-primary-500 focus:border-primary-500',
    }
    
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-5 py-4 text-base',
    }
    
    const errorClasses = error ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''
    const iconPadding = leftIcon ? 'pl-10' : rightIcon || isPassword ? 'pr-10' : ''

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400">{leftIcon}</span>
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              baseClasses,
              variants[variant],
              sizes[size],
              errorClasses,
              iconPadding,
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
              ) : (
                <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
              )}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-slate-400">{rightIcon}</span>
            </div>
          )}
        </div>
        {(error || helperText) && (
          <div className="mt-2 flex items-center">
            {error && <AlertCircle className="h-4 w-4 text-error-500 mr-1" />}
            <p className={cn('text-sm', error ? 'text-error-600' : 'text-slate-500')}>
              {error || helperText}
            </p>
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
