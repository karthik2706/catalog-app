const fs = require('fs');

async function testSearchRealImage() {
  try {
    console.log('Step 1: Logging in...');
    
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
    console.log('Login successful');
    
    if (!loginData.token) {
      console.log('No token received from login');
      return;
    }

    console.log('Step 2: Testing search by image with real image...');
    
    // Use the existing test image file
    if (!fs.existsSync('test-image.png')) {
      console.log('test-image.png not found, creating a simple one...');
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
      fs.writeFileSync('test-image.png', testImageBuffer);
    }

    const imageBuffer = fs.readFileSync('test-image.png');
    console.log('Using test image, size:', imageBuffer.length);

    // Create form data using native FormData (Node.js 18+)
    const formData = new FormData();
    const file = new File([imageBuffer], 'test-image.png', { type: 'image/png' });
    formData.append('file', file);

    console.log('Sending request to search endpoint...');
    
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
    console.log('Search response status text:', searchResponse.statusText);
    console.log('Search response headers:', Object.fromEntries(searchResponse.headers.entries()));

    const searchResponseText = await searchResponse.text();
    console.log('Search response body length:', searchResponseText.length);
    
    if (searchResponseText.length > 0) {
      try {
        const searchData = JSON.parse(searchResponseText);
        console.log('Search response (JSON):', JSON.stringify(searchData, null, 2));
      } catch (e) {
        console.log('Search response (text):', searchResponseText);
      }
    } else {
      console.log('Empty response body - this indicates a server error');
    }

    if (searchResponse.ok) {
      console.log('✅ Search by image test passed!');
    } else {
      console.log('❌ Search by image test failed');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
    console.error('Error stack:', error.stack);
  }
}

testSearchRealImage();
