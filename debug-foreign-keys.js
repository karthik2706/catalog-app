require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function debugForeignKeys() {
  console.log('🔍 Debugging foreign key constraints for client deletion...\n');

  const prisma = new PrismaClient();
  const clientId = 'cmg1a4yaa0000y7ndiwcbp1iq'; // Yoshita Fashion Jewellery

  try {
    // Check what records exist for this client
    console.log('📊 Checking records for client:', clientId);
    
    // Check products
    const products = await prisma.product.findMany({
      where: { clientId },
      select: { id: true, sku: true, name: true }
    });
    console.log(`Products: ${products.length}`);
    products.forEach(p => console.log(`  - ${p.sku}: ${p.name}`));

    // Check inventory history
    const inventoryHistory = await prisma.inventoryHistory.findMany({
      where: { clientId },
      select: { id: true, productId: true, quantity: true, type: true }
    });
    console.log(`Inventory History: ${inventoryHistory.length}`);
    inventoryHistory.forEach(ih => console.log(`  - Product ${ih.productId}: ${ih.quantity} (${ih.type})`));

    // Check product categories
    const productCategories = await prisma.productCategory.findMany({
      where: { product: { clientId } },
      select: { id: true, productId: true, categoryId: true }
    });
    console.log(`Product Categories: ${productCategories.length}`);

    // Check media
    const media = await prisma.media.findMany({
      where: { product: { clientId } },
      select: { id: true, productId: true, originalName: true }
    });
    console.log(`Media: ${media.length}`);

    // Check if there are any inventory history records that reference products
    if (products.length > 0) {
      console.log('\n🔍 Checking inventory history for each product...');
      for (const product of products) {
        const productHistory = await prisma.inventoryHistory.findMany({
          where: { productId: product.id },
          select: { id: true, quantity: true, type: true }
        });
        console.log(`Product ${product.sku} (${product.id}): ${productHistory.length} history records`);
        productHistory.forEach(ph => console.log(`  - ${ph.quantity} (${ph.type})`));
      }
    }

  } catch (error) {
    console.error('❌ Error debugging foreign keys:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Debug completed');
  }
}

debugForeignKeys();
