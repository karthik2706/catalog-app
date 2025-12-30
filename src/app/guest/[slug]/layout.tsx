'use client'

import { GuestCartProvider } from '@/contexts/GuestCartContext'
import { useParams } from 'next/navigation'

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const slug = params.slug as string
  
  return <GuestCartProvider slug={slug}>{children}</GuestCartProvider>
}

