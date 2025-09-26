#!/usr/bin/env node

/**
 * Check clients in catalog app database
 */

const { PrismaClient } = require('@prisma/client');

async function checkClients() {
  console.log('🔍 Checking clients in catalog app database...\n');

  try {
    const prisma = new PrismaClient();

    // Check all clients
    const clients = await prisma.Client.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        plan: true,
        email: true
      }
    });

    console.log(`Found ${clients.length} clients:`);
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name}`);
      console.log(`   ID: ${client.id}`);
      console.log(`   Slug: ${client.slug || 'MISSING'}`);
      console.log(`   Active: ${client.isActive}`);
      console.log(`   Plan: ${client.plan}`);
      console.log(`   Email: ${client.email}`);
      console.log('');
    });

    // Check if yoshita-fashion-jewellery exists
    const yoshitaClient = clients.find(c => c.slug === 'yoshita-fashion-jewellery');
    if (yoshitaClient) {
      console.log('✅ Found yoshita-fashion-jewellery client:', yoshitaClient);
    } else {
      console.log('❌ yoshita-fashion-jewellery client not found');
      console.log('🔧 Creating yoshita-fashion-jewellery client...');
      
      const newClient = await prisma.Client.create({
        data: {
          name: 'Yoshita Fashion Jewellery',
          slug: 'yoshita-fashion-jewellery',
          isActive: true,
          plan: 'STARTER',
          email: 'yoshita@example.com'
        }
      });
      
      console.log('✅ Created client:', newClient);
    }

    await prisma.$disconnect();
    console.log('\n✅ Database check completed');

  } catch (error) {
    console.error('❌ Error checking clients:', error);
  }
}

// Run the check
checkClients();
