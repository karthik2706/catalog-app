#!/usr/bin/env node

/**
 * Test script for Image Search APIs
 * 
 * This script demonstrates how to use the new image search APIs
 * for external system integration.
 */

const BASE_URL = 'http://localhost:3000';
const fs = require('fs');
const FormData = require('form-data');

// Example API key for public endpoints (if configured)
const API_KEY = 'your-api-key-here';

// Example client slug
const CLIENT_SLUG = 'enterprise';

// Test image path (replace with actual image file)
const TEST_IMAGE_PATH = './test-image.png';

async function testBasicImageSearch() {
  console.log('🔍 Testing Basic Image Search (95%+ similarity)...\n');

  try {
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.log('❌ Test image not found. Please provide a valid image file.');
      console.log('   Update TEST_IMAGE_PATH variable with your image file path.');
      return;
    }

    const form = new FormData();
    form.append('image', fs.createReadStream(TEST_IMAGE_PATH));

    const response = await fetch(`${BASE_URL}/api/public/search/by-image?client=${CLIENT_SLUG}`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        ...form.getHeaders()
      },
      body: form
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Image search successful!');
      console.log(`   Found ${data.data.total} products with 95%+ similarity`);
      console.log(`   Query: ${data.data.query.fileName} (${data.data.query.fileSize} bytes)`);
      console.log(`   Model: ${data.data.query.model} on ${data.data.query.device}`);
      
      if (data.data.results.length > 0) {
        console.log('\n📦 Top Results:');
        data.data.results.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.productName} (${product.sku})`);
          console.log(`      Similarity: ${product.similarity.percent}%`);
          console.log(`      Price: ${product.currencySymbol}${product.price}`);
          console.log(`      Stock: ${product.stockLevel} units`);
          console.log(`      Category: ${product.category}`);
        });
      } else {
        console.log('   No products found with 95%+ similarity');
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testAdvancedImageSearch() {
  console.log('\n🔍 Testing Advanced Image Search (configurable)...\n');

  try {
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.log('❌ Test image not found. Please provide a valid image file.');
      return;
    }

    const form = new FormData();
    form.append('image', fs.createReadStream(TEST_IMAGE_PATH));

    // Test with 90% threshold and limit of 5 results
    const response = await fetch(`${BASE_URL}/api/public/search/by-image/advanced?client=${CLIENT_SLUG}&threshold=90&limit=5`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        ...form.getHeaders()
      },
      body: form
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Advanced image search successful!');
      console.log(`   Found ${data.data.total} products with 90%+ similarity`);
      console.log(`   Applied filters:`, data.data.filters.applied);
      
      if (data.data.results.length > 0) {
        console.log('\n📦 Results:');
        data.data.results.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.productName} (${product.sku})`);
          console.log(`      Similarity: ${product.similarity.percent}%`);
          console.log(`      Price: ${product.currencySymbol}${product.price}`);
          console.log(`      Stock: ${product.stockLevel} units`);
        });
      } else {
        console.log('   No products found with 90%+ similarity');
      }
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testDifferentThresholds() {
  console.log('\n🔍 Testing Different Similarity Thresholds...\n');

  try {
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.log('❌ Test image not found. Please provide a valid image file.');
      return;
    }

    const thresholds = [95, 90, 80, 70, 60];
    
    for (const threshold of thresholds) {
      console.log(`Testing with ${threshold}% threshold...`);
      
      const form = new FormData();
      form.append('image', fs.createReadStream(TEST_IMAGE_PATH));

      const response = await fetch(`${BASE_URL}/api/public/search/by-image/advanced?client=${CLIENT_SLUG}&threshold=${threshold}&limit=10`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          ...form.getHeaders()
        },
        body: form
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Found ${data.data.total} products with ${threshold}%+ similarity`);
        
        if (data.data.results.length > 0) {
          const topResult = data.data.results[0];
          console.log(`   🏆 Best match: ${topResult.productName} (${topResult.similarity.percent}%)`);
        }
      } else {
        const error = await response.text();
        console.log(`   ❌ Error with ${threshold}% threshold:`, error);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
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
    const response1 = await fetch(`${BASE_URL}/api/public/search/by-image`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (!response1.ok) {
      const error1 = await response1.text();
      console.log('   ✅ Correctly handled missing client:', JSON.parse(error1).error);
    }

    // Test 2: Invalid client
    console.log('\n2. Testing invalid client...');
    const response2 = await fetch(`${BASE_URL}/api/public/search/by-image?client=invalid-client`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (!response2.ok) {
      const error2 = await response2.text();
      console.log('   ✅ Correctly handled invalid client:', JSON.parse(error2).error);
    }

    // Test 3: Invalid threshold
    console.log('\n3. Testing invalid threshold...');
    const response3 = await fetch(`${BASE_URL}/api/public/search/by-image/advanced?client=${CLIENT_SLUG}&threshold=150`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (!response3.ok) {
      const error3 = await response3.text();
      console.log('   ✅ Correctly handled invalid threshold:', JSON.parse(error3).error);
    }

  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Image Search API Test Suite\n');
  console.log('='.repeat(50));
  
  console.log('⚠️  Note: Update API_KEY, CLIENT_SLUG, and TEST_IMAGE_PATH variables before running tests\n');
  
  // Check if test image exists
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('❌ Test image not found!');
    console.log(`   Please place an image file at: ${TEST_IMAGE_PATH}`);
    console.log('   Or update the TEST_IMAGE_PATH variable in this script.');
    console.log('\n📋 To run these tests:');
    console.log('1. Place a test image file in the project root');
    console.log('2. Update TEST_IMAGE_PATH variable in this script');
    console.log('3. Update API_KEY if you have one configured');
    console.log('4. Update CLIENT_SLUG to match your client');
    console.log('5. Run: node test-image-search-api.js');
    return;
  }
  
  // Uncomment these lines to run tests (after updating variables)
  // await testBasicImageSearch();
  // await testAdvancedImageSearch();
  // await testDifferentThresholds();
  // await testErrorHandling();
  
  console.log('📋 To run these tests:');
  console.log('1. Update API_KEY if you have one configured');
  console.log('2. Update CLIENT_SLUG to match your client');
  console.log('3. Ensure TEST_IMAGE_PATH points to a valid image file');
  console.log('4. Uncomment the test function calls');
  console.log('5. Run: node test-image-search-api.js');
  
  console.log('\n📚 See API_DOCUMENTATION_SKU.md for complete API documentation');
}

main().catch(console.error);
