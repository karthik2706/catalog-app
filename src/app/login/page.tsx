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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const { login } = useAuth()
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
              <h1 className="text-2xl font-bold text-white">Quick Stock</h1>
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
                Welcome Back
              </CardTitle>
              <p className="text-slate-600 mt-2">
                Sign in to your account to continue
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

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">

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
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

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