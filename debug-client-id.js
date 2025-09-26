#!/usr/bin/env node

/**
 * Debug client ID issue
 */

const { PrismaClient } = require('@prisma/client');

async function debugClientId() {
  console.log('🔍 Debugging client ID issue...\n');

  try {
    const prisma = new PrismaClient();

    // Check the client by slug
    const client = await prisma.Client.findFirst({
      where: { slug: 'yoshita-fashion-jewellery' },
      select: { id: true, name: true, slug: true }
    });

    if (client) {
      console.log('✅ Found client by slug:', client);
    } else {
      console.log('❌ Client not found by slug');
    }

    // Check the client by ID
    const clientById = await prisma.Client.findUnique({
      where: { id: 'cmg1a4yaa0000y7ndiwcbp1iq' },
      select: { id: true, name: true, slug: true }
    });

    if (clientById) {
      console.log('✅ Found client by ID:', clientById);
    } else {
      console.log('❌ Client not found by ID');
    }

    // Try to create inventory history with the correct client ID
    const product = await prisma.Product.findFirst({
      where: { sku: 'VFJ-78687' },
      select: { id: true, sku: true }
    });

    if (product && client) {
      try {
        const historyRecord = await prisma.inventoryHistory.create({
          data: {
            productId: product.id,
            quantity: -1,
            type: 'SALE',
            reason: 'Debug test with correct client ID',
            clientId: client.id, // Use the client found by slug
            userId: null
          }
        });
        console.log('✅ Successfully created inventory history with correct client ID:', historyRecord.id);
      } catch (error) {
        console.error('❌ Error creating inventory history with correct client ID:', error);
      }
    }

    await prisma.$disconnect();
    console.log('\n✅ Debug completed');

  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Run the debug
debugClientId();
