const sharp = require('sharp');

async function testImageValidation() {
  try {
    console.log('Testing image validation...');
    
    // Test with the 100x100 PNG
    const imageBuffer = require('fs').readFileSync('test-image-100x100.png');
    console.log('Image buffer size:', imageBuffer.length);
    
    // Test Sharp processing
    try {
      const metadata = await sharp(imageBuffer).metadata();
      console.log('Sharp metadata:', metadata);
      
      // Test resizing
      const resized = await sharp(imageBuffer)
        .resize(100, 100, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      console.log('Resized image size:', resized.length);
      console.log('✅ Image processing with Sharp works');
      
    } catch (error) {
      console.error('❌ Sharp processing failed:', error.message);
    }
    
    // Test with a simple 1x1 PNG
    const simplePng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // bit depth, color type, etc.
      0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // image data
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
    ]);
    
    try {
      const metadata = await sharp(simplePng).metadata();
      console.log('Simple PNG metadata:', metadata);
      console.log('✅ Simple PNG processing works');
    } catch (error) {
      console.error('❌ Simple PNG processing failed:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImageValidation();
