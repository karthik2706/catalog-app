#!/usr/bin/env tsx

/**
 * Script to check if a user exists in the database
 * Usage: tsx scripts/check-user.ts shop@yoshita.com
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
function loadEnvFile(filePath: string): Record<string, string> {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const env: Record<string, string> = {}
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '')
          env[key.trim()] = value.trim()
        }
      }
    })
    
    return env
  } catch (error) {
    return {}
  }
}

async function checkUser(email: string) {
  // Get local DATABASE_URL
  const localEnv = loadEnvFile(join(process.cwd(), '.env.local'))
  const env = loadEnvFile(join(process.cwd(), '.env'))
  const databaseUrl = localEnv.DATABASE_URL || env.DATABASE_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env.local or .env')
    process.exit(1)
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

  try {
    await prisma.$connect()
    console.log('🔌 Connected to database\n')

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
            isActive: true,
          },
        },
      },
    })

    if (user) {
      console.log('✅ User found!')
      console.log('')
      console.log('User Details:')
      console.log(`  ID: ${user.id}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Name: ${user.name || 'N/A'}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Active: ${user.isActive ? 'Yes' : 'No'}`)
      console.log(`  Created: ${user.createdAt}`)
      console.log('')
      if (user.client) {
        console.log('Client Details:')
        console.log(`  ID: ${user.client.id}`)
        console.log(`  Name: ${user.client.name}`)
        console.log(`  Slug: ${user.client.slug}`)
        console.log(`  Email: ${user.client.email}`)
        console.log(`  Active: ${user.client.isActive ? 'Yes' : 'No'}`)
      } else {
        console.log('Client: No client associated')
      }
    } else {
      console.log('❌ User not found')
      console.log(`Email: ${email}`)
      
      // Check if any similar emails exist
      const similarUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: email.split('@')[0],
          },
        },
        select: {
          email: true,
          name: true,
        },
        take: 5,
      })

      if (similarUsers.length > 0) {
        console.log('')
        console.log('Similar users found:')
        similarUsers.forEach(u => {
          console.log(`  - ${u.email} (${u.name || 'N/A'})`)
        })
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('Usage: tsx scripts/check-user.ts <email>')
  process.exit(1)
}

checkUser(email)

