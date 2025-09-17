'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Loading } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { FadeIn, StaggerWrapper } from '@/components/ui/AnimatedWrapper'
import {
  Building2,
  Plus,
  Search,
  Users,
  Package,
  TrendingUp,
  Settings,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'

interface Client {
  id: string
  name: string
  slug: string
  email: string
  phone?: string
  address?: string
  isActive: boolean
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  createdAt: string
  _count: {
    users: number
    products: number
  }
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    plan: 'STARTER' as const,
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.push('/login')
      return
    }

    if (user && user.role === 'SUPER_ADMIN') {
      fetchClients()
    }
  }, [user, authLoading, router])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/clients')
      const data = await response.json()
      
      if (response.ok) {
        setClients(data.clients)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClient = async () => {
    try {
      setCreating(true)
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      })

      if (response.ok) {
        setCreateModalOpen(false)
        setNewClient({ name: '', email: '', phone: '', address: '', plan: 'STARTER' })
        fetchClients()
      }
    } catch (error) {
      console.error('Error creating client:', error)
    } finally {
      setCreating(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'STARTER': return 'bg-blue-100 text-blue-800'
      case 'PROFESSIONAL': return 'bg-purple-100 text-purple-800'
      case 'ENTERPRISE': return 'bg-gold-100 text-gold-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    )
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-4 sm:p-6 lg:p-8">
        <FadeIn>
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center space-x-3">
                  <Building2 className="w-8 h-8 text-primary-600" />
                  <span>Client Management</span>
                </h1>
                <p className="mt-2 text-slate-600">
                  Manage your SaaS platform clients and their accounts
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Client</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <StaggerWrapper>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <FadeIn delay={0.1}>
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Clients</p>
                        <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
                      </div>
                      <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.2}>
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Active Clients</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {clients.filter(c => c.isActive).length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-success-600" />
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.3}>
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Users</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {clients.reduce((sum, c) => sum + c._count.users, 0)}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.4}>
                <Card className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total Products</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {clients.reduce((sum, c) => sum + c._count.products, 0)}
                        </p>
                      </div>
                      <Package className="w-8 h-8 text-amber-600" />
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </StaggerWrapper>

          {/* Search and Filters */}
          <FadeIn delay={0.5}>
            <Card className="card-hover mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex-1 max-w-md">
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      leftIcon={<Search className="w-4 h-4" />}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="secondary" className="px-3 py-1">
                      {filteredClients.length} clients
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Clients List */}
          <FadeIn delay={0.6}>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card key={client.id} className="card-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <p className="text-sm text-slate-500">@{client.slug}</p>
                        </div>
                      </div>
                      <Badge className={getPlanColor(client.plan)}>
                        {client.plan}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4" />
                        <span>{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>{client._count.users} users</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span>{client._count.products} products</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(client.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <div className="flex items-center space-x-2">
                        {client.isActive ? (
                          <CheckCircle className="w-4 h-4 text-success-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-error-600" />
                        )}
                        <span className={`text-sm ${client.isActive ? 'text-success-600' : 'text-error-600'}`}>
                          {client.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://${client.slug}.localhost:3000`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-error-600 hover:bg-error-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </FadeIn>
        </FadeIn>
      </div>

      {/* Create Client Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Client"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Company Name *</label>
            <Input
              value={newClient.name}
              onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter company name"
              leftIcon={<Building2 className="w-4 h-4" />}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email *</label>
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
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateClient}
              disabled={creating || !newClient.name || !newClient.email}
              loading={creating}
            >
              Create Client
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
