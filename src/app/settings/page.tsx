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
import { Modal } from '@/components/ui/Modal'
import { FadeIn, StaggerWrapper } from '@/components/ui/AnimatedWrapper'
import { cn } from '@/lib/utils'
import {
  Save,
  Plus,
  Edit,
  Trash2,
  Users,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bell,
  BellOff,
  Database,
  Shield,
  UserPlus,
  Tag,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  clientId?: string
  client?: {
    id: string
    name: string
    slug: string
  }
  createdAt: string
  isActive: boolean
}

interface Client {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  address?: string
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  isActive: boolean
  createdAt: string
  _count: {
    users: number
    products: number
  }
}

interface Settings {
  id: string
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
}

interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Data states
  const [settings, setSettings] = useState<Settings | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  // Form states
  const [settingsForm, setSettingsForm] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    currency: 'USD',
    timezone: 'America/New_York',
    lowStockThreshold: 10,
    autoReorder: false,
    emailNotifications: true,
    smsNotifications: false,
  })
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as const,
    clientId: '',
  })
  
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: 'STARTER' as const,
  })
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  })
  
  // Modal states
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [editUserModalOpen, setEditUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchData()
    }
  }, [user, authLoading, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [settingsRes, usersRes, clientsRes, categoriesRes] = await Promise.all([
        fetch('/api/settings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch('/api/admin/clients', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        fetch('/api/categories', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ])

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSettings(settingsData)
        setSettingsForm({
          companyName: settingsData.companyName || '',
          email: settingsData.email || '',
          phone: settingsData.phone || '',
          address: settingsData.address || '',
          currency: settingsData.currency || 'USD',
          timezone: settingsData.timezone || 'America/New_York',
          lowStockThreshold: settingsData.lowStockThreshold || 10,
          autoReorder: settingsData.autoReorder || false,
          emailNotifications: settingsData.emailNotifications || true,
          smsNotifications: settingsData.smsNotifications || false,
        })
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData.clients || [])
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(settingsForm),
      })

      if (response.ok) {
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save settings')
      }
    } catch (error) {
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateUser = async () => {
    try {
      setSaving(true)
      setError('')

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        setSuccess('User created successfully!')
        setUserModalOpen(false)
        setNewUser({ name: '', email: '', password: '', role: 'USER', clientId: '' })
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create user')
      }
    } catch (error) {
      setError('Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateClient = async () => {
    try {
      setSaving(true)
      setError('')

      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newClient),
      })

      if (response.ok) {
        setSuccess('Client created successfully!')
        setClientModalOpen(false)
        setNewClient({ name: '', email: '', phone: '', address: '', plan: 'STARTER' })
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create client')
      }
    } catch (error) {
      setError('Failed to create client')
    } finally {
      setSaving(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setNewUser({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role as any,
      clientId: user.clientId || '',
    })
    setEditUserModalOpen(true)
  }

  const handleSaveEditUser = async () => {
    if (!editingUser) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          clientId: newUser.clientId,
        }),
      })

      if (response.ok) {
        setSuccess('User updated successfully!')
        setEditUserModalOpen(false)
        setEditingUser(null)
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update user')
      }
    } catch (error) {
      setError('Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      setSaving(true)
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        setSuccess('User deleted successfully!')
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete user')
      }
    } catch (error) {
      setError('Failed to delete user')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      setSaving(true)
      setError('')

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newCategory),
      })

      if (response.ok) {
        setSuccess('Category created successfully!')
        setCategoryModalOpen(false)
        setNewCategory({ name: '', description: '' })
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create category')
      }
    } catch (error) {
      setError('Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategory({
      name: category.name,
      description: category.description || '',
    })
    setEditCategoryModalOpen(true)
  }

  const handleSaveEditCategory = async () => {
    if (!editingCategory) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch(`/api/categories?id=${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(newCategory),
      })

      if (response.ok) {
        setSuccess('Category updated successfully!')
        setEditCategoryModalOpen(false)
        setEditingCategory(null)
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update category')
      }
    } catch (error) {
      setError('Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      setSaving(true)
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        setSuccess('Category deleted successfully!')
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete category')
      }
    } catch (error) {
      setError('Failed to delete category')
    } finally {
      setSaving(false)
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'STARTER': return 'bg-blue-100 text-blue-800'
      case 'PROFESSIONAL': return 'bg-purple-100 text-purple-800'
      case 'ENTERPRISE': return 'bg-gold-100 text-gold-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800'
      case 'ADMIN': return 'bg-blue-100 text-blue-800'
      case 'MANAGER': return 'bg-green-100 text-green-800'
      case 'USER': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN'
  const isAdmin = user.role === 'ADMIN'
  const isManager = user.role === 'MANAGER'
  const isUser = user.role === 'USER'

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="p-4 sm:p-6 lg:p-8">
          <FadeIn>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 flex items-center space-x-3">
                <SettingsIcon className="w-8 h-8 text-primary-600" />
                <span>Settings</span>
              </h1>
              <p className="mt-2 text-slate-600">
                Manage your application settings, users, and clients
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 bg-error-50 border border-error-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-error-600 mr-3" />
                  <p className="text-error-800">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-success-50 border border-success-200 rounded-xl p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success-600 mr-3" />
                  <p className="text-success-800">{success}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-8">
              <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'general', label: 'General Settings', icon: SettingsIcon },
                    { id: 'categories', label: 'Category Management', icon: Tag },
                    ...(isUser ? [] : [{ id: 'users', label: 'User Management', icon: Users }]),
                    ...(isSuperAdmin ? [{ id: 'clients', label: 'Client Management', icon: Building2 }] : []),
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm',
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <StaggerWrapper>
              {/* General Settings */}
              {activeTab === 'general' && (
                <FadeIn delay={0.1}>
                  <Card className="card-hover">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <SettingsIcon className="w-5 h-5 text-primary-600" />
                        <span>General Settings</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Company Name</label>
                          <Input
                            value={settingsForm.companyName}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, companyName: e.target.value }))}
                            placeholder="Enter company name"
                            leftIcon={<Building2 className="w-4 h-4" />}
                            disabled={isUser || isManager}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Email</label>
                          <Input
                            value={settingsForm.email}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter email"
                            leftIcon={<Mail className="w-4 h-4" />}
                            disabled={isUser || isManager}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Phone</label>
                          <Input
                            value={settingsForm.phone}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter phone number"
                            leftIcon={<Phone className="w-4 h-4" />}
                            disabled={isUser || isManager}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Currency</label>
                          <select
                            value={settingsForm.currency}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, currency: e.target.value }))}
                            className={`w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent ${(isUser || isManager) ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                            disabled={isUser || isManager}
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="INR">INR</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Address</label>
                        <textarea
                          value={settingsForm.address}
                          onChange={(e) => setSettingsForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter company address"
                          rows={3}
                          className={`w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${(isUser || isManager) ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                          disabled={isUser || isManager}
                        />
                      </div>

                      {!isUser && !isManager && (
                        <div className="flex justify-end">
                          <Button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            loading={saving}
                            className="flex items-center space-x-2"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save Settings</span>
                          </Button>
                        </div>
                      )}

                      {(isUser || isManager) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-center">
                            <Shield className="w-5 h-5 text-blue-600 mr-3" />
                            <p className="text-blue-800 text-sm">
                              {isUser 
                                ? "You have read-only access to settings. Contact your administrator to make changes."
                                : "You have read-only access to general settings. Contact your administrator to make changes."
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </FadeIn>
              )}

              {/* User Management */}
              {activeTab === 'users' && (
                <FadeIn delay={0.2}>
                  <Card className="card-hover">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-primary-600" />
                          <span>User Management</span>
                        </CardTitle>
                        {!isUser && (
                          <Button
                            onClick={() => setUserModalOpen(true)}
                            className="flex items-center space-x-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Add User</span>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {users.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {user.name?.charAt(0) || user.email.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-900">{user.name || 'No name'}</h3>
                                <p className="text-sm text-slate-500">{user.email}</p>
                                {user.client && (
                                  <p className="text-xs text-slate-400">{user.client.name}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge className={getRoleColor(user.role)}>
                                {user.role}
                              </Badge>
                              {!isUser && (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-error-600 hover:bg-error-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {isManager && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
                          <div className="flex items-center">
                            <Shield className="w-5 h-5 text-amber-600 mr-3" />
                            <p className="text-amber-800 text-sm">
                              As a manager, you can only create and manage users with "User" role. You cannot create other managers or admins.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </FadeIn>
              )}

              {/* Category Management */}
              {activeTab === 'categories' && (
                <FadeIn delay={0.25}>
                  <Card className="card-hover">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Tag className="w-5 h-5 text-primary-600" />
                          <span>Category Management</span>
                        </CardTitle>
                        <Button
                          onClick={() => setCategoryModalOpen(true)}
                          className="flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Category</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                <Tag className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-900">{category.name}</h3>
                                {category.description && (
                                  <p className="text-sm text-slate-500">{category.description}</p>
                                )}
                                <p className="text-xs text-slate-400">
                                  Created {new Date(category.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-error-600 hover:bg-error-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {categories.length === 0 && (
                          <div className="text-center py-12">
                            <Tag className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No categories yet</h3>
                            <p className="text-slate-500 mb-4">Create your first category to organize your products</p>
                            <Button
                              onClick={() => setCategoryModalOpen(true)}
                              className="flex items-center space-x-2 mx-auto"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Category</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              )}

              {/* Client Management (Super Admin Only) */}
              {activeTab === 'clients' && isSuperAdmin && (
                <FadeIn delay={0.3}>
                  <Card className="card-hover">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Building2 className="w-5 h-5 text-primary-600" />
                          <span>Client Management</span>
                        </CardTitle>
                        <Button
                          onClick={() => setClientModalOpen(true)}
                          className="flex items-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Client</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {clients.map((client) => (
                          <div key={client.id} className="p-4 border border-slate-200 rounded-xl">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-medium text-slate-900">{client.name}</h3>
                                  <p className="text-sm text-slate-500">@{client.slug}</p>
                                </div>
                              </div>
                              <Badge className={getPlanColor(client.plan)}>
                                {client.plan}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm text-slate-600">
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4" />
                                <span>{client.email}</span>
                              </div>
                              {client.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="w-4 h-4" />
                                  <span>{client.phone}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                              <div className="flex space-x-4 text-xs text-slate-500">
                                <span>{client._count.users} users</span>
                                <span>{client._count.products} products</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {client.isActive ? (
                                  <CheckCircle className="w-4 h-4 text-success-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-error-600" />
                                )}
                                <span className={`text-xs ${client.isActive ? 'text-success-600' : 'text-error-600'}`}>
                                  {client.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              )}
            </StaggerWrapper>
          </FadeIn>
        </div>

        {/* Add User Modal */}
        <Modal
          isOpen={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          title="Add New User"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                leftIcon={<Users className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                leftIcon={<Shield className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="USER">User</option>
                {isManager && <option value="MANAGER">Manager</option>}
                {isAdmin && <option value="MANAGER">Manager</option>}
                {isAdmin && <option value="ADMIN">Admin</option>}
                {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
              </select>
            </div>
            
            {isSuperAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Company</label>
                <select
                  value={newUser.clientId}
                  onChange={(e) => setNewUser(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select company</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setUserModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={saving || !newUser.name || !newUser.email || !newUser.password}
                loading={saving}
              >
                Create User
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={editUserModalOpen}
          onClose={() => setEditUserModalOpen(false)}
          title="Edit User"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                leftIcon={<Users className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="USER">User</option>
                {isManager && <option value="MANAGER">Manager</option>}
                {isAdmin && <option value="MANAGER">Manager</option>}
                {isAdmin && <option value="ADMIN">Admin</option>}
                {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
              </select>
            </div>
            
            {isSuperAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Company</label>
                <select
                  value={newUser.clientId}
                  onChange={(e) => setNewUser(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select company</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditUserModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditUser}
                disabled={saving || !newUser.name || !newUser.email}
                loading={saving}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add Client Modal */}
        <Modal
          isOpen={clientModalOpen}
          onClose={() => setClientModalOpen(false)}
          title="Add New Client"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Company Name</label>
              <Input
                value={newClient.name}
                onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter company name"
                leftIcon={<Building2 className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <Input
                value={newClient.phone}
                onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Address</label>
              <textarea
                value={newClient.address}
                onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter company address"
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Plan</label>
              <select
                value={newClient.plan}
                onChange={(e) => setNewClient(prev => ({ ...prev, plan: e.target.value as any }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="STARTER">Starter</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setClientModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateClient}
                disabled={saving || !newClient.name || !newClient.email}
                loading={saving}
              >
                Create Client
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add Category Modal */}
        <Modal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          title="Add New Category"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category Name</label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
                leftIcon={<Tag className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description (Optional)</label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description"
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCategoryModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={saving || !newCategory.name}
                loading={saving}
              >
                Create Category
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Category Modal */}
        <Modal
          isOpen={editCategoryModalOpen}
          onClose={() => setEditCategoryModalOpen(false)}
          title="Edit Category"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category Name</label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
                leftIcon={<Tag className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description (Optional)</label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description"
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditCategoryModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditCategory}
                disabled={saving || !newCategory.name}
                loading={saving}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}