'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loading } from '@/components/ui/Loading'
import { cn } from '@/lib/utils'
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShoppingCart,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Zap,
  BarChart3,
  Package,
} from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const { login, register } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await register(email, password, name)
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track and manage your product catalog with ease'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Get insights into your inventory performance'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security for your data'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Stay updated with live inventory changes'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-700 p-12 flex-col justify-center">
        <div className="max-w-md">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Retail Catalog</h1>
              <p className="text-primary-100">Inventory Management System</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-6">
            Streamline Your Inventory Management
          </h2>
          
          <p className="text-primary-100 text-lg mb-8">
            Take control of your inventory with our powerful, user-friendly platform designed for modern businesses.
          </p>

          <div className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                    <p className="text-primary-100 text-sm">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-7 h-7 text-white" />
            </div>
          </div>

          <Card className="card-hover">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-slate-900">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <p className="text-slate-600 mt-2">
                {isLogin 
                  ? 'Sign in to your account to continue' 
                  : 'Get started with your free account today'
                }
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <div className="bg-error-50 border border-error-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <XCircle className="w-5 h-5 text-error-600 mr-2" />
                    <p className="text-error-800 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
                {!isLogin && (
                  <Input
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    leftIcon={<User className="w-4 h-4" />}
                    placeholder="Enter your full name"
                    required
                  />
                )}

                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  placeholder="Enter your email"
                  required
                />

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  placeholder="Enter your password"
                  required
                />

                {isLogin && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-slate-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <Loading size="sm" />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button variant="outline" className="w-full">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </Button>
              </div>

              {/* Toggle Auth Mode */}
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin)
                      setError('')
                    }}
                    className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-500">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  )
}