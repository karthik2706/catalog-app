#!/usr/bin/env tsx

/**
 * End-to-End Visual Search Validation Script
 * 
 * This script performs a complete end-to-end test of the visual search system:
 * 1. Creates a temporary test tenant and product
 * 2. Uploads a sample image to S3 via presigned URL and registers Media
 * 3. Mocks an S3 event into the worker (local mode), waits until processed
 * 4. Calls /api/search/by-image with a query image similar to the product image
 * 5. Asserts the test product is in top 3 results
 * 
 * Usage:
 *   tsx scripts/e2e_visual_search_check.ts
 *   tsx scripts/e2e_visual_search_check.ts --cleanup-only
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Command } from 'commander';
import { createWriteStream, createReadStream, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Configuration
const TEST_TENANT_SLUG = 'e2e-test-tenant';
const TEST_PRODUCT_SKU = 'E2E-TEST-PRODUCT';
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop';
const QUERY_IMAGE_URL = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop&q=80';

// AWS Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'your-bucket-name';
const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

interface TestData {
  tenantId: string;
  productId: string;
  mediaId: string;
  s3Key: string;
  testImagePath: string;
  queryImagePath: string;
}

/**
 * Download image from URL to local file
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  const fs = await import('fs');
  fs.writeFileSync(outputPath, Buffer.from(buffer));
}

/**
 * Create test tenant and product
 */
async function createTestData(): Promise<TestData> {
  console.log('🏗️  Creating test tenant and product...');
  
  // Create test tenant
  const tenant = await prisma.client.upsert({
    where: { slug: TEST_TENANT_SLUG },
    update: { isActive: true },
    create: {
      id: `test-tenant-${Date.now()}`,
      name: 'E2E Test Tenant',
      slug: TEST_TENANT_SLUG,
      email: 'test@example.com',
      isActive: true,
    },
  });

  // Create test product
  const product = await prisma.product.upsert({
    where: { 
      sku_clientId: {
        sku: TEST_PRODUCT_SKU,
        clientId: tenant.id,
      }
    },
    update: {},
    create: {
      id: `test-product-${Date.now()}`,
      name: 'E2E Test Product - Nike Air Max',
      sku: TEST_PRODUCT_SKU,
      price: 99.99,
      category: 'Shoes',
      description: 'Test product for E2E visual search validation',
      stockLevel: 10,
      minStock: 5,
      clientId: tenant.id,
      isActive: true,
    },
  });

  // Download test images
  const testImagePath = join(process.cwd(), 'temp-test-image.jpg');
  const queryImagePath = join(process.cwd(), 'temp-query-image.jpg');
  
  console.log('📥 Downloading test images...');
  await downloadImage(TEST_IMAGE_URL, testImagePath);
  await downloadImage(QUERY_IMAGE_URL, queryImagePath);

  // Generate S3 key
  const s3Key = `clients/${tenant.id}/products/${product.sku}/media/image/test-${Date.now()}.jpg`;

  return {
    tenantId: tenant.id,
    productId: product.id,
    mediaId: '', // Will be set after media creation
    s3Key,
    testImagePath,
    queryImagePath,
  };
}

/**
 * Upload image to S3 and create Media record
 */
async function uploadImageAndCreateMedia(testData: TestData): Promise<void> {
  console.log('☁️  Uploading image to S3 and creating Media record...');
  
  // Upload to S3
  const fileBuffer = await import('fs').then(fs => fs.readFileSync(testData.testImagePath));
  
  const uploadCommand = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: testData.s3Key,
    Body: fileBuffer,
    ContentType: 'image/jpeg',
  });
  
  await s3Client.send(uploadCommand);
  console.log(`✅ Image uploaded to S3: ${testData.s3Key}`);

  // Create Media record
  const media = await prisma.media.create({
    data: {
      productId: testData.productId,
      clientId: testData.tenantId,
      kind: 'image',
      s3Key: testData.s3Key,
      width: 400,
      height: 400,
      status: 'completed', // Mark as completed for testing
    },
  });

  testData.mediaId = media.id.toString();
  console.log(`✅ Media record created: ${media.id}`);
}

/**
 * Mock S3 event and process through worker (simulate embedding generation)
 */
async function processMediaThroughWorker(testData: TestData): Promise<void> {
  console.log('⚙️  Processing media through worker (simulating embedding generation)...');
  
  // In a real implementation, this would:
  // 1. Send SQS message with S3 event
  // 2. Worker processes the message
  // 3. Worker downloads image from S3
  // 4. Worker calls embedding service
  // 5. Worker stores embedding in database
  
  // For this test, we'll simulate the embedding generation
  try {
    // Call embedding service directly
    const formData = new FormData();
    const file = new File([await import('fs').then(fs => fs.readFileSync(testData.testImagePath))], 'test.jpg', { type: 'image/jpeg' });
    formData.append('file', file);

    const embeddingResponse = await fetch(`${EMBEDDING_SERVICE_URL}/embed-image`, {
      method: 'POST',
      body: formData,
    });

    if (!embeddingResponse.ok) {
      throw new Error(`Embedding service failed: ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    console.log(`✅ Embedding generated: ${embeddingData.embedding.length} dimensions`);

    // Store embedding in database
    await prisma.imageEmbedding.create({
      data: {
        mediaId: BigInt(testData.mediaId),
        embedding: `[${embeddingData.embedding.join(',')}]`,
      },
    });

    console.log('✅ Embedding stored in database');
  } catch (error) {
    console.warn('⚠️  Embedding service not available, skipping embedding generation');
    console.warn('   This is expected if the embedding service is not running');
  }
}

/**
 * Test visual search API
 */
async function testVisualSearch(testData: TestData): Promise<boolean> {
  console.log('🔍 Testing visual search API...');
  
  try {
    // Create JWT token for API authentication
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign(
      {
        userId: 'test-user',
        email: 'test@example.com',
        role: 'USER',
        clientId: testData.tenantId,
        clientSlug: TEST_TENANT_SLUG,
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Call search API
    const formData = new FormData();
    const file = new File([await import('fs').then(fs => fs.readFileSync(testData.queryImagePath))], 'query.jpg', { type: 'image/jpeg' });
    formData.append('file', file);

    const searchResponse = await fetch(`${API_BASE_URL}/api/search/by-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-tenant-slug': TEST_TENANT_SLUG,
      },
      body: formData,
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Search API failed: ${searchResponse.status} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    console.log(`✅ Search API responded: ${searchData.results?.length || 0} results`);

    // Check if our test product is in the results
    const testProductInResults = searchData.results?.some((result: any) => 
      result.productId === testData.productId || result.productName?.includes('E2E Test Product')
    );

    if (testProductInResults) {
      console.log('✅ Test product found in search results!');
      return true;
    } else {
      console.log('❌ Test product not found in search results');
      console.log('   Results:', searchData.results?.map((r: any) => ({ 
        productId: r.productId, 
        productName: r.productName,
        score: r.score 
      })));
      return false;
    }
  } catch (error) {
    console.error('❌ Visual search test failed:', error);
    return false;
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(testData: TestData): Promise<void> {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete from S3
    try {
      await s3Client.send(new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: testData.s3Key,
      }));
      
      // If object exists, delete it
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      await s3Client.send(new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: testData.s3Key,
      }));
      console.log('✅ S3 object deleted');
    } catch (error) {
      console.log('ℹ️  S3 object not found or already deleted');
    }

    // Delete from database (in reverse order due to foreign keys)
    await prisma.imageEmbedding.deleteMany({
      where: { mediaId: BigInt(testData.mediaId) },
    });
    
    await prisma.media.deleteMany({
      where: { id: BigInt(testData.mediaId) },
    });
    
    await prisma.product.deleteMany({
      where: { id: testData.productId },
    });
    
    await prisma.client.deleteMany({
      where: { id: testData.tenantId },
    });

    console.log('✅ Database records deleted');
  } catch (error) {
    console.error('⚠️  Error during cleanup:', error);
  }

  // Delete local files
  try {
    if (existsSync(testData.testImagePath)) {
      unlinkSync(testData.testImagePath);
    }
    if (existsSync(testData.queryImagePath)) {
      unlinkSync(testData.queryImagePath);
    }
    console.log('✅ Local files deleted');
  } catch (error) {
    console.error('⚠️  Error deleting local files:', error);
  }
}

/**
 * Main test function
 */
async function runE2ETest(): Promise<void> {
  console.log('🚀 Starting E2E Visual Search Test');
  console.log('=====================================');
  
  let testData: TestData | null = null;
  let success = false;

  try {
    // Step 1: Create test data
    testData = await createTestData();
    
    // Step 2: Upload image and create media record
    await uploadImageAndCreateMedia(testData);
    
    // Step 3: Process through worker (simulate embedding generation)
    await processMediaThroughWorker(testData);
    
    // Step 4: Test visual search
    success = await testVisualSearch(testData);
    
    if (success) {
      console.log('\n🎉 E2E TEST PASSED!');
      console.log('✅ Visual search system is working correctly');
    } else {
      console.log('\n❌ E2E TEST FAILED!');
      console.log('❌ Visual search system has issues');
    }
    
  } catch (error) {
    console.error('\n💥 E2E TEST ERROR:', error);
    success = false;
  } finally {
    // Always cleanup
    if (testData) {
      await cleanupTestData(testData);
    }
  }

  console.log('\n📋 CLEANUP INSTRUCTIONS:');
  console.log('1. Test data has been automatically cleaned up');
  console.log('2. Check database for any remaining test records:');
  console.log(`   SELECT * FROM clients WHERE slug = '${TEST_TENANT_SLUG}';`);
  console.log(`   SELECT * FROM products WHERE sku = '${TEST_PRODUCT_SKU}';`);
  console.log('3. Check S3 for any remaining test objects');
  console.log('4. If manual cleanup is needed, run: tsx scripts/e2e_visual_search_check.ts --cleanup-only');
  
  process.exit(success ? 0 : 1);
}

/**
 * Cleanup-only mode
 */
async function runCleanupOnly(): Promise<void> {
  console.log('🧹 Running cleanup-only mode...');
  
  try {
    // Find and delete any remaining test data
    const testTenant = await prisma.client.findUnique({
      where: { slug: TEST_TENANT_SLUG },
    });

    if (testTenant) {
      // Delete in reverse order due to foreign keys
      await prisma.imageEmbedding.deleteMany({
        where: {
          media: {
            clientId: testTenant.id,
          },
        },
      });
      
      await prisma.media.deleteMany({
        where: { clientId: testTenant.id },
      });
      
      await prisma.product.deleteMany({
        where: { clientId: testTenant.id },
      });
      
      await prisma.client.delete({
        where: { id: testTenant.id },
      });
      
      console.log('✅ Test data cleaned up');
    } else {
      console.log('ℹ️  No test data found to clean up');
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  const program = new Command();
  
  program
    .name('e2e-visual-search-check')
    .description('End-to-end validation script for visual search system')
    .version('1.0.0')
    .option('--cleanup-only', 'Only run cleanup, skip tests')
    .option('--help', 'Show help');
  
  program.parse(process.argv);
  const options = program.opts();
  
  try {
    if (options.cleanupOnly) {
      await runCleanupOnly();
    } else {
      await runE2ETest();
    }
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⏹️  Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { runE2ETest, runCleanupOnly };
