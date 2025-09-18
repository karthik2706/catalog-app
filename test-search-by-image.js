const fs = require('fs');
const FormData = require('form-data');

async function testSearchByImage() {
  try {
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

    // Test JWT token (you'll need to get a real one from login)
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZwZDN1MDMwMDA1eTdzcXd0emcwc3V4IiwiZW1haWwiOiJtYW5hZ2VyQHRlc3Rjb21wYW55LmNvbSIsInJvbGUiOiJNQU5BR0VSIiwiY2xpZW50SWQiOiJ0ZXN0LWNsaWVudC0xIiwiY2xpZW50U2x1ZyI6InRlc3QtY29tcGFueSIsImlhdCI6MTczNzQ2NzQwMCwiZXhwIjoxNzM3NTUzODAwfQ.test';

    console.log('Testing search by image...');
    
    const response = await fetch('http://localhost:3000/api/search/by-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'x-tenant-slug': 'test-company',
      },
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      console.log('✅ Search by image test passed!');
    } else {
      console.log('❌ Search by image test failed');
    }

    // Clean up
    fs.unlinkSync('test-image.png');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSearchByImage();
