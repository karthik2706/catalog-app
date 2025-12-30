'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface CartItem {
  id: string
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  thumbnailUrl?: string
  imageUrl?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  getItemQuantity: (productId: string) => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'guest_cart'

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
      const existingIndex = prev.findIndex(i => i.productId === item.productId)
      
      if (existingIndex >= 0) {
        // Update quantity if item already exists
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity
        }
        return updated
      } else {
        // Add new item
        const newItem: CartItem = {
          ...item,
          id: `${item.productId}-${Date.now()}`
        }
        return [...prev, newItem]
      }
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    
    setItems(prev =>
      prev.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const getTotal = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [items])

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }, [items])

  const getItemQuantity = useCallback((productId: string) => {
    const item = items.find(i => i.productId === productId)
    return item ? item.quantity : 0
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

