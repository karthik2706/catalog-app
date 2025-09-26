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
import { cn, getCurrencyIcon } from '@/lib/utils'
import { Client } from '@/types'
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
  Globe,
  BellOff,
  Database,
  Shield,
  UserPlus,
  Tag,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  X,
  Eye,
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
  client?: {
    id: string
    currency?: {
      id: string
      code: string
      symbol: string
    }
  }
}

interface Category {
  id: string
  name: string
  description?: string
  parentId?: string
  sortOrder: number
  createdAt: string
  clientId: string
  children?: Category[]
}

interface CategoryItemProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (categoryId: string) => void
  onAddSubcategory: (parentId: string) => void
  level: number
}

function CategoryItem({ category, onEdit, onDelete, onAddSubcategory, level }: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = category.children && category.children.length > 0

  return (
    <div className="space-y-2">
      <div 
        className={`flex items-center justify-between p-4 border border-slate-200 rounded-xl ${
          level > 0 ? `ml-${level * 6} bg-slate-50` : 'bg-white'
        }`}
        style={{ marginLeft: level > 0 ? `${level * 24}px` : '0' }}
      >
        <div className="flex items-center space-x-4">
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-slate-900">
                {level > 0 && '— '.repeat(level)}
                {category.name}
              </h3>
              {level > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Level {level}
                </Badge>
              )}
            </div>
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
            onClick={() => onAddSubcategory(category.id)}
            className="text-primary-600 hover:bg-primary-50"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Add Sub</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(category)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(category.id)}
            className="text-error-600 hover:bg-error-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="space-y-2">
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubcategory={onAddSubcategory}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
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
  const [countries, setCountries] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])
  
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
    countryId: '',
    currencyId: '',
    password: '',
  })
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parentId: '',
    sortOrder: 0,
    clientId: '',
  })
  
  // Modal states
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [editUserModalOpen, setEditUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [viewClientModalOpen, setViewClientModalOpen] = useState(false)
  const [editClientModalOpen, setEditClientModalOpen] = useState(false)
  const [viewingClient, setViewingClient] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

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
      const [settingsRes, usersRes, clientsRes, categoriesRes, countriesRes, currenciesRes] = await Promise.all([
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
        fetch('/api/countries'),
        fetch('/api/currencies'),
      ])

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSettings(settingsData)
        setSettingsForm({
          companyName: settingsData.companyName || '',
          email: settingsData.email || '',
          phone: settingsData.phone || '',
          address: settingsData.address || '',
          currency: settingsData.client?.currency?.code || 'USD',
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

      if (countriesRes.ok) {
        const countriesData = await countriesRes.json()
        setCountries(countriesData)
      }

      if (currenciesRes.ok) {
        const currenciesData = await currenciesRes.json()
        setCurrencies(currenciesData)
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

      // Update client settings
      const settingsResponse = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(settingsForm),
      })

      if (!settingsResponse.ok) {
        const errorData = await settingsResponse.json()
        setError(errorData.error || 'Failed to save settings')
        return
      }

      // Update client currency if it changed
      const currentClient = settings?.client
      if (currentClient && settingsForm.currency !== currentClient.currency?.code) {
        // Find the currency ID for the selected currency
        const selectedCurrency = currencies.find(c => c.code === settingsForm.currency)
        if (selectedCurrency) {
          const clientResponse = await fetch(`/api/admin/clients/${currentClient.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              currencyId: selectedCurrency.id
            }),
          })

          if (!clientResponse.ok) {
            const errorData = await clientResponse.json()
            setError(errorData.error || 'Failed to update currency')
            return
          }
        }
      }

      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
      
      // Refresh data to get updated currency
      fetchData()
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
        setNewClient({ name: '', email: '', phone: '', address: '', plan: 'STARTER', countryId: '', currencyId: '', password: '' })
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

      // For super admin, we need to include clientId in the request
      const requestBody = user?.role === 'MASTER_ADMIN' 
        ? { ...newCategory, clientId: newCategory.clientId }
        : newCategory

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        setSuccess('Category created successfully!')
        setCategoryModalOpen(false)
        setNewCategory({ name: '', description: '', parentId: '', sortOrder: 0, clientId: '' })
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
      parentId: category.parentId || '',
      sortOrder: category.sortOrder || 0,
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
      
      // Find the category to get its clientId
      const category = findCategoryById(categories, categoryId)
      if (!category) {
        setError('Category not found')
        return
      }
      
      // Build URL with clientId for super admin
      let url = `/api/categories?id=${categoryId}`
      if (isSuperAdmin && category.clientId) {
        url += `&clientId=${category.clientId}`
      }
      
      const response = await fetch(url, {
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

  const handleViewClient = (client: Client) => {
    setViewingClient(client)
    setViewClientModalOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setNewClient({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
      plan: client.plan as any,
      countryId: client.countryId || '',
      currencyId: client.currencyId || '',
      password: '', // Don't pre-fill password
    })
    setEditClientModalOpen(true)
  }

  const handleSaveEditClient = async () => {
    if (!editingClient) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch(`/api/admin/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: newClient.name,
          email: newClient.email,
          phone: newClient.phone,
          address: newClient.address,
          plan: newClient.plan,
          countryId: newClient.countryId || null,
          currencyId: newClient.currencyId || null,
        }),
      })

      if (response.ok) {
        setSuccess('Client updated successfully!')
        setEditClientModalOpen(false)
        setEditingClient(null)
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update client')
      }
    } catch (error) {
      setError('Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone and will delete all associated data.')) {
      return
    }

    try {
      setSaving(true)
      setError('')

      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        setSuccess('Client deleted successfully!')
        setClients(clients.filter(client => client.id !== clientId))
        fetchData() // Refresh all data
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete client')
      }
    } catch (error) {
      setError('Failed to delete client')
    } finally {
      setSaving(false)
    }
  }

  // Helper function to find category by ID (including in children)
  const findCategoryById = (categories: Category[], id: string): Category | null => {
    for (const category of categories) {
      if (category.id === id) {
        return category
      }
      if (category.children) {
        const found = findCategoryById(category.children, id)
        if (found) return found
      }
    }
    return null
  }

  // Helper function to flatten categories for selection with level information
  const getAllCategoriesForSelection = (categories: Category[], level = 0): Array<Category & { level: number }> => {
    const result: Array<Category & { level: number }> = []
    
    for (const category of categories) {
      result.push({ ...category, level })
      if (category.children && category.children.length > 0) {
        result.push(...getAllCategoriesForSelection(category.children, level + 1))
      }
    }
    
    return result
  }

  // Helper function to get the full path of a category
  const getCategoryPath = (categories: Category[], categoryId: string): string => {
    const findCategoryWithPath = (cats: Category[], targetId: string, path: string[] = []): string[] | null => {
      for (const category of cats) {
        const currentPath = [...path, category.name]
        if (category.id === targetId) {
          return currentPath
        }
        if (category.children && category.children.length > 0) {
          const found = findCategoryWithPath(category.children, targetId, currentPath)
          if (found) return found
        }
      }
      return null
    }
    
    const path = findCategoryWithPath(categories, categoryId)
    return path ? path.join(' > ') : 'Unknown'
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
      case 'MASTER_ADMIN': return 'bg-red-100 text-red-800'
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

  const isSuperAdmin = user.role === 'MASTER_ADMIN'
  const isAdmin = user.role === 'ADMIN'
  const isManager = user.role === 'MANAGER'
  const isUser = user.role === 'USER'

  return (
    <DashboardLayout>
      <div className="space-y-6">
          <FadeIn>
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center space-x-2 sm:space-x-3">
                <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 flex-shrink-0" />
                <span className="truncate">Settings</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600">
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
            <div className="mb-6 sm:mb-8">
              <div className="border-b border-slate-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
                  {[
                    { id: 'general', label: 'General Settings', icon: SettingsIcon, shortLabel: 'General' },
                    { id: 'categories', label: 'Category Management', icon: Tag, shortLabel: 'Categories' },
                    ...(isUser ? [] : [{ id: 'users', label: 'User Management', icon: Users, shortLabel: 'Users' }]),
                    ...(isSuperAdmin ? [{ id: 'clients', label: 'Client Management', icon: Building2, shortLabel: 'Clients' }] : []),
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center space-x-1 sm:space-x-2 py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap',
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      )}
                    >
                      <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.shortLabel}</span>
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
                            {currencies.map((currency) => (
                              <option key={currency.id} value={currency.code}>
                                {currency.symbol} {currency.code} - {currency.name}
                              </option>
                            ))}
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
                          <CategoryItem
                            key={category.id}
                            category={category}
                            onEdit={handleEditCategory}
                            onDelete={handleDeleteCategory}
                            onAddSubcategory={(parentId) => {
                              setNewCategory(prev => ({ ...prev, parentId, sortOrder: 0 }))
                              setCategoryModalOpen(true)
                            }}
                            level={0}
                          />
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
                              {client.country && (
                                <div className="flex items-center space-x-2">
                                  <Globe className="w-4 h-4" />
                                  <span>{client.country.name}</span>
                                </div>
                              )}
                              {client.currency && (
                                <div className="flex items-center space-x-2">
                                  {React.createElement(getCurrencyIcon(client.currency.code), { className: "w-4 h-4" })}
                                  <span>{client.currency.symbol} {client.currency.code}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                              <div className="flex space-x-4 text-xs text-slate-500">
                                <span>{client._count?.users || 0} users</span>
                                <span>{client._count?.products || 0} products</span>
                              </div>
                              <div className="flex items-center space-x-2">
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
                                <div className="flex space-x-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewClient(client)}
                                    className="text-primary-600 hover:bg-primary-50"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditClient(client)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteClient(client.id)}
                                    className="text-red-600 hover:bg-red-50 hover:border-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
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
                {isSuperAdmin && <option value="MASTER_ADMIN">Master Admin</option>}
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
                {isSuperAdmin && <option value="MASTER_ADMIN">Master Admin</option>}
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
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <div className="space-y-8 p-1">
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Company Name</label>
              <Input
                value={newClient.name}
                onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter company name"
                leftIcon={<Building2 className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <Input
                value={newClient.phone}
                onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Address</label>
              <textarea
                value={newClient.address}
                onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter company address"
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Country</label>
                <select
                  value={newClient.countryId}
                  onChange={(e) => setNewClient(prev => ({ ...prev, countryId: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Currency</label>
                <select
                  value={newClient.currencyId}
                  onChange={(e) => setNewClient(prev => ({ ...prev, currencyId: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.name} ({currency.symbol} {currency.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Input
                type="password"
                value={newClient.password}
                onChange={(e) => setNewClient(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password for client admin"
                leftIcon={<Shield className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-3">
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
                disabled={saving || !newClient.name || !newClient.email || !newClient.password}
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
          title={newCategory.parentId ? "Add Subcategory" : "Add New Category"}
        >
          <div className="space-y-6">
            {isSuperAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Company</label>
                <select
                  value={newCategory.clientId}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, clientId: e.target.value }))}
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

            {newCategory.parentId && (
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-700">
                  <strong>Parent Category:</strong> {getCategoryPath(categories, newCategory.parentId) || 'Unknown'}
                </p>
              </div>
            )}
            
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Parent Category (Optional)</label>
              <select
                value={newCategory.parentId}
                onChange={(e) => setNewCategory(prev => ({ ...prev, parentId: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select parent category (or leave empty for main category)</option>
                {getAllCategoriesForSelection(categories).map((category) => (
                  <option key={category.id} value={category.id}>
                    {'—'.repeat(category.level)} {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sort Order</label>
              <Input
                type="number"
                value={newCategory.sortOrder}
                onChange={(e) => setNewCategory(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                className="w-32"
              />
              <p className="text-xs text-slate-500">Lower numbers appear first</p>
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
                disabled={saving || !newCategory.name || (isSuperAdmin && !newCategory.clientId)}
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
            {isSuperAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Company</label>
                <select
                  value={newCategory.clientId}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, clientId: e.target.value }))}
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Parent Category</label>
              <select
                value={newCategory.parentId || ''}
                onChange={(e) => setNewCategory(prev => ({ ...prev, parentId: e.target.value || '' }))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">No parent (main category)</option>
                {categories.filter(c => !c.parentId && c.id !== editingCategory?.id).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sort Order</label>
              <Input
                type="number"
                value={newCategory.sortOrder}
                onChange={(e) => setNewCategory(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                className="w-32"
              />
              <p className="text-xs text-slate-500">Lower numbers appear first</p>
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

        {/* View Client Modal */}
        <Modal
          isOpen={viewClientModalOpen}
          onClose={() => setViewClientModalOpen(false)}
          title="Client Details"
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {viewingClient && (
            <div className="space-y-8 p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Client ID</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <code className="text-sm text-slate-600 font-mono break-all">{viewingClient.id}</code>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Slug</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <code className="text-sm text-slate-600 font-mono">@{viewingClient.slug}</code>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Company Name</label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-900 font-medium">{viewingClient.name}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-900">{viewingClient.email}</span>
                </div>
              </div>

              {viewingClient.phone && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-900">{viewingClient.phone}</span>
                  </div>
                </div>
              )}

              {viewingClient.address && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Address</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-900">{viewingClient.address}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Plan</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <Badge className={getPlanColor(viewingClient.plan)}>
                      {viewingClient.plan}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {viewingClient.isActive ? (
                        <CheckCircle className="w-4 h-4 text-success-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-error-600" />
                      )}
                      <span className={`text-sm font-medium ${viewingClient.isActive ? 'text-success-600' : 'text-error-600'}`}>
                        {viewingClient.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {viewingClient.country && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Country</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-900">{viewingClient.country.name} ({viewingClient.country.code})</span>
                  </div>
                </div>
              )}

              {viewingClient.currency && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Currency</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {React.createElement(getCurrencyIcon(viewingClient.currency.code), { className: "w-4 h-4" })}
                      <span className="text-slate-900">{viewingClient.currency.symbol} {viewingClient.currency.code} - {viewingClient.currency.name}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Users</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-900 font-medium text-lg">{viewingClient._count?.users || 0}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Products</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-900 font-medium text-lg">{viewingClient._count?.products || 0}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Created At</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-900">{new Date(viewingClient.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">Updated At</label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-900">{new Date(viewingClient.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setViewClientModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setViewClientModalOpen(false)
                    handleEditClient(viewingClient)
                  }}
                >
                  Edit Client
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Client Modal */}
        <Modal
          isOpen={editClientModalOpen}
          onClose={() => setEditClientModalOpen(false)}
          title="Edit Client"
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <div className="space-y-8 p-1">
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Company Name</label>
              <Input
                value={newClient.name}
                onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter company name"
                leftIcon={<Building2 className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <Input
                value={newClient.phone}
                onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Address</label>
              <textarea
                value={newClient.address}
                onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter company address"
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Country</label>
                <select
                  value={newClient.countryId}
                  onChange={(e) => setNewClient(prev => ({ ...prev, countryId: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Currency</label>
                <select
                  value={newClient.currencyId}
                  onChange={(e) => setNewClient(prev => ({ ...prev, currencyId: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.name} ({currency.symbol} {currency.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-3">
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
                onClick={() => setEditClientModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditClient}
                disabled={saving || !newClient.name || !newClient.email}
                loading={saving}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
    </DashboardLayout>
  )
}