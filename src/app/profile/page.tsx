'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { cn, formatDate } from '@/lib/utils'
import {
  Save,
  Edit,
  User,
  Mail,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  Settings,
  Bell,
  Lock,
  Key,
  UserCheck,
  Award,
  Star,
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      setProfile(user)
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setLoading(false)
    }
  }, [user, authLoading, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    strength = Object.values(checks).filter(Boolean).length
    return { strength, checks }
  }

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 2) return 'error'
    if (strength <= 3) return 'warning'
    return 'success'
  }

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength <= 2) return 'Weak'
    if (strength <= 3) return 'Medium'
    return 'Strong'
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      
      // Validate password fields if changing password
      if (formData.newPassword || formData.confirmPassword) {
        if (!formData.currentPassword) {
          setSnackbarMessage('Current password is required to change password')
          setSnackbarSeverity('error')
          setSnackbarOpen(true)
          return
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
          setSnackbarMessage('New passwords do not match')
          setSnackbarSeverity('error')
          setSnackbarOpen(true)
          return
        }
        
        if (formData.newPassword.length < 8) {
          setSnackbarMessage('New password must be at least 8 characters')
          setSnackbarSeverity('error')
          setSnackbarOpen(true)
          return
        }

        const { strength } = calculatePasswordStrength(formData.newPassword)
        if (strength < 3) {
          setSnackbarMessage('New password must be stronger. Include uppercase, lowercase, numbers, and special characters.')
          setSnackbarSeverity('error')
          setSnackbarOpen(true)
          return
        }
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setProfile(updatedUser)
        setEditing(false)
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }))
        setSnackbarMessage('Profile updated successfully!')
        setSnackbarSeverity('success')
        setSnackbarOpen(true)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setSnackbarMessage(error instanceof Error ? error.message : 'Error updating profile')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    })
    setEditing(false)
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading size="lg" text="Loading profile..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="mt-2 text-slate-600">
              Manage your personal information and account settings
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            {!editing && (
              <Button onClick={() => setEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {profile?.name || 'User'}
                </h2>
                <p className="text-slate-600 mb-4">{profile?.email}</p>
                <Badge variant="primary" size="lg" className="mb-4">
                  {profile?.role || 'USER'}
                </Badge>
                <div className="text-sm text-slate-500">
                  Member since {profile?.createdAt ? formatDate(profile.createdAt) : 'Unknown'}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Account Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-success-50 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-success-600" />
                    </div>
                    <span className="text-sm text-slate-600">Account Status</span>
                  </div>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="text-sm text-slate-600">Security Level</span>
                  </div>
                  <Badge variant="primary" size="sm">High</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-warning-50 rounded-lg flex items-center justify-center">
                      <Bell className="w-4 h-4 text-warning-600" />
                    </div>
                    <span className="text-sm text-slate-600">Notifications</span>
                  </div>
                  <Badge variant="warning" size="sm">Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!editing}
                    leftIcon={<User className="w-4 h-4" />}
                    placeholder="Enter your full name"
                  />
                  
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!editing}
                    leftIcon={<Mail className="w-4 h-4" />}
                    placeholder="Enter your email"
                  />
                </div>

                {editing && (
                  <div className="space-y-6">
                    <div className="border-t border-slate-200 pt-6">
                      <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                        <Lock className="w-5 h-5 mr-2" />
                        Change Password (Optional)
                      </h3>
                      
                      <div className="space-y-4">
                        <Input
                          label="Current Password"
                          type={showPasswords.current ? 'text' : 'password'}
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          leftIcon={<Key className="w-4 h-4" />}
                          rightIcon={
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('current')}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          }
                          placeholder="Enter current password"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Input
                              label="New Password"
                              type={showPasswords.new ? 'text' : 'password'}
                              value={formData.newPassword}
                              onChange={(e) => handleInputChange('newPassword', e.target.value)}
                              leftIcon={<Lock className="w-4 h-4" />}
                              rightIcon={
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility('new')}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              }
                              placeholder="Enter new password"
                            />
                            {formData.newPassword && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-slate-600">Password Strength:</span>
                                  <span className={cn(
                                    'text-sm font-medium',
                                    getPasswordStrengthColor(calculatePasswordStrength(formData.newPassword).strength) === 'error' && 'text-error-600',
                                    getPasswordStrengthColor(calculatePasswordStrength(formData.newPassword).strength) === 'warning' && 'text-warning-600',
                                    getPasswordStrengthColor(calculatePasswordStrength(formData.newPassword).strength) === 'success' && 'text-success-600'
                                  )}>
                                    {getPasswordStrengthLabel(calculatePasswordStrength(formData.newPassword).strength)}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div
                                    className={cn(
                                      'h-2 rounded-full transition-all duration-300',
                                      getPasswordStrengthColor(calculatePasswordStrength(formData.newPassword).strength) === 'error' && 'bg-error-500',
                                      getPasswordStrengthColor(calculatePasswordStrength(formData.newPassword).strength) === 'warning' && 'bg-warning-500',
                                      getPasswordStrengthColor(calculatePasswordStrength(formData.newPassword).strength) === 'success' && 'bg-success-500'
                                    )}
                                    style={{ width: `${(calculatePasswordStrength(formData.newPassword).strength / 5) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <Input
                            label="Confirm New Password"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            leftIcon={<Lock className="w-4 h-4" />}
                            rightIcon={
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility('confirm')}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            }
                            placeholder="Confirm new password"
                            error={formData.confirmPassword && formData.newPassword !== formData.confirmPassword ? 'Passwords do not match' : ''}
                          />
                        </div>

                        {formData.newPassword && (
                          <div className="bg-slate-50 rounded-xl p-4">
                            <h4 className="text-sm font-medium text-slate-900 mb-3">Password Requirements:</h4>
                            <div className="space-y-2">
                              {Object.entries(calculatePasswordStrength(formData.newPassword).checks).map(([key, passed]) => (
                                <div key={key} className="flex items-center space-x-2">
                                  {passed ? (
                                    <CheckCircle className="w-4 h-4 text-success-600" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-error-600" />
                                  )}
                                  <span className={cn(
                                    'text-sm',
                                    passed ? 'text-success-700' : 'text-error-700'
                                  )}>
                                    {key === 'length' && 'At least 8 characters'}
                                    {key === 'lowercase' && 'One lowercase letter'}
                                    {key === 'uppercase' && 'One uppercase letter'}
                                    {key === 'number' && 'One number'}
                                    {key === 'special' && 'One special character'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                  {editing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        loading={saving}
                        className="w-full sm:w-auto"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setEditing(true)}
                      className="w-full sm:w-auto"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <Calendar className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-1">Account Created</p>
                    <p className="font-semibold text-slate-900">
                      {profile?.createdAt ? formatDate(profile.createdAt) : 'Unknown'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <Shield className="w-8 h-8 text-success-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-1">Account Status</p>
                    <p className="font-semibold text-success-600">Active</p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <Award className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-1">User Role</p>
                    <p className="font-semibold text-slate-900">{profile?.role || 'USER'}</p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-xl text-center">
                    <UserCheck className="w-8 h-8 text-success-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-1">Email Verified</p>
                    <p className="font-semibold text-success-600">Yes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Snackbar */}
        {snackbarOpen && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={cn(
              'px-6 py-4 rounded-xl shadow-lg flex items-center space-x-3',
              snackbarSeverity === 'success' 
                ? 'bg-success-50 border border-success-200' 
                : 'bg-error-50 border border-error-200'
            )}>
              {snackbarSeverity === 'success' ? (
                <CheckCircle className="w-5 h-5 text-success-600" />
              ) : (
                <XCircle className="w-5 h-5 text-error-600" />
              )}
              <p className={cn(
                'text-sm font-medium',
                snackbarSeverity === 'success' ? 'text-success-800' : 'text-error-800'
              )}>
                {snackbarMessage}
              </p>
              <button
                onClick={() => setSnackbarOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}