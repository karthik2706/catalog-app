const fs = require('fs');

async function testSearchFinal() {
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

    console.log('Step 2: Testing search by image with proper test image...');
    
    // Use the proper test image
    if (!fs.existsSync('test-image-100x100.png')) {
      console.log('test-image-100x100.png not found, please run create-test-image.js first');
      return;
    }

    const imageBuffer = fs.readFileSync('test-image-100x100.png');
    console.log('Using test image, size:', imageBuffer.length);

    // Create form data using native FormData (Node.js 18+)
    const formData = new FormData();
    const file = new File([imageBuffer], 'test-image-100x100.png', { type: 'image/png' });
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
        
        if (searchData.results && Array.isArray(searchData.results)) {
          console.log(`Found ${searchData.results.length} similar products`);
          searchData.results.forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.productName} (score: ${result.score})`);
          });
        }
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

testSearchFinal();
