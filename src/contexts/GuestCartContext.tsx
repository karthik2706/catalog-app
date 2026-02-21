'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface CartItemVariation {
  name?: string
  value?: string
  priceAdjustment?: number
}

export interface CartItem {
  id: string
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  thumbnailUrl?: string
  imageUrl?: string
  variations?: CartItemVariation[]
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  /** Quantity for productId; if variations provided, only for that variant. */
  getItemQuantity: (productId: string, variations?: CartItemVariation[]) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'guest_cart'

/** Canonical key for matching same product + same variant (for merge on add). */
function variationsKey(variations?: CartItemVariation[]): string {
  if (!variations?.length) return ''
  const sorted = [...variations].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '') || (a.value ?? '').localeCompare(b.value ?? '')
  )
  return JSON.stringify(sorted)
}

export function GuestCartProvider({ children, slug }: { children: React.ReactNode; slug: string }) {
  const storageKey = `${CART_STORAGE_KEY}_${slug}`
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          setItems(Array.isArray(parsed) ? parsed : [])
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [storageKey])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items))
      } catch (error) {
        console.error('Error saving cart to localStorage:', error)
      }
    }
  }, [items, storageKey])

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    setItems(prev => {
      const key = variationsKey(item.variations)
      const existingIndex = prev.findIndex(
        i => i.productId === item.productId && variationsKey(i.variations) === key
      )
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity
        }
        return updated
      }
      const newItem: CartItem = {
        ...item,
        id: `${item.productId}-${key ? key.slice(0, 32) : ''}-${Date.now()}`
      }
      return [...prev, newItem]
    })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.id !== itemId))
      return
    }
    setItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, quantity } : item))
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const getTotal = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [items])

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }, [items])

  const getItemQuantity = useCallback((productId: string, variations?: CartItemVariation[]) => {
    const key = variationsKey(variations)
    if (key !== undefined && key !== '') {
      const item = items.find(
        i => i.productId === productId && variationsKey(i.variations) === key
      )
      return item ? item.quantity : 0
    }
    return items.filter(i => i.productId === productId).reduce((sum, i) => sum + i.quantity, 0)
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useGuestCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useGuestCart must be used within a GuestCartProvider')
  }
  return context
}

