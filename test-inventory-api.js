#!/usr/bin/env node

/**
 * Test script for Inventory Management APIs
 * 
 * This script demonstrates how to use the inventory management APIs
 * for external system integration and webhook testing.
 */

const BASE_URL = 'http://localhost:3000';

// Example API key for public endpoints (if configured)
const API_KEY = 'your-api-key-here';

// Example client slug
const CLIENT_SLUG = 'enterprise';

async function testCheckInventory() {
  console.log('📦 Testing Check Inventory Availability...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/public/inventory/check?client=${CLIENT_SLUG}`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          { sku: 'KB-002', quantity: 2 },
          { sku: 'NB-004', quantity: 1 },
          { sku: 'UC-003', quantity: 5 }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Inventory check successful!');
      console.log(`   All items available: ${data.data.allItemsAvailable}`);
      console.log(`   Available items: ${data.data.summary.availableItems}/${data.data.summary.totalItems}`);
      console.log(`   Low stock items: ${data.data.summary.lowStockItems}`);
      
      if (data.data.availability.length > 0) {
        console.log('\n📋 Item Details:');
        data.data.availability.forEach(item => {
          console.log(`   ${item.sku} (${item.productName}):`);
          console.log(`     Available: ${item.available ? '✅' : '❌'}`);
          console.log(`     Stock: ${item.stockLevel} (requested: ${item.requested})`);
          console.log(`     Price: $${item.price}`);
          if (item.isLowStock) {
            console.log(`     ⚠️  Low stock warning!`);
          }
        });
      }

      if (data.data.lowStockAlerts.length > 0) {
        console.log('\n⚠️  Low Stock Alerts:');
        data.data.lowStockAlerts.forEach(alert => {
          console.log(`   ${alert.sku}: ${alert.message}`);
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testReduceInventory() {
  console.log('\n📉 Testing Reduce Inventory (Order Fulfillment)...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/public/inventory/reduce?client=${CLIENT_SLUG}`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: `test_order_${Date.now()}`,
        items: [
          { sku: 'KB-002', quantity: 1 },
          { sku: 'NB-004', quantity: 1 }
        ],
        reduceMode: 'strict',
        webhookId: `webhook_${Date.now()}`
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Inventory reduction successful!');
      console.log(`   Order ID: ${data.data.orderId}`);
      console.log(`   Total reduced: ${data.data.summary.totalReduced} items`);
      console.log(`   Successful: ${data.data.summary.successful}/${data.data.summary.totalItems}`);
      
      if (data.data.results.length > 0) {
        console.log('\n📋 Reduction Results:');
        data.data.results.forEach(item => {
          console.log(`   ${item.sku} (${item.productName}):`);
          console.log(`     ${item.previousStock} -> ${item.newStock} (reduced by ${item.reduced})`);
          if (item.belowMinStock) {
            console.log(`     ⚠️  Below minimum stock!`);
          }
        });
      }

      if (data.data.lowStockAlerts.length > 0) {
        console.log('\n⚠️  Low Stock Alerts:');
        data.data.lowStockAlerts.forEach(alert => {
          console.log(`   ${alert.sku}: ${alert.message}`);
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testRestoreInventory() {
  console.log('\n📈 Testing Restore Inventory (Order Cancellation)...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/public/inventory/restore?client=${CLIENT_SLUG}`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: `test_order_${Date.now()}`,
        items: [
          { sku: 'KB-002', quantity: 1 }
        ],
        reason: 'order_cancellation',
        webhookId: `webhook_${Date.now()}`
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Inventory restoration successful!');
      console.log(`   Order ID: ${data.data.orderId}`);
      console.log(`   Reason: ${data.data.reason}`);
      console.log(`   Total restored: ${data.data.summary.totalRestored} items`);
      
      if (data.data.results.length > 0) {
        console.log('\n📋 Restoration Results:');
        data.data.results.forEach(item => {
          console.log(`   ${item.sku} (${item.productName}):`);
          console.log(`     ${item.previousStock} -> ${item.newStock} (restored ${item.restored})`);
          if (item.aboveMinStock) {
            console.log(`     ✅ Above minimum stock`);
          }
        });
      }

      if (data.data.stockRecovered.length > 0) {
        console.log('\n🎉 Stock Recovery:');
        data.data.stockRecovered.forEach(item => {
          console.log(`   ${item.sku}: ${item.message}`);
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testBulkInventoryReduction() {
  console.log('\n📦 Testing Bulk Inventory Reduction...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/public/inventory/reduce/bulk?client=${CLIENT_SLUG}`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orders: [
          {
            orderId: `bulk_order_1_${Date.now()}`,
            items: [
              { sku: 'KB-002', quantity: 1 }
            ],
            webhookId: `webhook_1_${Date.now()}`
          },
          {
            orderId: `bulk_order_2_${Date.now()}`,
            items: [
              { sku: 'NB-004', quantity: 1 }
            ],
            webhookId: `webhook_2_${Date.now()}`
          }
        ],
        reduceMode: 'strict',
        batchId: `batch_${Date.now()}`
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Bulk inventory reduction successful!');
      console.log(`   Batch ID: ${data.data.batchId}`);
      console.log(`   Orders processed: ${data.data.summary.totalOrders}`);
      console.log(`   Successful orders: ${data.data.summary.successfulOrders}`);
      console.log(`   Failed orders: ${data.data.summary.failedOrders}`);
      console.log(`   Total items reduced: ${data.data.summary.totalQuantityReduced}`);
      
      if (data.data.orders.length > 0) {
        console.log('\n📋 Order Results:');
        data.data.orders.forEach(order => {
          console.log(`   Order ${order.orderId}: ${order.success ? '✅' : '❌'}`);
          console.log(`     Items: ${order.summary.successful}/${order.summary.totalItems} successful`);
          console.log(`     Reduced: ${order.summary.totalReduced} items`);
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testErrorHandling() {
  console.log('\n🔍 Testing Error Handling...\n');

  try {
    // Test 1: Missing client parameter
    console.log('1. Testing missing client parameter...');
    const response1 = await fetch(`${BASE_URL}/api/public/inventory/check`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{ sku: 'KB-002', quantity: 1 }]
      })
    });
    
    if (!response1.ok) {
      const error1 = await response1.text();
      console.log('   ✅ Correctly handled missing client:', JSON.parse(error1).error);
    }

    // Test 2: Invalid client
    console.log('\n2. Testing invalid client...');
    const response2 = await fetch(`${BASE_URL}/api/public/inventory/check?client=invalid-client`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{ sku: 'KB-002', quantity: 1 }]
      })
    });
    
    if (!response2.ok) {
      const error2 = await response2.text();
      console.log('   ✅ Correctly handled invalid client:', JSON.parse(error2).error);
    }

    // Test 3: Invalid items structure
    console.log('\n3. Testing invalid items structure...');
    const response3 = await fetch(`${BASE_URL}/api/public/inventory/check?client=${CLIENT_SLUG}`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{ sku: 'KB-002' }] // Missing quantity
      })
    });
    
    if (!response3.ok) {
      const error3 = await response3.text();
      console.log('   ✅ Correctly handled invalid items:', JSON.parse(error3).error);
    }

  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  }
}

async function testWebhookSimulation() {
  console.log('\n🔗 Testing Webhook Simulation...\n');

  try {
    // Simulate a webhook call for order fulfillment
    const webhookData = {
      orderId: `webhook_order_${Date.now()}`,
      items: [
        { sku: 'KB-002', quantity: 2 },
        { sku: 'NB-004', quantity: 1 }
      ],
      reduceMode: 'strict',
      webhookId: `webhook_${Date.now()}`,
      metadata: {
        source: 'ecommerce_platform',
        timestamp: new Date().toISOString(),
        customerId: 'customer_123'
      }
    };

    console.log('📤 Simulating webhook call...');
    console.log(`   Order ID: ${webhookData.orderId}`);
    console.log(`   Items: ${webhookData.items.length}`);
    console.log(`   Webhook ID: ${webhookData.webhookId}`);

    const response = await fetch(`${BASE_URL}/api/public/inventory/reduce?client=${CLIENT_SLUG}`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'ecommerce_platform',
        'X-Webhook-Event': 'order.fulfilled'
      },
      body: JSON.stringify(webhookData)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Webhook simulation successful!');
      console.log(`   Order processed: ${data.data.orderId}`);
      console.log(`   Items reduced: ${data.data.summary.totalReduced}`);
      console.log(`   Success rate: ${data.data.summary.successful}/${data.data.summary.totalItems}`);
    } else {
      const error = await response.text();
      console.log('❌ Webhook simulation failed:', error);
    }

  } catch (error) {
    console.error('❌ Webhook simulation failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Inventory Management API Test Suite\n');
  console.log('='.repeat(50));
  
  console.log('⚠️  Note: Update API_KEY and CLIENT_SLUG variables before running tests\n');
  
  // Uncomment these lines to run tests (after updating variables)
  // await testCheckInventory();
  // await testReduceInventory();
  // await testRestoreInventory();
  // await testBulkInventoryReduction();
  // await testErrorHandling();
  // await testWebhookSimulation();
  
  console.log('📋 To run these tests:');
  console.log('1. Update API_KEY if you have one configured');
  console.log('2. Update CLIENT_SLUG to match your client');
  console.log('3. Ensure you have products with SKUs KB-002, NB-004, UC-003 in your database');
  console.log('4. Uncomment the test function calls');
  console.log('5. Run: node test-inventory-api.js');
  
  console.log('\n📚 See API_DOCUMENTATION_SKU.md for complete API documentation');
  console.log('\n🔗 Webhook Integration:');
  console.log('   These APIs are designed to be called by external systems via webhooks');
  console.log('   when orders are placed, cancelled, or returned.');
}

main().catch(console.error);
