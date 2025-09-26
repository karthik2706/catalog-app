#!/usr/bin/env node

/**
 * Test the API locally to see if inventory history is created
 */

const { PrismaClient } = require('@prisma/client');

async function testApiLocally() {
  console.log('🧪 Testing API locally...\n');

  try {
    const prisma = new PrismaClient();

    // Get the client and product
    const client = await prisma.Client.findFirst({
      where: { slug: 'yoshita-fashion-jewellery' },
      select: { id: true, name: true, slug: true }
    });

    const product = await prisma.Product.findFirst({
      where: { sku: 'VFJ-78687' },
      select: { id: true, sku: true, name: true, stockLevel: true }
    });

    if (!client || !product) {
      console.log('❌ Client or product not found');
      return;
    }

    console.log('📦 Product before:', product);
    console.log('🏢 Client:', client);

    // Simulate the API logic
    const item = { sku: 'VFJ-78687', quantity: 1 };
    const order = { orderId: 'test-local-133' };
    const newStockLevel = Math.max(0, product.stockLevel - item.quantity);

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { stockLevel: newStockLevel },
      select: {
        id: true,
        sku: true,
        name: true,
        stockLevel: true,
        minStock: true
      }
    });

    console.log('📦 Product after update:', updatedProduct);

    // Create inventory history record
    try {
      console.log(`🔍 Creating inventory history for ${item.sku} with clientId: ${client.id}`)
      const historyRecord = await prisma.inventoryHistory.create({
        data: {
          productId: product.id,
          quantity: -item.quantity, // Negative for reduction
          type: 'SALE',
          reason: `Order ${order.orderId} - Inventory reduction via API`,
          clientId: client.id,
          userId: null // API call, no specific user
        }
      })
      console.log(`✅ Created inventory history for ${item.sku}:`, historyRecord.id)
    } catch (historyError) {
      console.error(`❌ Failed to create inventory history for ${item.sku}:`, historyError)
      console.error(`❌ Error details:`, {
        productId: product.id,
        clientId: client.id,
        quantity: -item.quantity,
        type: 'SALE'
      })
    }

    // Check final inventory history
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

    await prisma.$disconnect();
    console.log('\n✅ Local test completed');

  } catch (error) {
    console.error('❌ Error during local test:', error);
  }
}

// Run the test
testApiLocally();
