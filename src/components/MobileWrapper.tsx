'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface MobileWrapperProps {
  children: React.ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function MobileWrapper({ 
  children, 
  className, 
  as: Component = 'div' 
}: MobileWrapperProps) {
  return (
    <Component 
      className={cn(
        'min-w-mobile max-w-mobile overflow-x-mobile',
        className
      )}
    >
      {children}
    </Component>
  )
}

interface MobileContainerProps {
  children: React.ReactNode
  className?: string
}

export function MobileContainer({ children, className }: MobileContainerProps) {
  return (
    <div className={cn('mobile-container', className)}>
      {children}
    </div>
  )
}

interface MobileGridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4
}

export function MobileGrid({ children, className, cols = 1 }: MobileGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  return (
    <div className={cn('mobile-grid', gridCols[cols], className)}>
      {children}
    </div>
  )
}

interface MobileCardProps {
  children: React.ReactNode
  className?: string
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <div className={cn('mobile-card', className)}>
      {children}
    </div>
  )
}

interface MobileTableProps {
  children: React.ReactNode
  className?: string
}

export function MobileTable({ children, className }: MobileTableProps) {
  return (
    <div className={cn('mobile-table-wrapper', className)}>
      {children}
    </div>
  )
}

interface MobileFormProps {
  children: React.ReactNode
  className?: string
  onSubmit?: (e: React.FormEvent) => void
}

export function MobileForm({ children, className, onSubmit }: MobileFormProps) {
  return (
    <form 
      className={cn('mobile-form', className)}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  )
}

interface MobileButtonGroupProps {
  children: React.ReactNode
  className?: string
}

export function MobileButtonGroup({ children, className }: MobileButtonGroupProps) {
  return (
    <div className={cn('mobile-button-group', className)}>
      {children}
    </div>
  )
}

interface MobileTextProps {
  children: React.ReactNode
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export function MobileText({ children, className, as: Component = 'p' }: MobileTextProps) {
  return (
    <Component className={cn('mobile-text', className)}>
      {children}
    </Component>
  )
}
