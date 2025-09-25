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
  Search,
  Bell,
  ChevronDown,
  Home,
  Users,
  ShoppingCart,
  Menu as MenuIcon,
  Warehouse,
  Image,
  Activity,
  Database,
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
    description: 'Manage products'
  },
  { 
    text: 'Inventory', 
    icon: Warehouse, 
    path: '/inventory',
    description: 'Stock management'
  },
  { 
    text: 'Media', 
    icon: Image, 
    path: '/media',
    description: 'Media management'
  },
  { 
    text: 'Performance', 
    icon: Activity, 
    path: '/performance',
    description: 'Performance analytics'
  },
  { 
    text: 'Data Quality', 
    icon: Database, 
    path: '/data-quality',
    description: 'Data quality management'
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
    <div className="h-full bg-white border-r border-slate-200/50 flex flex-col min-w-0">
      {/* Logo */}
      <div className="card-spacing border-b border-slate-200/50">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Stock Mind</h1>
            <p className="text-xs sm:text-sm text-slate-500 truncate">Inventory Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 card-spacing list-spacing min-w-0">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          
          return (
            <button
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group min-w-0',
                active
                  ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 transition-colors flex-shrink-0',
                  active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                )} 
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.text}</div>
                <div className="text-xs text-slate-500 truncate">{item.description}</div>
              </div>
              {active && (
                <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0" />
              )}
            </button>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="card-spacing border-t border-slate-200/50 min-w-0">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
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
    <div className="min-h-screen min-w-mobile bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleDrawerToggle}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transform transition-transform duration-300 ease-in-out lg:hidden',
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
      <div className={cn(
        "min-w-mobile",
        isDesktop ? "pl-80" : ""
      )}>
        {/* Top Navigation */}
        <header className={cn(
          'sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-200 min-w-mobile',
          isScrolled ? 'shadow-sm' : ''
        )}>
          <div className="mobile-container">
            <div className="flex items-center justify-between h-16 min-w-0">
              {/* Left side */}
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDrawerToggle}
                  className="lg:hidden flex-shrink-0"
                >
                  <MenuIcon className="w-5 h-5" />
                </Button>
                
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-lg font-semibold text-slate-900 truncate">
                    {menuItems.find(item => isActive(item.path))?.text || 'Dashboard'}
                  </h2>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0">
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

                {/* User Menu */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-1 sm:space-x-2 min-w-0"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block text-left min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {user?.name || 'User'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {user?.role || 'USER'}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </Button>

                  {/* User Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-strong border border-slate-200/50 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-200/50">
                        <div className="font-medium text-slate-900 truncate">{user?.name || 'User'}</div>
                        <div className="text-sm text-slate-500 truncate">{user?.email}</div>
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
        <main className="min-h-screen min-w-mobile">
          <div className="page-container">
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