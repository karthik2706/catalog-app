import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { searchSimilarImages } from '../src/lib/search';
import { config } from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();
const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface TestImage {
  name: string;
  sku: string;
  s3Key: string;
  embedding: number[];
}

const testImages: TestImage[] = [];

async function createTestImage(name: string, sku: string, content: Buffer): Promise<TestImage> {
  const s3Key = `test/similarity/${sku}.png`;
  const bucketName = process.env.S3_BUCKET_NAME!;
  
  // Upload to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: content,
    ContentType: 'image/png'
  }));

  // Generate embedding
  const formData = new FormData();
  const blob = new Blob([content], { type: 'image/png' });
  formData.append('file', blob, 'image.png');

  const response = await fetch(`${EMBEDDING_SERVICE_URL}/embed-image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${response.status}`);
  }

  const embeddingData = await response.json();
  
  return {
    name,
    sku,
    s3Key,
    embedding: embeddingData.embedding
  };
}

async function setupTestData() {
  console.log('Setting up test data...');
  
  // Create test client
  const testClient = await prisma.client.upsert({
    where: { id: 'test-similarity-client' },
    update: {},
    create: {
      id: 'test-similarity-client',
      name: 'Test Similarity Client',
      email: 'test@similarity.com',
      slug: 'test-similarity'
    }
  });

  // Create test images with different content
  const imageA = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'); // 1x1 red pixel
  const imageB = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'); // 1x1 blue pixel
  const imageC = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'); // 1x1 red pixel (same as A)

  const testImageA = await createTestImage('Test Image A', 'TEST-A', imageA);
  const testImageB = await createTestImage('Test Image B', 'TEST-B', imageB);
  const testImageC = await createTestImage('Test Image C', 'TEST-C', imageC);

  testImages.push(testImageA, testImageB, testImageC);

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'TEST-A' },
      update: {},
      create: {
        sku: 'TEST-A',
        name: 'Test Image A (Red)',
        clientId: testClient.id,
        isActive: true
      }
    }),
    prisma.product.upsert({
      where: { sku: 'TEST-B' },
      update: {},
      create: {
        sku: 'TEST-B',
        name: 'Test Image B (Blue)',
        clientId: testClient.id,
        isActive: true
      }
    }),
    prisma.product.upsert({
      where: { sku: 'TEST-C' },
      update: {},
      create: {
        sku: 'TEST-C',
        name: 'Test Image C (Red - Identical to A)',
        clientId: testClient.id,
        isActive: true
      }
    })
  ]);

  // Create media records
  const media = await Promise.all([
    prisma.media.upsert({
      where: { 
        productId_kind: {
          productId: products[0].id,
          kind: 'image'
        }
      },
      update: {},
      create: {
        productId: products[0].id,
        clientId: testClient.id,
        kind: 'image',
        s3Key: testImageA.s3Key,
        status: 'completed'
      }
    }),
    prisma.media.upsert({
      where: { 
        productId_kind: {
          productId: products[1].id,
          kind: 'image'
        }
      },
      update: {},
      create: {
        productId: products[1].id,
        clientId: testClient.id,
        kind: 'image',
        s3Key: testImageB.s3Key,
        status: 'completed'
      }
    }),
    prisma.media.upsert({
      where: { 
        productId_kind: {
          productId: products[2].id,
          kind: 'image'
        }
      },
      update: {},
      create: {
        productId: products[2].id,
        clientId: testClient.id,
        kind: 'image',
        s3Key: testImageC.s3Key,
        status: 'completed'
      }
    })
  ]);

  // Insert embeddings
  await Promise.all([
    prisma.$executeRaw`
      INSERT INTO image_embeddings ("mediaId", embedding)
      VALUES (${media[0].id}, ${`[${testImageA.embedding.join(',')}]`}::vector)
      ON CONFLICT ("mediaId") DO UPDATE SET embedding = ${`[${testImageA.embedding.join(',')}]`}::vector;
    `,
    prisma.$executeRaw`
      INSERT INTO image_embeddings ("mediaId", embedding)
      VALUES (${media[1].id}, ${`[${testImageB.embedding.join(',')}]`}::vector)
      ON CONFLICT ("mediaId") DO UPDATE SET embedding = ${`[${testImageB.embedding.join(',')}]`}::vector;
    `,
    prisma.$executeRaw`
      INSERT INTO image_embeddings ("mediaId", embedding)
      VALUES (${media[2].id}, ${`[${testImageC.embedding.join(',')}]`}::vector)
      ON CONFLICT ("mediaId") DO UPDATE SET embedding = ${`[${testImageC.embedding.join(',')}]`}::vector;
    `
  ]);

  console.log('Test data setup complete');
}

async function cleanupTestData() {
  console.log('Cleaning up test data...');
  
  // Delete embeddings
  await prisma.imageEmbedding.deleteMany({
    where: {
      media: {
        product: {
          clientId: 'test-similarity-client'
        }
      }
    }
  });

  // Delete media
  await prisma.media.deleteMany({
    where: {
      product: {
        clientId: 'test-similarity-client'
      }
    }
  });

  // Delete products
  await prisma.product.deleteMany({
    where: {
      clientId: 'test-similarity-client'
    }
  });

  // Delete client
  await prisma.client.deleteMany({
    where: {
      id: 'test-similarity-client'
    }
  });

  // Clean up S3 objects
  const bucketName = process.env.S3_BUCKET_NAME!;
  for (const testImage of testImages) {
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testImage.s3Key,
        Body: Buffer.alloc(0) // Empty object to delete
      }));
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  console.log('Test data cleanup complete');
}

describe('Image Similarity Search', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('should return identical images with similarityPercent ≥ 99%', async () => {
    // Search with image A (red pixel)
    const results = await searchSimilarImages(testImages[0].embedding, 'test-similarity-client', 10);
    
    // Should find both A and C (identical red pixels)
    expect(results).toHaveLength(2);
    
    // Both should have high similarity
    expect(results[0].similarityPercent).toBeGreaterThanOrEqual(99);
    expect(results[1].similarityPercent).toBeGreaterThanOrEqual(99);
    
    // Should include both A and C
    const productNames = results.map(r => r.productName);
    expect(productNames).toContain('Test Image A (Red)');
    expect(productNames).toContain('Test Image C (Red - Identical to A)');
  });

  it('should rank identical images higher than different images', async () => {
    // Search with image A (red pixel)
    const results = await searchSimilarImages(testImages[0].embedding, 'test-similarity-client', 10);
    
    // Should have at least 2 results
    expect(results.length).toBeGreaterThanOrEqual(2);
    
    // First result should be identical (A or C)
    expect(results[0].similarityPercent).toBeGreaterThanOrEqual(99);
    
    // If there's a third result (B), it should have lower similarity
    if (results.length > 2) {
      expect(results[2].similarityPercent).toBeLessThan(99);
    }
  });

  it('should return different images with similarityPercent ≤ 60%', async () => {
    // Search with image B (blue pixel)
    const results = await searchSimilarImages(testImages[1].embedding, 'test-similarity-client', 10);
    
    // Should find all images
    expect(results).toHaveLength(3);
    
    // Should have one high similarity (B itself) and others lower
    const highSimilarity = results.filter(r => r.similarityPercent >= 99);
    const lowSimilarity = results.filter(r => r.similarityPercent <= 60);
    
    expect(highSimilarity.length).toBe(1); // B itself
    expect(lowSimilarity.length).toBeGreaterThanOrEqual(1); // A and C (different from B)
  });

  it('should maintain monotonicity in ranking', async () => {
    // Search with image A (red pixel)
    const results = await searchSimilarImages(testImages[0].embedding, 'test-similarity-client', 10);
    
    // Results should be sorted by similarity (descending)
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].similarityPercent).toBeGreaterThanOrEqual(results[i + 1].similarityPercent);
    }
  });

  it('should handle edge cases gracefully', async () => {
    // Test with empty embedding
    const emptyEmbedding = new Array(512).fill(0);
    const results = await searchSimilarImages(emptyEmbedding, 'test-similarity-client', 10);
    
    // Should return results (even if low similarity)
    expect(Array.isArray(results)).toBe(true);
    
    // All similarity percentages should be valid
    results.forEach(result => {
      expect(result.similarityPercent).toBeGreaterThanOrEqual(0);
      expect(result.similarityPercent).toBeLessThanOrEqual(100);
    });
  });
});
