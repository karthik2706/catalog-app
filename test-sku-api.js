#!/usr/bin/env node

/**
 * Test script for SKU-based Product APIs
 * 
 * This script demonstrates how to use the new SKU-based APIs
 * for external system integration.
 */

const BASE_URL = 'http://localhost:3000';

// Example JWT token (replace with actual token from login)
const JWT_TOKEN = 'your-jwt-token-here';

// Example API key for public endpoints (if configured)
const API_KEY = 'your-api-key-here';

// Example client slug
const CLIENT_SLUG = 'enterprise';

async function testAuthenticatedAPIs() {
  console.log('🔐 Testing Authenticated APIs...\n');

  try {
    // Test 1: Get single product by SKU
    console.log('1. Getting product by SKU: KB-002');
    const response1 = await fetch(`${BASE_URL}/api/products/sku/KB-002`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    });
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Product found:', {
        sku: data1.data.sku,
        name: data1.data.name,
        price: data1.data.price,
        stockLevel: data1.data.stockLevel,
        currency: data1.data.currency
      });
    } else {
      console.log('❌ Error:', await response1.text());
    }

    // Test 2: Update product stock
    console.log('\n2. Updating product stock...');
    const response2 = await fetch(`${BASE_URL}/api/products/sku/KB-002`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stockLevel: 30,
        price: 99.99
      })
    });

    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Product updated:', {
        sku: data2.data.sku,
        newPrice: data2.data.price,
        newStock: data2.data.stockLevel
      });
    } else {
      console.log('❌ Error:', await response2.text());
    }

    // Test 3: Bulk get products
    console.log('\n3. Bulk getting products...');
    const response3 = await fetch(`${BASE_URL}/api/products/sku/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        skus: ['KB-002', 'NB-004', 'UC-003']
      })
    });

    if (response3.ok) {
      const data3 = await response3.json();
      console.log('✅ Bulk products found:', {
        found: data3.found,
        requested: data3.requested,
        notFound: data3.notFound,
        products: data3.data.map(p => ({
          sku: p.sku,
          name: p.name,
          price: p.price,
          stock: p.stockLevel
        }))
      });
    } else {
      console.log('❌ Error:', await response3.text());
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testPublicAPIs() {
  console.log('\n🌐 Testing Public APIs...\n');

  try {
    // Test 1: Get single product by SKU (public)
    console.log('1. Getting product by SKU (public): KB-002');
    const response1 = await fetch(`${BASE_URL}/api/public/products/sku/KB-002?client=${CLIENT_SLUG}`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Product found (public):', {
        sku: data1.data.sku,
        name: data1.data.name,
        price: data1.data.price,
        stockLevel: data1.data.stockLevel,
        currency: data1.data.currency
      });
    } else {
      console.log('❌ Error:', await response1.text());
    }

    // Test 2: Bulk get products (public)
    console.log('\n2. Bulk getting products (public)...');
    const response2 = await fetch(`${BASE_URL}/api/public/products/sku/bulk`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        skus: ['KB-002', 'NB-004'],
        client: CLIENT_SLUG
      })
    });

    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Bulk products found (public):', {
        found: data2.found,
        requested: data2.requested,
        notFound: data2.notFound,
        products: data2.data.map(p => ({
          sku: p.sku,
          name: p.name,
          price: p.price,
          stock: p.stockLevel
        }))
      });
    } else {
      console.log('❌ Error:', await response2.text());
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testBulkUpdate() {
  console.log('\n📝 Testing Bulk Update...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/products/sku/bulk`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        updates: [
          {
            sku: 'KB-002',
            stockLevel: 25,
            price: 89.99
          },
          {
            sku: 'NB-004',
            stockLevel: 75,
            price: 12.99
          }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Bulk update completed:', {
        total: data.data.summary.total,
        successful: data.data.summary.successful,
        failed: data.data.summary.failed,
        updated: data.data.updated.map(u => ({
          sku: u.sku,
          newStock: u.data.stockLevel,
          newPrice: u.data.price
        }))
      });
    } else {
      console.log('❌ Error:', await response.text());
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 SKU API Test Suite\n');
  console.log('='.repeat(50));
  
  // Note: These tests require valid authentication
  console.log('⚠️  Note: Update JWT_TOKEN and API_KEY variables before running tests\n');
  
  // Uncomment these lines to run tests (after updating tokens)
  // await testAuthenticatedAPIs();
  // await testPublicAPIs();
  // await testBulkUpdate();
  
  console.log('📋 To run these tests:');
  console.log('1. Get a JWT token by logging in to the application');
  console.log('2. Update JWT_TOKEN variable in this script');
  console.log('3. Update API_KEY if you have one configured');
  console.log('4. Uncomment the test function calls');
  console.log('5. Run: node test-sku-api.js');
  
  console.log('\n📚 See API_DOCUMENTATION_SKU.md for complete API documentation');
}

main().catch(console.error);
