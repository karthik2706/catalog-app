import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import GuestProductDetailClient from './GuestProductDetailClient'

interface PageProps {
  params: Promise<{ slug: string; id: string }>
}

interface GuestJWTPayload {
  type: string
  clientId: string
  clientSlug: string
  clientName: string
}

async function getGuestToken(slug: string): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(`guest_token_${slug}`)?.value
  if (!token) return null

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET not configured')
    }
    const decoded = jwt.verify(token, secret) as GuestJWTPayload
    if (decoded.type === 'guest' && decoded.clientSlug === slug) {
      return token
    }
  } catch (error) {
    return null
  }
  return null
}

async function getClientInfo(slug: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        guestAccessEnabled: true,
      }
    })
    return client
  } catch (error) {
    console.error('Error fetching client:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, id } = await params
  const client = await getClientInfo(slug)
  
  return {
    title: client ? `Product - ${client.name}` : 'Product Details',
    description: client ? `View product details from ${client.name}` : 'Product details',
  }
}

export default async function GuestProductDetailPage({ params }: PageProps) {
  const { slug, id } = await params

  // Check authentication
  const token = await getGuestToken(slug)
  if (!token) {
    redirect(`/guest/${slug}`)
  }

  // Verify client exists and guest access is enabled
  const client = await getClientInfo(slug)
  if (!client || !client.guestAccessEnabled) {
    redirect(`/guest/${slug}`)
  }

  const clientInfo = {
    id: client.id,
    name: client.name,
    slug: client.slug,
    logo: client.logo
  }

  return (
    <GuestProductDetailClient
      slug={slug}
      productId={id}
      clientInfo={clientInfo}
    />
  )
}

