#!/usr/bin/env node

/**
 * Test creating inventory history directly
 */

const { PrismaClient } = require('@prisma/client');

async function testInventoryHistory() {
  console.log('🧪 Testing inventory history creation...\n');

  try {
    const prisma = new PrismaClient();

    // Get the test product
    const product = await prisma.Product.findFirst({
      where: { sku: 'VFJ-78687' },
      select: { id: true, sku: true, name: true, stockLevel: true }
    });

    if (!product) {
      console.log('❌ Test product not found');
      return;
    }

    console.log('📦 Product:', product);

    // Try to create inventory history directly
    try {
      const historyRecord = await prisma.inventoryHistory.create({
        data: {
          productId: product.id,
          quantity: -1,
          type: 'SALE',
          reason: 'Test inventory history creation',
          clientId: 'cmg1a4yaa0000y7ndiwcbp1iq',
          userId: null
        }
      });

      console.log('✅ Successfully created inventory history:', historyRecord);

      // Check if it was actually created
      const allHistory = await prisma.inventoryHistory.findMany({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      console.log(`\n📈 Found ${allHistory.length} inventory history records:`);
      allHistory.forEach((record, index) => {
        console.log(`${index + 1}. ${record.type} - ${record.quantity} units`);
        console.log(`   Reason: ${record.reason}`);
        console.log(`   Date: ${record.createdAt.toISOString()}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Error creating inventory history:', error);
    }

    await prisma.$disconnect();
    console.log('\n✅ Test completed');

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testInventoryHistory();
