const sharp = require('sharp');

async function testSecurityValidation() {
  try {
    console.log('Testing security validation...');
    
    // Test with the 1x1 PNG
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // bit depth, color type, etc.
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // image data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ]);
    
    console.log('Image buffer size:', testImageBuffer.length);
    
    // Test Sharp metadata
    try {
      const metadata = await sharp(testImageBuffer).metadata();
      console.log('Sharp metadata:', metadata);
      
      // Check if width and height are valid
      if (!metadata.width || !metadata.height) {
        console.log('❌ Invalid image: missing width or height');
        return;
      }
      
      console.log('✅ Image has valid dimensions:', metadata.width, 'x', metadata.height);
      
      // Check dimensions
      if (metadata.width > 10000 || metadata.height > 10000) {
        console.log('❌ Image dimensions too large');
        return;
      }
      
      console.log('✅ Image dimensions are within limits');
      
      // Test image processing
      try {
        const processed = await sharp(testImageBuffer)
          .resize(100, 100, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        
        console.log('✅ Image processing works, processed size:', processed.length);
        
      } catch (error) {
        console.error('❌ Image processing failed:', error.message);
      }
      
    } catch (error) {
      console.error('❌ Sharp metadata failed:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSecurityValidation();
