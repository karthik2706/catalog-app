'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  LayoutDashboard,
  Key,
  Users,
  Settings,
  ArrowLeft,
  Menu,
  X,
  Building2,
  Package,
  BarChart3,
  Shield,
  Database,
  Activity,
  ChevronDown,
  Home
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    name: 'API Keys',
    href: '/admin/api-keys',
    icon: Key,
    description: 'Manage API keys for integrations'
  },
  {
    name: 'Clients',
    href: '/admin/clients',
    icon: Users,
    description: 'Manage client accounts'
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: Package,
    description: 'Product management'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Reports and insights'
  },
  {
    name: 'System',
    href: '/admin/system',
    icon: Database,
    description: 'System configuration'
  }
];

const quickActions = [
  {
    name: 'Create API Key',
    href: '/admin/api-keys?action=create',
    icon: Key,
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    name: 'Add Client',
    href: '/admin/clients?action=create',
    icon: Users,
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    name: 'View Settings',
    href: '/settings',
    icon: Settings,
    color: 'bg-gray-500 hover:bg-gray-600'
  }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const Sidebar = () => (
    <div className="flex flex-col h-screen bg-white border-r border-gray-200">
      {/* Logo and Title */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500">Catalog Management</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className={cn(
                'w-5 h-5',
                isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              )} />
              <div className="flex-1 min-w-0">
                <div className="truncate">{item.name}</div>
                <div className="text-xs text-gray-500 truncate">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="px-4 py-4 border-t border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="truncate">{action.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Back to App */}
      <div className="px-4 py-4 border-t border-gray-200">
        <Link
          href="/"
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
          <span>Back to App</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="px-[10px]">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mr-2"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {navigation.find(item => isActive(item.href))?.name || 'Admin Dashboard'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {navigation.find(item => isActive(item.href))?.description || 'Manage your catalog system'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-xs">
                  Admin Mode
                </Badge>
                <Link
                  href="/"
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to App</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-[10px]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}