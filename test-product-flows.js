#!/usr/bin/env node

// Test script to verify product creation, editing, and saving flows
const testProductFlows = async () => {
  console.log('🧪 Testing Product Flows...\n')

  // Test 1: Check if new product page loads
  console.log('1. Testing new product page...')
  try {
    const response = await fetch('http://localhost:3000/products/new')
    if (response.ok) {
      console.log('✅ New product page loads successfully')
    } else {
      console.log('❌ New product page failed:', response.status)
    }
  } catch (error) {
    console.log('❌ New product page error:', error.message)
  }

  // Test 2: Check if edit product page loads
  console.log('\n2. Testing edit product page...')
  try {
    const response = await fetch('http://localhost:3000/products/cmfvxu76x0001y7wdx27ki5dd/edit')
    if (response.ok) {
      console.log('✅ Edit product page loads successfully')
    } else {
      console.log('❌ Edit product page failed:', response.status)
    }
  } catch (error) {
    console.log('❌ Edit product page error:', error.message)
  }

  // Test 3: Check if product API endpoints are accessible
  console.log('\n3. Testing product API endpoints...')
  
  // Test GET products (should require auth)
  try {
    const response = await fetch('http://localhost:3000/api/products')
    if (response.status === 401) {
      console.log('✅ GET /api/products requires authentication (expected)')
    } else {
      console.log('⚠️  GET /api/products returned:', response.status)
    }
  } catch (error) {
    console.log('❌ GET /api/products error:', error.message)
  }

  // Test POST products (should require auth)
  try {
    const response = await fetch('http://localhost:3000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', sku: 'TEST-001', price: '10.00' })
    })
    if (response.status === 401) {
      console.log('✅ POST /api/products requires authentication (expected)')
    } else {
      console.log('⚠️  POST /api/products returned:', response.status)
    }
  } catch (error) {
    console.log('❌ POST /api/products error:', error.message)
  }

  // Test PUT product (should require auth)
  try {
    const response = await fetch('http://localhost:3000/api/products/cmfvxu76x0001y7wdx27ki5dd', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Test' })
    })
    if (response.status === 401) {
      console.log('✅ PUT /api/products/[id] requires authentication (expected)')
    } else {
      console.log('⚠️  PUT /api/products/[id] returned:', response.status)
    }
  } catch (error) {
    console.log('❌ PUT /api/products/[id] error:', error.message)
  }

  // Test 4: Check if individual product page loads
  console.log('\n4. Testing individual product page...')
  try {
    const response = await fetch('http://localhost:3000/products/cmfvxu76x0001y7wdx27ki5dd')
    if (response.ok) {
      console.log('✅ Individual product page loads successfully')
    } else {
      console.log('❌ Individual product page failed:', response.status)
    }
  } catch (error) {
    console.log('❌ Individual product page error:', error.message)
  }

  console.log('\n🎉 Product flow tests completed!')
}

// Run the tests
testProductFlows().catch(console.error)
