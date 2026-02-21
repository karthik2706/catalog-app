import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import GuestCatalogClient from './GuestCatalogClient'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as GuestJWTPayload
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
        guestPasswordRequired: true,
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
    title: client ? `${client.name} - Catalog` : 'Guest Catalog',
    description: client ? `Browse products from ${client.name}` : 'Guest catalog',
  }
}

export default async function GuestCatalogPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const searchParamsObj = await searchParams

  const client = await getClientInfo(slug)
  if (!client || !client.guestAccessEnabled) {
    redirect(`/guest/${slug}`)
  }

  const token = await getGuestToken(slug)

  if (!token) {
    redirect(`/guest/${slug}`)
  }

  const page = searchParamsObj.page ? parseInt(searchParamsObj.page as string) : 1
  const search = (searchParamsObj.search as string) || ''
  const category = (searchParamsObj.category as string) || ''

  const cookieStore = await cookies()
  const clientCookie = cookieStore.get(`guest_client_${slug}`)?.value
  let clientInfo = null
  if (clientCookie) {
    try {
      clientInfo = JSON.parse(clientCookie)
    } catch (e) {
      clientInfo = {
        id: client.id,
        name: client.name,
        slug: client.slug,
        logo: client.logo,
        currency: client.currency
      }
    }
  } else {
    clientInfo = {
      id: client.id,
      name: client.name,
      slug: client.slug,
      logo: client.logo,
      currency: client.currency
    }
  }

  return (
    <GuestCatalogClient
      slug={slug}
      initialClientInfo={clientInfo}
      initialPage={page}
      initialSearch={search}
      initialCategory={category}
      currencyCode={client.currency?.code || 'USD'}
    />
  )
}
