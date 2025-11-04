#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const email = 'shop@yoshita.com'
    console.log(`Checking for user: ${email}\n`)
    
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
      console.log('✅ User found!')
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
      console.log('❌ User not found')
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
        console.log('Similar users found:')
        similarUsers.forEach(u => {
          console.log(`  - ${u.email} (${u.name || 'N/A'}) - ${u.role}`)
        })
      } else {
        console.log('No similar users found')
      }
      
      // Check all users with yoshita
      const allYoshitaUsers = await prisma.user.findMany({
        select: {
          email: true,
          name: true,
        },
        take: 20,
      })
      
      console.log('')
      console.log(`Total users in database: ${allYoshitaUsers.length}`)
      if (allYoshitaUsers.length > 0 && allYoshitaUsers.length <= 20) {
        console.log('All users:')
        allYoshitaUsers.forEach(u => {
          console.log(`  - ${u.email} (${u.name || 'N/A'})`)
        })
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()

