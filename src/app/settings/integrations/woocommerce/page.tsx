'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { Store, ArrowLeft, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface Connection {
  id: string
  name: string
  siteUrl: string
  isActive: boolean
  deliveryToken: string
  webhookUrl: string | null
  lastFullSyncAt: string | null
  lastFullSyncError: string | null
  backfillPage: number
  backfillComplete: boolean
  _count: { productMaps: number; webhookDeliveries: number }
}

interface DeliveryRow {
  id: string
  topic: string
  resourceId: number | null
  status: string
  errorMessage: string | null
  createdAt: string
  processedAt: string | null
}

export default function WooCommerceIntegrationPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: 'WooCommerce store',
    siteUrl: '',
    consumerKey: '',
    consumerSecret: '',
    clientId: '',
  })

  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const isMaster = user?.role === 'MASTER_ADMIN'
  const canWrite =
    user &&
    (user.role === 'MASTER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const q =
        isMaster && form.clientId.trim()
          ? `?clientId=${encodeURIComponent(form.clientId.trim())}`
          : ''
      const res = await fetch(`/api/integrations/woocommerce/connection${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      const list = data.connections || []
      setConnections(list)
      setSelectedId((prev) => prev || (list[0]?.id ?? null))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token, isMaster, form.clientId])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user && token) load()
  }, [authLoading, user, router, token, load])

  const loadDeliveries = async (connectionId: string) => {
    if (!token) return
    const q = new URLSearchParams({ connectionId })
    if (isMaster && form.clientId.trim()) q.set('clientId', form.clientId.trim())
    const res = await fetch(`/api/integrations/woocommerce/deliveries?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (res.ok) setDeliveries(data.deliveries || [])
  }

  useEffect(() => {
    if (selectedId && token) loadDeliveries(selectedId)
  }, [selectedId, token, isMaster, form.clientId])

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const createConnection = async () => {
    setBusy('create')
    setError('')
    try {
      const res = await fetch('/api/integrations/woocommerce/connection', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: form.name,
          siteUrl: form.siteUrl,
          consumerKey: form.consumerKey,
          consumerSecret: form.consumerSecret,
          ...(isMaster && form.clientId.trim() ? { clientId: form.clientId.trim() } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Create failed')
      setForm((f) => ({ ...f, consumerKey: '', consumerSecret: '' }))
      await load()
      if (data.connection?.id) setSelectedId(data.connection.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setBusy(null)
    }
  }

  const runTest = async (id: string) => {
    setBusy(`test-${id}`)
    try {
      const res = await fetch('/api/integrations/woocommerce/test', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          connectionId: id,
          ...(isMaster && form.clientId.trim() ? { clientId: form.clientId.trim() } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test failed')
      setError('')
      alert(data.message || 'OK')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Test failed')
    } finally {
      setBusy(null)
    }
  }

  const registerWebhooks = async (id: string) => {
    setBusy(`wh-${id}`)
    try {
      const res = await fetch('/api/integrations/woocommerce/register-webhooks', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          connectionId: id,
          ...(isMaster && form.clientId.trim() ? { clientId: form.clientId.trim() } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      alert(`Registered ${data.registered} webhooks.`)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setBusy(null)
    }
  }

  const runBackfill = async (id: string, reset = false) => {
    setBusy(`bf-${id}`)
    try {
      const res = await fetch('/api/integrations/woocommerce/backfill', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          connectionId: id,
          reset,
          ...(isMaster && form.clientId.trim() ? { clientId: form.clientId.trim() } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Backfill failed')
      await load()
      if (selectedId) await loadDeliveries(selectedId)
      alert(data.message || `Processed ${data.processedInBatch}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Backfill failed')
    } finally {
      setBusy(null)
    }
  }

  const deleteConnection = async (id: string) => {
    if (!confirm('Remove this WooCommerce connection? Mapped products stay in the catalog.')) return
    setBusy(`del-${id}`)
    try {
      const res = await fetch(`/api/integrations/woocommerce/connection/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Delete failed')
      }
      if (selectedId === id) setSelectedId(null)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setBusy(null)
    }
  }

  if (authLoading || (loading && connections.length === 0)) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24">
          <Loading size="lg" text="Loading…" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="page-container max-w-5xl">
        <Button variant="outline" size="sm" className="mb-6" onClick={() => router.push('/settings')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>

        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">WooCommerce</h1>
            <p className="text-slate-600 mt-1">
              Live catalog sync: webhooks update products in near real time. Run a full sync for the first
              import. Set{' '}
              <code className="text-sm bg-slate-100 px-1 rounded">WOO_CREDENTIALS_ENCRYPTION_KEY</code> (32-byte
              hex) in production.
            </p>
          </div>
        </div>

        {!canWrite && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 text-amber-900">
            Your role can view this page but cannot create connections or run sync. Ask an admin or manager.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {isMaster && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Master admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Client ID</label>
              <Input
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                placeholder="Target client UUID"
              />
              <Button size="sm" variant="outline" onClick={() => load()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload connections
              </Button>
            </CardContent>
          </Card>
        )}

        {canWrite && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>New connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Display name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                label="Store URL"
                placeholder="https://yourstore.com"
                value={form.siteUrl}
                onChange={(e) => setForm((f) => ({ ...f, siteUrl: e.target.value }))}
              />
              <Input
                label="Consumer key"
                value={form.consumerKey}
                onChange={(e) => setForm((f) => ({ ...f, consumerKey: e.target.value }))}
              />
              <Input
                label="Consumer secret"
                type="password"
                value={form.consumerSecret}
                onChange={(e) => setForm((f) => ({ ...f, consumerSecret: e.target.value }))}
              />
              <Button onClick={createConnection} disabled={busy === 'create'}>
                Save connection
              </Button>
            </CardContent>
          </Card>
        )}

        <h2 className="text-xl font-semibold mb-4">Connections</h2>
        <div className="space-y-4">
          {connections.map((c) => (
            <Card key={c.id} className={selectedId === c.id ? 'ring-2 ring-primary-500' : ''}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{c.name}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">{c.siteUrl}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={c.isActive ? 'success' : 'secondary'}>
                      {c.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                    <Badge variant="secondary">{c._count.productMaps} mapped products</Badge>
                    {c.backfillComplete ? (
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Full sync done
                      </Badge>
                    ) : (
                      <Badge variant="warning">Backfill page {c.backfillPage}</Badge>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelectedId(c.id)}>
                  Details
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.webhookUrl && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Webhook URL</p>
                    <code className="text-xs break-all bg-slate-50 p-2 rounded block mt-1">{c.webhookUrl}</code>
                  </div>
                )}
                {c.lastFullSyncError && (
                  <p className="text-sm text-red-600">Last error: {c.lastFullSyncError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {canWrite && (
                    <>
                      <Button size="sm" variant="outline" disabled={!!busy} onClick={() => runTest(c.id)}>
                        Test REST
                      </Button>
                      <Button size="sm" variant="outline" disabled={!!busy} onClick={() => registerWebhooks(c.id)}>
                        Register webhooks
                      </Button>
                      <Button size="sm" disabled={!!busy} onClick={() => runBackfill(c.id, false)}>
                        Run sync batch
                      </Button>
                      <Button size="sm" variant="outline" disabled={!!busy} onClick={() => runBackfill(c.id, true)}>
                        Reset &amp; full sync
                      </Button>
                      <Button size="sm" variant="outline" disabled={!!busy} onClick={() => deleteConnection(c.id)}>
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!connections.length && !loading && (
            <p className="text-slate-500">No connections yet. Add your WooCommerce REST keys above.</p>
          )}
        </div>

        {selectedId && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent webhook deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Topic</th>
                      <th className="py-2 pr-4">Resource</th>
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d) => (
                      <tr key={d.id} className="border-b border-slate-100">
                        <td className="py-2 pr-4">
                          <Badge variant={d.status === 'COMPLETED' ? 'success' : d.status === 'FAILED' ? 'error' : 'secondary'}>
                            {d.status}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">{d.topic}</td>
                        <td className="py-2 pr-4">{d.resourceId ?? '—'}</td>
                        <td className="py-2 pr-4 text-slate-500">{new Date(d.createdAt).toLocaleString()}</td>
                        <td className="py-2 text-red-600 text-xs max-w-xs truncate">{d.errorMessage || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!deliveries.length && <p className="text-slate-500 py-4">No deliveries logged yet.</p>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
