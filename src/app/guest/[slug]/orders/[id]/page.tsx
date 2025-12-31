import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import GuestOrderConfirmationClient from './GuestOrderConfirmationClient'

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
        currency: {
          select: {
            code: true,
            symbol: true
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
    title: client ? `Order Confirmation - ${client.name}` : 'Order Confirmation',
    description: 'Your order has been placed successfully',
  }
}

export default async function GuestOrderConfirmationPage({ params }: PageProps) {
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
    <GuestOrderConfirmationClient
      slug={slug}
      orderId={id}
      clientInfo={clientInfo}
      currencyCode={client.currency?.code || 'USD'}
    />
  )
}

