#!/usr/bin/env tsx

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

async function checkUserInProd() {
  try {
    // Get production DATABASE_URL
    const prodEnv = loadEnvFile(join(process.cwd(), '.env.production'))
    const prodDbUrl = process.env.PROD_DATABASE_URL || prodEnv.DATABASE_URL || process.env.DATABASE_URL

    if (!prodDbUrl) {
      console.error('❌ Production DATABASE_URL not found')
      console.error('Set PROD_DATABASE_URL or run: vercel env pull .env.production')
      process.exit(1)
    }

    const email = 'shop@yoshita.com'
    console.log(`Checking for user in PRODUCTION database: ${email}\n`)
    console.log(`Production DB: ${prodDbUrl.substring(0, 50)}...\n`)

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: prodDbUrl,
        },
      },
    })

    await prisma.$connect()
    console.log('✅ Connected to production database\n')

    const user = await prisma.user.findFirst({
      where: { email },
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
      console.log('✅ User found in PRODUCTION database!')
      console.log('')
      console.log('User Details:')
      console.log(`  ID: ${user.id}`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Name: ${user.name || 'N/A'}`)
      console.log(`  Role: ${user.role}`)
      console.log(`  Active: ${user.isActive ? 'Yes' : 'No'}`)
      console.log(`  Client ID: ${user.clientId || 'N/A'}`)
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
      console.log('❌ User not found in PRODUCTION database')
      console.log(`Email: ${email}`)
      console.log('')
      
      // Check for similar users
      const similarUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: 'yoshita' } },
            { email: { contains: 'shop' } },
          ],
        },
        select: {
          email: true,
          name: true,
          role: true,
        },
        take: 10,
      })

      if (similarUsers.length > 0) {
        console.log('Similar users found in production:')
        similarUsers.forEach(u => {
          console.log(`  - ${u.email} (${u.name || 'N/A'}) - ${u.role}`)
        })
      } else {
        console.log('No similar users found')
      }
      
      // Get total user count
      const userCount = await prisma.user.count()
      console.log('')
      console.log(`Total users in production database: ${userCount}`)
    }

    await prisma.$disconnect()
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.message?.includes('P1001')) {
      console.error('   Could not connect to production database. Check your DATABASE_URL.')
    }
    process.exit(1)
  }
}

checkUserInProd()

