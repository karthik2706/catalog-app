import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import GuestLoginForm from './GuestLoginForm'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getClientBySlug(slug: string) {
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
  const client = await getClientBySlug(slug)
  
  return {
    title: client ? `Guest Access - ${client.name}` : 'Guest Access',
    description: client ? `Access the ${client.name} catalog` : 'Guest catalog access',
  }
}

export default async function GuestLoginPage({ params }: PageProps) {
  const { slug } = await params
  
  const cookieStore = await cookies()
  const guestToken = cookieStore.get(`guest_token_${slug}`)?.value
  
  if (guestToken) {
    try {
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(guestToken, process.env.JWT_SECRET || 'your-secret-key')
      if (decoded.type === 'guest' && decoded.clientSlug === slug) {
        redirect(`/guest/${slug}/catalog`)
      }
    } catch (error) {
      // Token invalid, continue to login
    }
  }

  const client = await getClientBySlug(slug)

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Catalog Not Found</h1>
          <p className="text-gray-600">The catalog &quot;{slug}&quot; does not exist.</p>
        </div>
      </div>
    )
  }

  if (!client.guestAccessEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
          <p className="text-gray-600">Guest access is not enabled for this catalog.</p>
        </div>
      </div>
    )
  }

  return (
    <GuestLoginForm
      slug={slug}
      clientName={client.name}
      clientLogo={client.logo}
      passwordRequired={client.guestPasswordRequired}
    />
  )
}
