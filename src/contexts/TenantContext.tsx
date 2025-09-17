'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface Client {
  id: string
  name: string
  slug: string
  domain?: string
  email: string
  phone?: string
  address?: string
  logo?: string
  settings?: any
  isActive: boolean
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  createdAt: string
  updatedAt: string
}

interface ClientSettings {
  id: string
  clientId: string
  companyName: string
  email: string
  phone?: string
  address?: string
  currency: string
  timezone: string
  lowStockThreshold: number
  autoReorder: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  createdAt: string
  updatedAt: string
}

interface TenantContextType {
  client: Client | null
  clientSettings: ClientSettings | null
  loading: boolean
  error: string | null
  setClient: (client: Client | null) => void
  setClientSettings: (settings: ClientSettings | null) => void
  refreshClient: () => Promise<void>
  refreshSettings: () => Promise<void>
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

interface TenantProviderProps {
  children: ReactNode
  clientSlug?: string
}

export function TenantProvider({ children, clientSlug }: TenantProviderProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [clientSettings, setClientSettings] = useState<ClientSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchClient = async (slug: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/tenants/${slug}`)
      if (!response.ok) {
        throw new Error('Client not found')
      }
      
      const data = await response.json()
      setClient(data.client)
      setClientSettings(data.settings)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching client:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshClient = async () => {
    if (client?.slug) {
      await fetchClient(client.slug)
    }
  }

  const refreshSettings = async () => {
    if (client?.id) {
      try {
        const response = await fetch(`/api/tenants/${client.slug}/settings`)
        if (response.ok) {
          const data = await response.json()
          setClientSettings(data)
        }
      } catch (err) {
        console.error('Error refreshing settings:', err)
      }
    }
  }

  useEffect(() => {
    if (clientSlug) {
      fetchClient(clientSlug)
    } else {
      setLoading(false)
    }
  }, [clientSlug])

  const value: TenantContextType = {
    client,
    clientSettings,
    loading,
    error,
    setClient,
    setClientSettings,
    refreshClient,
    refreshSettings,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

// Hook to get client ID for API calls
export function useClientId() {
  const { client } = useTenant()
  return client?.id || null
}

// Hook to check if user is super admin
export function useIsSuperAdmin() {
  const { client } = useTenant()
  return !client // Super admins don't have a client context
}
