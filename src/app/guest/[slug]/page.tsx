'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function GuestLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  useEffect(() => {
    // Check if already authenticated
    const token = localStorage.getItem(`guest_token_${slug}`)
    if (token) {
      router.push(`/guest/${slug}/catalog`)
    }
  }, [slug, router])

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

      // Store token and client info
      localStorage.setItem(`guest_token_${slug}`, data.token)
      localStorage.setItem(`guest_client_${slug}`, JSON.stringify(data.client))

      // Redirect to catalog
      router.push(`/guest/${slug}/catalog`)
    } catch (err) {
      setError('Failed to authenticate. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Guest Access</CardTitle>
          <CardDescription>
            Enter the password to view the catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Catalog: {slug}
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

