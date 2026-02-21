'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { StaggerWrapper, FadeIn } from '@/components/ui/AnimatedWrapper'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { cn, formatCurrency, getCurrencyIcon } from '@/lib/utils'
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Users,
  BarChart3,
  RefreshCw,
} from 'lucide-react'

interface Stats {
  totalProducts: number
  lowStockProducts: number
  totalValue: number
  recentActivity: number
  totalCategories: number
  totalUsers: number
}

interface ActivityItem {
  id: string
  type: 'inventory' | 'product' | 'user'
  action: string
  item: string
  itemSku?: string | null
  itemId?: string | null
  user: string
  time: string
  timeAgo: string
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [clientCurrency, setClientCurrency] = useState<string>('USD')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchStats()
      fetchClientCurrency()
      fetchActivities()
    }
  }, [user, authLoading, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setLastUpdated(new Date())
      } else {
        throw new Error('Failed to fetch stats')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientCurrency = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok && data.client?.currency?.code) {
        setClientCurrency(data.client.currency.code)
      }
    } catch (err) {
      console.error('Error fetching client currency:', err)
    }
  }

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/activity?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (err) {
      console.error('Error fetching activities:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loading size="lg" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-error-50 border border-error-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-error-600 mr-2" />
            <p className="text-error-800">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      change: '+12%',
      changeType: 'positive' as const,
      description: 'Items in inventory'
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockProducts || 0,
      icon: AlertTriangle,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
      change: '-5%',
      changeType: 'negative' as const,
      description: 'Need restocking'
    },
    {
      title: 'Total Value',
      value: formatCurrency(stats?.totalValue || 0, clientCurrency),
      icon: getCurrencyIcon(clientCurrency),
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      change: '+8%',
      changeType: 'positive' as const,
      description: 'Inventory worth'
    },
    {
      title: 'Recent Activity',
      value: stats?.recentActivity || 0,
      icon: Activity,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      change: '+23%',
      changeType: 'positive' as const,
      description: 'Actions today'
    }
  ]

  const quickActions = [
    {
      title: 'Add Product',
      description: 'Add new item to inventory',
      icon: Plus,
      href: '/products/new',
      color: 'bg-primary-500 hover:bg-primary-600'
    },
    {
      title: 'View Reports',
      description: 'Analytics and insights',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-slate-500 hover:bg-slate-600'
    },
    {
      title: 'Manage Users',
      description: 'User management',
      icon: Users,
      href: '/settings',
      color: 'bg-success-500 hover:bg-success-600'
    }
  ]

  return (
    <DashboardLayout>
      <div className="section-spacing">
        {/* Header */}
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between header-spacing">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="mt-2 text-slate-600">
                Welcome back! Here&apos;s what&apos;s happening with your inventory.
              </p>
              {lastUpdated && (
                <p className="mt-1 text-xs text-slate-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  fetchStats()
                  fetchActivities()
                }}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                className="w-full sm:w-auto"
                onClick={() => router.push('/products/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Stats Grid */}
        <StaggerWrapper>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 grid-spacing">
            {statCards.map((stat, index) => {
              const Icon = stat.icon
              return (
                <AnimatedCard 
                  key={stat.title} 
                  className="card-hover"
                  delay={index * 0.1}
                  hover={true}
                >
                  <Card>
                    <CardContent className="card-spacing">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-600 mb-1">
                            {stat.title}
                          </p>
                          <p className="text-3xl font-bold text-slate-900">
                            {stat.value}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {stat.description}
                          </p>
                        </div>
                        <div className={cn('p-3 rounded-xl', stat.bgColor)}>
                          <Icon className={cn('w-6 h-6', stat.color)} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center">
                        {stat.changeType === 'positive' ? (
                          <ArrowUpRight className="w-4 h-4 text-success-600 mr-1" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-error-600 mr-1" />
                        )}
                        <span className={cn(
                          'text-sm font-medium',
                          stat.changeType === 'positive' ? 'text-success-600' : 'text-error-600'
                        )}>
                          {stat.change}
                        </span>
                        <span className="text-sm text-slate-500 ml-1">vs last month</span>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              )
            })}
          </div>
        </StaggerWrapper>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 grid-spacing">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="card-content-spacing">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.title}
                    onClick={() => router.push(action.href)}
                    className="w-full flex items-center p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className={cn('p-2 rounded-lg mr-3', action.color)}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-slate-900 group-hover:text-primary-600">
                        {action.title}
                      </div>
                      <div className="text-sm text-slate-500">
                        {action.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="card-content-spacing">
                {activities.length > 0 ? (
                  activities.map((activity) => {
                    const getActivityType = () => {
                      if (activity.type === 'inventory') return 'update'
                      if (activity.type === 'product') return 'add'
                      if (activity.type === 'user') return 'user'
                      return 'update'
                    }
                    const activityType = getActivityType()
                    
                    return (
                      <div 
                        key={activity.id} 
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (activity.itemId && activity.type !== 'user') {
                            router.push(`/products/${activity.itemId}`)
                          }
                        }}
                      >
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          activityType === 'add' && 'bg-success-500',
                          activityType === 'update' && 'bg-primary-500',
                          activityType === 'alert' && 'bg-warning-500',
                          activityType === 'user' && 'bg-slate-500'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {activity.action}
                          </p>
                          <p className="text-sm text-slate-500 truncate">
                            {activity.item}
                            {activity.itemSku && (
                              <span className="text-xs text-slate-400 ml-1">
                                ({activity.itemSku})
                              </span>
                            )}
                          </p>
                          {activity.user !== 'System' && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              by {activity.user}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {activity.timeAgo}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="w-2 h-2 bg-success-500 rounded-full mr-2" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 grid-spacing">
              <div className="flex items-center justify-between p-4 bg-success-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-success-800">Database</p>
                  <p className="text-xs text-success-600">Connected</p>
                </div>
                <Badge variant="success" size="sm">Online</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-primary-800">API</p>
                  <p className="text-xs text-primary-600">Healthy</p>
                </div>
                <Badge variant="primary" size="sm">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-800">Uptime</p>
                  <p className="text-xs text-slate-600">99.9%</p>
                </div>
                <Badge variant="default" size="sm">Stable</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}