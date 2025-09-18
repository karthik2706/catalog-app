const fs = require('fs');
const FormData = require('form-data');

async function testLoginAndSearch() {
  try {
    console.log('Step 1: Logging in to get a valid JWT token...');
    
    // Login to get a valid token
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'manager@testcompany.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('Login failed:', loginResponse.status, errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login successful, got token:', loginData.token ? 'Yes' : 'No');
    
    if (!loginData.token) {
      console.log('No token received from login');
      return;
    }

    console.log('Step 2: Testing search by image with valid token...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // bit depth, color type, etc.
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // image data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ]);

    // Write test image to file
    fs.writeFileSync('test-image.png', testImageBuffer);

    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-image.png'), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    // Test search by image with valid token
    const searchResponse = await fetch('http://localhost:3000/api/search/by-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'x-tenant-slug': 'test-company',
      },
      body: formData
    });

    console.log('Search response status:', searchResponse.status);
    console.log('Search response headers:', Object.fromEntries(searchResponse.headers.entries()));

    const searchResponseText = await searchResponse.text();
    console.log('Search response body:', searchResponseText);

    if (searchResponse.ok) {
      console.log('✅ Search by image test passed!');
      try {
        const searchData = JSON.parse(searchResponseText);
        console.log('Search results:', searchData);
      } catch (e) {
        console.log('Could not parse search results as JSON');
      }
    } else {
      console.log('❌ Search by image test failed');
    }

    // Clean up
    fs.unlinkSync('test-image.png');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLoginAndSearch();
