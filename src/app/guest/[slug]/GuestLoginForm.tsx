'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

interface GuestLoginFormProps {
  slug: string
  clientName: string | null
  clientLogo: string | null
}

export default function GuestLoginForm({ slug, clientName, clientLogo }: GuestLoginFormProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/guest/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Authentication failed')
        setLoading(false)
        return
      }

      // Store token in cookie via API route
      await fetch('/api/guest/set-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          slug, 
          token: data.token,
          client: data.client 
        }),
      })

      // Redirect to catalog with proper route
      router.push(`/guest/${slug}/catalog`)
      router.refresh()
    } catch (err) {
      setError('Failed to authenticate. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {clientLogo && (
            <div className="flex justify-center mb-4">
              <img
                src={clientLogo}
                alt={clientName || 'Logo'}
                className="h-16 w-16 object-contain rounded"
              />
            </div>
          )}
          <CardTitle className="text-2xl">{clientName || 'Guest Access'}</CardTitle>
          <CardDescription>
            Enter the password to view the catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className="w-full"
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full"
            >
              {loading ? 'Authenticating...' : 'Access Catalog'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

