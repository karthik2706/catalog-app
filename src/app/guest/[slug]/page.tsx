'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function GuestLoginRedirect() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  useEffect(() => {
    if (slug) {
      router.replace(`/guest?slug=${encodeURIComponent(slug)}`)
    } else {
      router.replace('/guest')
    }
  }, [slug, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
