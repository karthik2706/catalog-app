'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Modal } from './ui/Modal'
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  User,
  LogOut,
  Plus,
  Search,
  Bell,
  ChevronDown,
  Home,
  Users,
  ShoppingCart,
  Menu as MenuIcon,
} from 'lucide-react'

const drawerWidth = 280

interface DashboardLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/',
    description: 'Overview and analytics'
  },
  { 
    text: 'Products', 
    icon: Package, 
    path: '/products',
    description: 'Manage inventory'
  },
  { 
    text: 'Reports', 
    icon: BarChart3, 
    path: '/reports',
    description: 'Analytics and insights'
  },
  { 
    text: 'Settings', 
    icon: Settings, 
    path: '/settings',
    description: 'System configuration'
  },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    // Only add event listener on client side
    if (typeof window !== 'undefined') {
      handleResize() // Set initial value
      window.addEventListener('scroll', handleScroll)
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    router.push('/login')
  }

  const handleProfile = () => {
    router.push('/profile')
    setUserMenuOpen(false)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setMobileOpen(false)
  }

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  // Show loading state to prevent hydration mismatch
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  const Sidebar = () => (
    <div className="h-full bg-white border-r border-slate-200/50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Retail Catalog</h1>
            <p className="text-sm text-slate-500">Inventory Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <button
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group',
                active
                  ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 transition-colors',
                  active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                )} 
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.text}</div>
                <div className="text-xs text-slate-500 truncate">{item.description}</div>
              </div>
              {active && (
                <div className="w-2 h-2 bg-primary-600 rounded-full" />
              )}
            </button>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-slate-200/50">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900 truncate">
              {user?.name || 'User'}
            </div>
            <div className="text-sm text-slate-500 truncate">
              {user?.email}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleDrawerToggle}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar />
      </div>

      {/* Desktop Sidebar */}
      {isDesktop && (
        <div className="fixed inset-y-0 left-0 z-30 w-80">
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <div className={isDesktop ? "pl-80" : ""}>
        {/* Top Navigation */}
        <header className={cn(
          'sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-200',
          isScrolled ? 'shadow-sm' : ''
        )}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left side */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDrawerToggle}
                  className="lg:hidden"
                >
                  <MenuIcon className="w-5 h-5" />
                </Button>
                
                <div className="hidden sm:block">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {menuItems.find(item => isActive(item.path))?.text || 'Dashboard'}
                  </h2>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Search */}
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Search className="w-4 h-4" />
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <Badge 
                    variant="error" 
                    size="sm" 
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center"
                  >
                    3
                  </Badge>
                </Button>

                {/* Add New */}
                <Button size="sm" className="hidden sm:flex">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New
                </Button>

                {/* User Menu */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-slate-900">
                        {user?.name || 'User'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {user?.role || 'USER'}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-strong border border-slate-200/50 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-200/50">
                        <div className="font-medium text-slate-900">{user?.name || 'User'}</div>
                        <div className="text-sm text-slate-500">{user?.email}</div>
                        <Badge variant="primary" size="sm" className="mt-1">
                          {user?.role || 'USER'}
                        </Badge>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={handleProfile}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Profile Settings</span>
                        </button>
                        
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  )
}