'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

interface GuestLoginFormProps {
  slug: string
  clientName: string | null
  clientLogo: string | null
  passwordRequired: boolean
}

export default function GuestLoginForm({ slug, clientName, clientLogo, passwordRequired }: GuestLoginFormProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!passwordRequired)
  const router = useRouter()
  const autoAuthAttempted = useRef(false)

  useEffect(() => {
    if (!passwordRequired && !autoAuthAttempted.current) {
      autoAuthAttempted.current = true
      authenticateGuest()
    }
  }, [passwordRequired])

  const authenticateGuest = async (submittedPassword?: string) => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/guest/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          ...(submittedPassword && { password: submittedPassword })
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Authentication failed')
        setLoading(false)
        return
      }

      await fetch('/api/guest/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          token: data.token,
          client: data.client
        }),
      })

      router.push(`/guest/${slug}/catalog`)
      router.refresh()
    } catch (err) {
      setError('Failed to authenticate. Please try again.')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await authenticateGuest(password)
  }

  if (!passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center gap-4">
              {clientLogo && (
                <img
                  src={clientLogo}
                  alt={clientName || 'Logo'}
                  className="h-16 w-16 object-contain rounded"
                />
              )}
              {error ? (
                <>
                  <p className="text-sm text-red-600">{error}</p>
                  <Button onClick={() => authenticateGuest()} disabled={loading}>
                    {loading ? 'Retrying...' : 'Try Again'}
                  </Button>
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <p className="text-sm text-gray-500">Loading catalog...</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
