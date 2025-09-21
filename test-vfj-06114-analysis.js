#!/usr/bin/env node

/**
 * Comprehensive Analysis Script for SKU VFJ-06114 Video Thumbnail Issue
 * 
 * This script performs end-to-end analysis of the video thumbnail generation
 * system for the specific SKU VFJ-06114 that was reported to have thumbnail issues.
 */

const { PrismaClient } = require('@prisma/client')
const https = require('https')
const fs = require('fs')

const prisma = new PrismaClient()

async function analyzeVFJ06114() {
  console.log('🔍 Starting comprehensive analysis for SKU VFJ-06114...\n')
  
  try {
    // 1. Database Analysis
    console.log('📊 DATABASE ANALYSIS')
    console.log('=' .repeat(50))
    
    const product = await prisma.product.findFirst({
      where: { sku: 'VFJ-06114' },
      include: {
        media: true,
        client: {
          select: { name: true, slug: true }
        }
      }
    })
    
    if (!product) {
      console.log('❌ Product VFJ-06114 not found in database')
      return
    }
    
    console.log(`✅ Product found: ${product.name}`)
    console.log(`   Client: ${product.client?.name} (${product.client?.slug})`)
    console.log(`   Created: ${product.createdAt}`)
    console.log(`   Updated: ${product.updatedAt}`)
    console.log(`   Thumbnail URL: ${product.thumbnailUrl || 'None'}`)
    
    // Parse videos JSON
    let videos = []
    try {
      videos = product.videos ? JSON.parse(JSON.stringify(product.videos)) : []
    } catch (e) {
      console.log(`   ⚠️  Error parsing videos JSON: ${e.message}`)
    }
    
    console.log(`   Videos count: ${videos.length}`)
    console.log(`   Media records count: ${product.media?.length || 0}`)
    
    // 2. Media Records Analysis
    console.log('\n📁 MEDIA RECORDS ANALYSIS')
    console.log('=' .repeat(50))
    
    if (product.media && product.media.length > 0) {
      product.media.forEach((media, index) => {
        console.log(`Media ${index + 1}:`)
        console.log(`   ID: ${media.id}`)
        console.log(`   Kind: ${media.kind}`)
        console.log(`   S3 Key: ${media.s3Key}`)
        console.log(`   Status: ${media.status}`)
        console.log(`   Dimensions: ${media.width}x${media.height}`)
        console.log(`   Duration: ${media.durationMs}ms`)
        console.log(`   Error: ${media.error || 'None'}`)
        console.log(`   Created: ${media.createdAt}`)
        console.log('')
      })
    } else {
      console.log('   No media records found')
    }
    
    // 3. Videos JSON Analysis
    console.log('\n🎥 VIDEOS JSON ANALYSIS')
    console.log('=' .repeat(50))
    
    if (videos.length > 0) {
      videos.forEach((video, index) => {
        console.log(`Video ${index + 1}:`)
        console.log(`   ID: ${video.id}`)
        console.log(`   File Name: ${video.fileName}`)
        console.log(`   File Type: ${video.fileType}`)
        console.log(`   File Size: ${video.fileSize} bytes`)
        console.log(`   Video URL: ${video.url}`)
        console.log(`   Thumbnail URL: ${video.thumbnailUrl || 'None'}`)
        console.log(`   Uploaded At: ${video.uploadedAt}`)
        console.log('')
      })
    } else {
      console.log('   No videos found in JSON')
    }
    
    // 4. URL Accessibility Test
    console.log('\n🌐 URL ACCESSIBILITY TEST')
    console.log('=' .repeat(50))
    
    // Test video URL
    if (videos.length > 0 && videos[0].url) {
      console.log('Testing video URL accessibility...')
      try {
        const videoResponse = await testUrl(videos[0].url)
        console.log(`✅ Video URL accessible: ${videoResponse.statusCode} ${videoResponse.statusMessage}`)
        console.log(`   Content-Type: ${videoResponse.headers['content-type']}`)
        console.log(`   Content-Length: ${videoResponse.headers['content-length']} bytes`)
      } catch (error) {
        console.log(`❌ Video URL not accessible: ${error.message}`)
      }
    }
    
    // Test thumbnail URL
    if (videos.length > 0 && videos[0].thumbnailUrl) {
      console.log('\nTesting thumbnail URL accessibility...')
      try {
        const thumbnailResponse = await testUrl(videos[0].thumbnailUrl)
        console.log(`✅ Thumbnail URL accessible: ${thumbnailResponse.statusCode} ${thumbnailResponse.statusMessage}`)
        console.log(`   Content-Type: ${thumbnailResponse.headers['content-type']}`)
        console.log(`   Content-Length: ${thumbnailResponse.headers['content-length']} bytes`)
        
        // Download and analyze thumbnail
        console.log('\n🔬 THUMBNAIL CONTENT ANALYSIS')
        console.log('=' .repeat(50))
        
        const thumbnailData = await downloadFile(videos[0].thumbnailUrl)
        console.log(`   Downloaded ${thumbnailData.length} bytes`)
        
        // Check if it's the placeholder PNG
        const placeholderPng = Buffer.from([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
          0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
          0x49, 0x48, 0x44, 0x52, // IHDR
          0x00, 0x00, 0x00, 0x01, // Width: 1
          0x00, 0x00, 0x00, 0x01, // Height: 1
          0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 2 (RGB), Compression: 0, Filter: 0, Interlace: 0
          0x90, 0x77, 0x53, 0xDE, // CRC
          0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
          0x49, 0x44, 0x41, 0x54, // IDAT
          0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Compressed image data
          0x00, 0x00, 0x00, 0x00, // IEND chunk length
          0x49, 0x45, 0x4E, 0x44, // IEND
          0xAE, 0x42, 0x60, 0x82  // CRC
        ])
        
        const isPlaceholder = thumbnailData.equals(placeholderPng)
        console.log(`   Is placeholder PNG: ${isPlaceholder ? '✅ YES' : '❌ NO'}`)
        
        if (isPlaceholder) {
          console.log('   🔍 This confirms the thumbnail is the 1x1 pixel placeholder')
          console.log('   📝 The extractVideoThumbnail function is generating placeholder thumbnails')
          console.log('   💡 Real video frame extraction is not implemented')
        } else {
          console.log('   🎯 This appears to be a real thumbnail image')
          // Show first 32 bytes as hex
          console.log(`   First 32 bytes: ${thumbnailData.slice(0, 32).toString('hex')}`)
        }
        
      } catch (error) {
        console.log(`❌ Thumbnail URL not accessible: ${error.message}`)
      }
    }
    
    // 5. System Analysis
    console.log('\n⚙️  SYSTEM ANALYSIS')
    console.log('=' .repeat(50))
    
    console.log('Current thumbnail generation system:')
    console.log('   📁 Location: src/lib/s3-upload.ts')
    console.log('   🔧 Function: extractVideoThumbnail()')
    console.log('   📊 Status: Generates 1x1 pixel placeholder PNG')
    console.log('   💭 Implementation: Hardcoded placeholder, no real frame extraction')
    console.log('   🎯 Expected: Real video frame extraction using ffmpeg or similar')
    
    console.log('\nVideo upload flow:')
    console.log('   1. Video uploaded via /api/upload-media')
    console.log('   2. processVideoFile() - no processing, maintains original quality')
    console.log('   3. uploadVideoWithThumbnail() called')
    console.log('   4. extractVideoThumbnail() generates 1x1 placeholder')
    console.log('   5. Both video and placeholder thumbnail uploaded to S3')
    console.log('   6. Media records created in database')
    console.log('   7. Product.videos JSON updated with URLs')
    
    // 6. Recommendations
    console.log('\n💡 RECOMMENDATIONS')
    console.log('=' .repeat(50))
    
    console.log('To fix the thumbnail issue:')
    console.log('')
    console.log('1. 🔧 IMMEDIATE FIX (Placeholder improvement):')
    console.log('   - Generate a more visible placeholder (e.g., 200x200 with video icon)')
    console.log('   - Add text overlay indicating "Video Thumbnail"')
    console.log('   - Use a standard video preview image')
    console.log('')
    console.log('2. 🎯 PROPER SOLUTION (Real thumbnail extraction):')
    console.log('   - Install ffmpeg in the deployment environment')
    console.log('   - Implement real video frame extraction in extractVideoThumbnail()')
    console.log('   - Extract frame at 1-2 seconds into the video')
    console.log('   - Generate JPEG thumbnail (e.g., 400x300 or maintain aspect ratio)')
    console.log('')
    console.log('3. 🚀 ADVANCED FEATURES:')
    console.log('   - Multiple thumbnail options (beginning, middle, end)')
    console.log('   - Animated GIF previews')
    console.log('   - Video metadata extraction (duration, resolution)')
    console.log('   - Thumbnail regeneration on demand')
    console.log('')
    console.log('4. 🔄 MIGRATION STRATEGY:')
    console.log('   - Identify all existing videos with placeholder thumbnails')
    console.log('   - Implement batch thumbnail regeneration script')
    console.log('   - Update existing products with new thumbnails')
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

function testUrl(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      resolve({
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        headers: response.headers
      })
      response.destroy() // Don't download the full content
    })
    
    request.on('error', reject)
    request.setTimeout(10000, () => {
      request.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const chunks = []
    
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`))
        return
      }
      
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks)))
      response.on('error', reject)
    })
    
    request.on('error', reject)
    request.setTimeout(15000, () => {
      request.destroy()
      reject(new Error('Download timeout'))
    })
  })
}

// Run the analysis
if (require.main === module) {
  analyzeVFJ06114()
    .then(() => {
      console.log('\n✅ Analysis completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Analysis failed:', error.message)
      process.exit(1)
    })
}

module.exports = { analyzeVFJ06114 }
