#!/usr/bin/env node

/**
 * Create a test product in the catalog app
 */

const { PrismaClient } = require('@prisma/client');

async function createTestProduct() {
  console.log('📦 Creating test product in catalog app...\n');

  try {
    const prisma = new PrismaClient();

    // Create a test product
    const product = await prisma.Product.create({
      data: {
        sku: 'VFJ-78687',
        name: 'Test Fashion Jewelry Item',
        description: 'A test product for inventory reduction testing',
        price: 99.99,
        clientId: 'cmg1a4yaa0000y7ndiwcbp1iq', // Yoshita client ID
        category: 'Test Category',
        isActive: true,
        stockLevel: 100, // Start with 100 units
        minStock: 10
      }
    });

    console.log('✅ Created test product:');
    console.log(`SKU: ${product.sku}`);
    console.log(`Name: ${product.name}`);
    console.log(`Client ID: ${product.clientId}`);
    console.log(`Stock Level: ${product.stockLevel}`);
    console.log(`Active: ${product.isActive}`);

    await prisma.$disconnect();
    console.log('\n✅ Test product creation completed');

  } catch (error) {
    console.error('❌ Error creating test product:', error);
  }
}

// Run the script
createTestProduct();
