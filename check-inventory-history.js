#!/usr/bin/env node

/**
 * Check inventory history in catalog app
 */

const { PrismaClient } = require('@prisma/client');

async function checkInventoryHistory() {
  console.log('📊 Checking inventory history in catalog app...\n');

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

    // Get inventory history for this product
    const history = await prisma.inventoryHistory.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        quantity: true,
        type: true,
        reason: true,
        createdAt: true
      }
    });

    console.log(`\n📈 Found ${history.length} inventory history records:`);
    history.forEach((record, index) => {
      console.log(`${index + 1}. ${record.type} - ${record.quantity} units`);
      console.log(`   Reason: ${record.reason}`);
      console.log(`   Date: ${record.createdAt.toISOString()}`);
      console.log('');
    });

    await prisma.$disconnect();
    console.log('✅ Inventory history check completed');

  } catch (error) {
    console.error('❌ Error checking inventory history:', error);
  }
}

// Run the check
checkInventoryHistory();
