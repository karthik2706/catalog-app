const fs = require('fs');

// Create a proper 100x100 PNG image
function createTestImage() {
  // This is a minimal but valid 100x100 PNG image
  const width = 100;
  const height = 100;
  
  // PNG signature
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);   // width
  ihdrData.writeUInt32BE(height, 4);  // height
  ihdrData[8] = 8;   // bit depth
  ihdrData[9] = 2;   // color type (RGB)
  ihdrData[10] = 0;  // compression
  ihdrData[11] = 0;  // filter
  ihdrData[12] = 0;  // interlace
  
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 13]), // length
    Buffer.from('IHDR'),
    ihdrData,
    Buffer.from([
      (ihdrCrc >> 24) & 0xFF,
      (ihdrCrc >> 16) & 0xFF,
      (ihdrCrc >> 8) & 0xFF,
      ihdrCrc & 0xFF
    ])
  ]);
  
  // IDAT chunk with minimal image data
  const rowBytes = width * 3 + 1; // 3 bytes per pixel + 1 filter byte
  const imageData = Buffer.alloc(height * rowBytes);
  
  // Fill with a simple pattern
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    imageData[rowStart] = 0; // filter type (none)
    
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      const intensity = Math.floor((x + y) * 255 / (width + height));
      imageData[pixelStart] = intensity;     // R
      imageData[pixelStart + 1] = intensity; // G
      imageData[pixelStart + 2] = intensity; // B
    }
  }
  
  // Compress the image data (simple compression)
  const compressedData = Buffer.from(imageData);
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressedData]));
  const idatChunk = Buffer.concat([
    Buffer.from([
      (compressedData.length >> 24) & 0xFF,
      (compressedData.length >> 16) & 0xFF,
      (compressedData.length >> 8) & 0xFF,
      compressedData.length & 0xFF
    ]),
    Buffer.from('IDAT'),
    compressedData,
    Buffer.from([
      (idatCrc >> 24) & 0xFF,
      (idatCrc >> 16) & 0xFF,
      (idatCrc >> 8) & 0xFF,
      idatCrc & 0xFF
    ])
  ]);
  
  // IEND chunk
  const iendCrc = crc32(Buffer.from('IEND'));
  const iendChunk = Buffer.concat([
    Buffer.from([0, 0, 0, 0]), // length
    Buffer.from('IEND'),
    Buffer.from([
      (iendCrc >> 24) & 0xFF,
      (iendCrc >> 16) & 0xFF,
      (iendCrc >> 8) & 0xFF,
      iendCrc & 0xFF
    ])
  ]);
  
  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

// Simple CRC32 implementation
function crc32(data) {
  const crcTable = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c;
  }
  
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create and save the test image
const imageBuffer = createTestImage();
fs.writeFileSync('test-image-100x100.png', imageBuffer);
console.log('Created test image: test-image-100x100.png');
console.log('Image size:', imageBuffer.length, 'bytes');
