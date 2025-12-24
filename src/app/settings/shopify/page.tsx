'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { FadeIn } from '@/components/ui/AnimatedWrapper'
import {
  Save,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Store,
} from 'lucide-react'

interface ShopifyIntegration {
  id: string
  shopDomain: string
  isActive: boolean
  autoSync: boolean
  syncInventory: boolean
  lastSyncAt: string | null
  lastSyncStatus: string | null
  lastSyncError: string | null
  createdAt: string
  updatedAt: string
}

export default function ShopifySettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [integration, setIntegration] = useState<ShopifyIntegration | null>(null)
  const [shopDomain, setShopDomain] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [autoSync, setAutoSync] = useState(true)
  const [syncInventory, setSyncInventory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; shop?: any } | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadConfiguration()
  }, [user])

  const loadConfiguration = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/shopify/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load configuration')
      }

      const data = await response.json()
      if (data.integration) {
        setIntegration(data.integration)
        setShopDomain(data.integration.shopDomain)
        setAutoSync(data.integration.autoSync)
        setSyncInventory(data.integration.syncInventory)
        // Don't load access token for security
      }
    } catch (error: any) {
      console.error('Error loading configuration:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!shopDomain || !accessToken) {
      setError('Shop domain and access token are required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/shopify/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          shopDomain,
          accessToken,
          webhookSecret: webhookSecret || undefined,
          autoSync,
          syncInventory,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration')
      }

      setIntegration(data.integration)
      setAccessToken('') // Clear token for security
      setSuccess('Shopify integration configured successfully!')
      setTestResult(data.shop ? { success: true, shop: data.shop } : null)
    } catch (error: any) {
      console.error('Error saving configuration:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the Shopify integration? This will remove all webhooks and stop syncing.')) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/shopify/config', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete configuration')
      }

      setIntegration(null)
      setShopDomain('')
      setAccessToken('')
      setWebhookSecret('')
      setAutoSync(true)
      setSyncInventory(true)
      setSuccess('Shopify integration deleted successfully')
    } catch (error: any) {
      console.error('Error deleting configuration:', error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async (syncAll: boolean = false) => {
    try {
      setSyncing(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          syncAll
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync products')
      }

      setSuccess(`Successfully synced ${data.synced} product(s)${data.errors > 0 ? ` (${data.errors} errors)` : ''}`)
      await loadConfiguration() // Refresh status
    } catch (error: any) {
      console.error('Error syncing products:', error)
      setError(error.message)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loading />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <FadeIn>
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Shopify Integration</h1>
            <p className="text-gray-600">
              Connect your Shopify store to sync products and inventory automatically
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <XCircle className="text-red-600" size={20} />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-green-800">{success}</span>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="text-blue-600" size={24} />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Shop Domain <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="mystore.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your Shopify store domain (e.g., mystore.myshopify.com)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Access Token <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="shpat_xxxxxxxxxxxxx"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your Shopify Admin API access token. 
                  <a 
                    href="https://shopify.dev/docs/apps/auth/admin-app-access-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    Learn how to create one
                    <ExternalLink className="inline ml-1" size={14} />
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Webhook Secret (Optional)
                </label>
                <Input
                  type="password"
                  placeholder="Enter webhook secret for verification"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  disabled={saving}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional secret for webhook signature verification
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="autoSync"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    disabled={saving}
                    className="w-4 h-4"
                  />
                  <label htmlFor="autoSync" className="text-sm font-medium">
                    Auto-sync products
                  </label>
                </div>
                <p className="text-sm text-gray-500 ml-7">
                  Automatically sync products to Shopify when created or updated in Stock Mind
                </p>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="syncInventory"
                    checked={syncInventory}
                    onChange={(e) => setSyncInventory(e.target.checked)}
                    disabled={saving}
                    className="w-4 h-4"
                  />
                  <label htmlFor="syncInventory" className="text-sm font-medium">
                    Sync inventory from Shopify
                  </label>
                </div>
                <p className="text-sm text-gray-500 ml-7">
                  Update inventory in Stock Mind when orders are placed in Shopify
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving || !shopDomain || !accessToken}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loading />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {integration ? 'Update Configuration' : 'Save Configuration'}
                    </>
                  )}
                </Button>

                {integration && (
                  <>
                    <Button
                      onClick={() => handleSync(false)}
                      disabled={syncing}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {syncing ? (
                        <>
                          <Loading />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={18} />
                          Sync Selected
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => handleSync(true)}
                      disabled={syncing}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {syncing ? (
                        <>
                          <Loading />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={18} />
                          Sync All
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleDelete}
                      disabled={saving}
                      variant="outline"
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {integration && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={24} />
                  Sync Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">
                      {integration.isActive ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle size={16} />
                          Active
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1">
                          <XCircle size={16} />
                          Inactive
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Last Sync</p>
                    <p className="font-medium">
                      {integration.lastSyncAt
                        ? new Date(integration.lastSyncAt).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Last Sync Status</p>
                    <p className="font-medium">
                      {integration.lastSyncStatus === 'success' ? (
                        <span className="text-green-600">Success</span>
                      ) : integration.lastSyncStatus === 'error' ? (
                        <span className="text-red-600">Error</span>
                      ) : (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Auto-sync</p>
                    <p className="font-medium">
                      {integration.autoSync ? (
                        <span className="text-green-600">Enabled</span>
                      ) : (
                        <span className="text-gray-500">Disabled</span>
                      )}
                    </p>
                  </div>
                </div>

                {integration.lastSyncError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">Last Sync Error:</p>
                    <p className="text-sm text-red-600">{integration.lastSyncError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {testResult && testResult.shop && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={24} />
                  Connection Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  Successfully connected to:
                </p>
                <p className="font-medium">{testResult.shop.name}</p>
                <p className="text-sm text-gray-500">{testResult.shop.domain}</p>
              </CardContent>
            </Card>
          )}
        </FadeIn>
      </div>
    </DashboardLayout>
  )
}

