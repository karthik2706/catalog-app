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
import { cn, formatDate } from '@/lib/utils'
import {
  Save,
  Plus,
  Edit,
  Trash2,
  Users,
  Package,
  BarChart3,
  Settings as SettingsIcon,
  Building,
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
  RotateCcw,
  Database,
  HardDrive,
  Shield,
  Activity,
  UserPlus,
  UserMinus,
  Tag,
  Trash,
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  description: string | null
  createdAt: string
}

interface Stats {
  totalProducts: number
  lowStockProducts: number
  totalCategories: number
  totalUsers: number
  totalValue: number
  recentActivity: number
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    currency: 'USD',
    timezone: 'America/New_York',
    lowStockThreshold: 10,
    autoReorder: true,
    emailNotifications: true,
    smsNotifications: false,
  })

  // Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')

  // User Management
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [newUserModalOpen, setNewUserModalOpen] = useState(false)
  const [editUserModalOpen, setEditUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER'
  })
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role: 'USER'
  })

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
      
      const [settingsRes, categoriesRes, usersRes, statsRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/categories'),
        fetch('/api/users'),
        fetch('/api/stats')
      ])

      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setGeneralSettings(settings)
      }

      if (categoriesRes.ok) {
        const categories = await categoriesRes.json()
        setCategories(categories)
      }

      if (usersRes.ok) {
        const users = await usersRes.json()
        setUsers(users)
      }

      if (statsRes.ok) {
        const stats = await statsRes.json()
        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setSnackbarMessage('Error loading data')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneralSettingsChange = (field: string, value: any) => {
    setGeneralSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveGeneralSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generalSettings),
      })

      if (response.ok) {
        setSnackbarMessage('Settings saved successfully!')
        setSnackbarSeverity('success')
        setSnackbarOpen(true)
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSnackbarMessage('Error saving settings')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim() || categories.some(cat => cat.name === newCategory.trim())) {
      return
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          category: newCategory.trim(),
          description: newCategoryDesc.trim() || null
        }),
      })

      if (response.ok) {
        const newCategoryData = await response.json()
        setCategories(prev => [...prev, newCategoryData])
        setNewCategory('')
        setNewCategoryDesc('')
        setSnackbarMessage('Category added successfully!')
        setSnackbarSeverity('success')
        setSnackbarOpen(true)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add category')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      setSnackbarMessage(error instanceof Error ? error.message : 'Error adding category')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const handleRemoveCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/categories?id=${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCategories(prev => prev.filter(c => c.id !== categoryId))
        setSnackbarMessage('Category removed successfully!')
        setSnackbarSeverity('success')
        setSnackbarOpen(true)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove category')
      }
    } catch (error) {
      console.error('Error removing category:', error)
      setSnackbarMessage(error instanceof Error ? error.message : 'Error removing category')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        setSnackbarMessage('User deleted successfully!')
        setSnackbarSeverity('success')
        setSnackbarOpen(true)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setSnackbarMessage(error instanceof Error ? error.message : 'Error deleting user')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const handleAddUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        const user = await response.json()
        setUsers(prev => [...prev, user])
        setNewUser({ name: '', email: '', password: '', role: 'USER' })
        setNewUserModalOpen(false)
        setSnackbarMessage('User created successfully!')
        setSnackbarSeverity('success')
        setSnackbarOpen(true)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setSnackbarMessage(error instanceof Error ? error.message : 'Error creating user')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role
    })
    setEditUserModalOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editUser),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u))
        setEditUserModalOpen(false)
        setEditingUser(null)
        setSnackbarMessage('User updated successfully!')
        setSnackbarSeverity('success')
        setSnackbarOpen(true)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      setSnackbarMessage(error instanceof Error ? error.message : 'Error updating user')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'system', label: 'System', icon: Activity },
  ]

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading size="lg" text="Loading settings..." />
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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="mt-2 text-slate-600">
            Manage your application settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <SettingsIcon className="w-5 h-5 mr-2" />
                      General Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Company Name"
                        value={generalSettings.companyName}
                        onChange={(e) => handleGeneralSettingsChange('companyName', e.target.value)}
                        leftIcon={<Building className="w-4 h-4" />}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={generalSettings.email}
                        onChange={(e) => handleGeneralSettingsChange('email', e.target.value)}
                        leftIcon={<Mail className="w-4 h-4" />}
                      />
                      <Input
                        label="Phone"
                        value={generalSettings.phone}
                        onChange={(e) => handleGeneralSettingsChange('phone', e.target.value)}
                        leftIcon={<Phone className="w-4 h-4" />}
                      />
                      <Input
                        label="Currency"
                        value={generalSettings.currency}
                        onChange={(e) => handleGeneralSettingsChange('currency', e.target.value)}
                        leftIcon={<DollarSign className="w-4 h-4" />}
                      />
                    </div>

                    <Input
                      label="Address"
                      value={generalSettings.address}
                      onChange={(e) => handleGeneralSettingsChange('address', e.target.value)}
                      leftIcon={<MapPin className="w-4 h-4" />}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Timezone"
                        value={generalSettings.timezone}
                        onChange={(e) => handleGeneralSettingsChange('timezone', e.target.value)}
                        leftIcon={<Clock className="w-4 h-4" />}
                      />
                      <Input
                        label="Low Stock Threshold"
                        type="number"
                        value={generalSettings.lowStockThreshold}
                        onChange={(e) => handleGeneralSettingsChange('lowStockThreshold', parseInt(e.target.value))}
                        leftIcon={<AlertTriangle className="w-4 h-4" />}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-slate-900">Notifications</h3>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={generalSettings.autoReorder}
                            onChange={(e) => handleGeneralSettingsChange('autoReorder', e.target.checked)}
                            className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-slate-700">Auto Reorder</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={generalSettings.emailNotifications}
                            onChange={(e) => handleGeneralSettingsChange('emailNotifications', e.target.checked)}
                            className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-slate-700">Email Notifications</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={generalSettings.smsNotifications}
                            onChange={(e) => handleGeneralSettingsChange('smsNotifications', e.target.checked)}
                            className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-slate-700">SMS Notifications</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveGeneralSettings}
                        disabled={saving}
                        loading={saving}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Total Products</p>
                          <p className="text-2xl font-bold text-slate-900">{stats?.totalProducts || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-warning-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Low Stock</p>
                          <p className="text-2xl font-bold text-slate-900">{stats?.lowStockProducts || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
                          <Tag className="w-5 h-5 text-success-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Categories</p>
                          <p className="text-2xl font-bold text-slate-900">{stats?.totalCategories || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Users</p>
                          <p className="text-2xl font-bold text-slate-900">{stats?.totalUsers || 0}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Tag className="w-5 h-5 mr-2" />
                    Product Categories
                  </div>
                  <Button
                    onClick={() => setNewUserModalOpen(true)}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">{category.name}</h3>
                        <p className="text-sm text-slate-500">
                          {category.description || 'No description'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Created {formatDate(category.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCategory(category.id)}
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
                      <p className="text-slate-500 mb-4">Get started by adding your first product category.</p>
                      <Button onClick={() => setNewUserModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    User Management
                  </div>
                  <Button
                    onClick={() => setNewUserModalOpen(true)}
                    size="sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{user.name}</h3>
                          <p className="text-sm text-slate-500">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="primary" size="sm">{user.role}</Badge>
                            <span className="text-xs text-slate-400">
                              Created {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System */}
          {activeTab === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Database className="w-6 h-6 text-success-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Database</h3>
                  <p className="text-sm text-slate-500 mb-2">Status</p>
                  <Badge variant="success" size="sm">Connected</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">API</h3>
                  <p className="text-sm text-slate-500 mb-2">Health</p>
                  <Badge variant="primary" size="sm">Healthy</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <HardDrive className="w-6 h-6 text-slate-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Storage</h3>
                  <p className="text-sm text-slate-500 mb-2">Used</p>
                  <p className="text-lg font-bold text-slate-900">2.5 MB</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-warning-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-6 h-6 text-warning-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">Version</h3>
                  <p className="text-sm text-slate-500 mb-2">App</p>
                  <p className="text-lg font-bold text-slate-900">1.0.0</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* New User Modal */}
        <Modal
          isOpen={newUserModalOpen}
          onClose={() => setNewUserModalOpen(false)}
          title="Add New User"
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
            />
            <Input
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
            />
            <Input
              label="Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter password"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                className="input w-full"
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="USER">User</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setNewUserModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={!newUser.name || !newUser.email || !newUser.password}
              >
                Add User
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={editUserModalOpen}
          onClose={() => setEditUserModalOpen(false)}
          title="Edit User"
          size="md"
        >
          <div className="space-y-4">
            <Input
              label="Name"
              value={editUser.name}
              onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
            />
            <Input
              label="Email"
              type="email"
              value={editUser.email}
              onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select
                value={editUser.role}
                onChange={(e) => setEditUser(prev => ({ ...prev, role: e.target.value }))}
                className="input w-full"
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="USER">User</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setEditUserModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={!editUser.name || !editUser.email}
              >
                Update User
              </Button>
            </div>
          </div>
        </Modal>

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