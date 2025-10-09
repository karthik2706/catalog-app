'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/Label'

export default function GuestAccessSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [guestAccessEnabled, setGuestAccessEnabled] = useState(false)
  const [guestPassword, setGuestPassword] = useState('')
  const [guestUrl, setGuestUrl] = useState('')
  const [hasPassword, setHasPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/guest-access', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setGuestAccessEnabled(data.guestAccessEnabled)
        setGuestUrl(data.guestUrl || '')
        setHasPassword(data.hasPassword)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (guestAccessEnabled && !guestPassword && !hasPassword) {
      setMessage({ type: 'error', text: 'Please enter a password' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/guest-access', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guestAccessEnabled,
          ...(guestPassword && { guestPassword })
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings updated successfully' })
        setGuestUrl(data.guestUrl || '')
        if (guestPassword) {
          setHasPassword(true)
          setGuestPassword('')
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings' })
    } finally {
      setSaving(false)
    }
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGuestPassword(password)
    setShowPassword(true)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(guestUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guest Access</CardTitle>
        <CardDescription>
          Allow guests to view your catalog with a simple password
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="guest-access">Enable Guest Access</Label>
            <p className="text-sm text-gray-500">
              Allow anyone with the password to view your catalog
            </p>
          </div>
          <Switch
            id="guest-access"
            checked={guestAccessEnabled}
            onCheckedChange={setGuestAccessEnabled}
          />
        </div>

        {/* Password Settings */}
        {guestAccessEnabled && (
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="guest-password">
                {hasPassword ? 'Change Password (leave blank to keep current)' : 'Set Password'}
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="guest-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter a password"
                  value={guestPassword}
                  onChange={(e) => setGuestPassword(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomPassword}
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Guest URL */}
            {guestUrl && (
              <div className="space-y-2">
                <Label>Guest Access URL</Label>
                <div className="flex space-x-2">
                  <Input
                    readOnly
                    value={guestUrl}
                    className="flex-1 bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Share this URL with guests along with the password
                </p>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className={`p-3 rounded text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  )
}

