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
        <CardContent className="pt-6 p-4 sm:p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Guest Access</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Allow guests to view your catalog with a simple password
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="space-y-0.5">
            <Label htmlFor="guest-access" className="text-xs sm:text-sm">Enable Guest Access</Label>
            <p className="text-xs sm:text-sm text-gray-500">
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
              <Label htmlFor="guest-password" className="text-xs sm:text-sm">
                {hasPassword ? 'Change Password (leave blank to keep current)' : 'Set Password'}
              </Label>
              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                <Input
                  id="guest-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter a password"
                  value={guestPassword}
                  onChange={(e) => setGuestPassword(e.target.value)}
                  className="flex-1 text-xs sm:text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomPassword}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Guest URL */}
            {guestUrl && (
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Guest Access URL</Label>
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                  <Input
                    readOnly
                    value={guestUrl}
                    className="flex-1 bg-gray-50 text-xs sm:text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="text-xs sm:text-sm w-full sm:w-auto"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  Share this URL with guests along with the password
                </p>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className={`p-3 rounded text-xs sm:text-sm ${
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
          className="w-full text-xs sm:text-sm"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  )
}

