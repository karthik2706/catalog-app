import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import GuestCheckoutClient from './GuestCheckoutClient'

interface PageProps {
  params: Promise<{ slug: string }>
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
        currency: {
          select: {
            code: true,
            symbol: true
          }
        },
        country: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })
    return client
  } catch (error) {
    console.error('Error fetching client:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const client = await getClientInfo(slug)
  
  return {
    title: client ? `Checkout - ${client.name}` : 'Checkout',
    description: 'Complete your order',
  }
}

export default async function GuestCheckoutPage({ params }: PageProps) {
  const { slug } = await params

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
    <GuestCheckoutClient
      slug={slug}
      clientInfo={clientInfo}
      currencyCode={client.currency?.code || 'USD'}
      defaultCountry={client.country?.name ?? 'India'}
      defaultCountryCode={client.country?.code ?? 'IN'}
    />
  )
}

