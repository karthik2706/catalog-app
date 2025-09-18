import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { searchSimilarImages } from '../src/lib/search';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const prisma = new PrismaClient();

describe('Image Similarity Search', () => {
  beforeAll(async () => {
    // Ensure database connection
    await prisma.$connect();
  });

  it('should return identical vectors with similarityPercent ≥ 99%', async () => {
    // Create a test embedding (512-dimensional vector)
    const testEmbedding = Array.from({ length: 512 }, () => Math.random() - 0.5);
    
    // Normalize the embedding (L2 normalization)
    const norm = Math.sqrt(testEmbedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = testEmbedding.map(val => val / norm);
    
    // Insert test data into database
    const testClientId = 'test-client-similarity';
    
    // Create test client
    await prisma.client.upsert({
      where: { id: testClientId },
      update: {},
      create: {
        id: testClientId,
        name: 'Test Client',
        email: 'test@example.com',
        slug: 'test-client'
      }
    });
    
    // Create test product
    const testProduct = await prisma.product.upsert({
      where: { sku: 'TEST-SIMILARITY-001' },
      update: {},
      create: {
        sku: 'TEST-SIMILARITY-001',
        name: 'Test Product for Similarity',
        clientId: testClientId,
        isActive: true
      }
    });
    
    // Create test media
    const testMedia = await prisma.media.upsert({
      where: { 
        productId_kind: {
          productId: testProduct.id,
          kind: 'image'
        }
      },
      update: {},
      create: {
        productId: testProduct.id,
        clientId: testClientId,
        kind: 'image',
        s3Key: 'test/similarity/image.jpg',
        status: 'completed'
      }
    });
    
    // Insert identical embedding
    await prisma.$executeRaw`
      INSERT INTO image_embeddings ("mediaId", embedding)
      VALUES (${testMedia.id}, ${`[${normalizedEmbedding.join(',')}]`}::vector)
      ON CONFLICT ("mediaId") DO UPDATE SET embedding = ${`[${normalizedEmbedding.join(',')}]`}::vector;
    `;
    
    // Test search with identical embedding
    const results = await searchSimilarImages(normalizedEmbedding, testClientId, 10);
    
    // Verify results
    expect(results).toHaveLength(1);
    expect(results[0].productId).toBe(testProduct.id);
    expect(results[0].productName).toBe('Test Product for Similarity');
    expect(results[0].similarityPercent).toBeGreaterThanOrEqual(99);
    
    // Clean up
    await prisma.imageEmbedding.deleteMany({
      where: { mediaId: testMedia.id }
    });
    await prisma.media.deleteMany({
      where: { productId: testProduct.id }
    });
    await prisma.product.deleteMany({
      where: { id: testProduct.id }
    });
    await prisma.client.deleteMany({
      where: { id: testClientId }
    });
  });

  it('should rank identical image at #1', async () => {
    const testClientId = 'test-client-ranking';
    
    // Create test client
    await prisma.client.upsert({
      where: { id: testClientId },
      update: {},
      create: {
        id: testClientId,
        name: 'Test Client Ranking',
        email: 'test-ranking@example.com',
        slug: 'test-client-ranking'
      }
    });
    
    // Create test products
    const products = await Promise.all([
      prisma.product.upsert({
        where: { sku: 'TEST-RANK-001' },
        update: {},
        create: {
          sku: 'TEST-RANK-001',
          name: 'Identical Product',
          clientId: testClientId,
          isActive: true
        }
      }),
      prisma.product.upsert({
        where: { sku: 'TEST-RANK-002' },
        update: {},
        create: {
          sku: 'TEST-RANK-002',
          name: 'Different Product 1',
          clientId: testClientId,
          isActive: true
        }
      }),
      prisma.product.upsert({
        where: { sku: 'TEST-RANK-003' },
        update: {},
        create: {
          sku: 'TEST-RANK-003',
          name: 'Different Product 2',
          clientId: testClientId,
          isActive: true
        }
      })
    ]);
    
    // Create test media
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
          clientId: testClientId,
          kind: 'image',
          s3Key: 'test/ranking/identical.jpg',
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
          clientId: testClientId,
          kind: 'image',
          s3Key: 'test/ranking/different1.jpg',
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
          clientId: testClientId,
          kind: 'image',
          s3Key: 'test/ranking/different2.jpg',
          status: 'completed'
        }
      })
    ]);
    
    // Create test embedding
    const testEmbedding = Array.from({ length: 512 }, () => Math.random() - 0.5);
    const norm = Math.sqrt(testEmbedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = testEmbedding.map(val => val / norm);
    
    // Insert identical embedding for first product
    await prisma.$executeRaw`
      INSERT INTO image_embeddings ("mediaId", embedding)
      VALUES (${media[0].id}, ${`[${normalizedEmbedding.join(',')}]`}::vector)
      ON CONFLICT ("mediaId") DO UPDATE SET embedding = ${`[${normalizedEmbedding.join(',')}]`}::vector;
    `;
    
    // Insert different embeddings for other products
    const differentEmbedding1 = Array.from({ length: 512 }, () => Math.random() - 0.5);
    const norm1 = Math.sqrt(differentEmbedding1.reduce((sum, val) => sum + val * val, 0));
    const normalizedDifferent1 = differentEmbedding1.map(val => val / norm1);
    
    const differentEmbedding2 = Array.from({ length: 512 }, () => Math.random() - 0.5);
    const norm2 = Math.sqrt(differentEmbedding2.reduce((sum, val) => sum + val * val, 0));
    const normalizedDifferent2 = differentEmbedding2.map(val => val / norm2);
    
    await prisma.$executeRaw`
      INSERT INTO image_embeddings ("mediaId", embedding)
      VALUES (${media[1].id}, ${`[${normalizedDifferent1.join(',')}]`}::vector)
      ON CONFLICT ("mediaId") DO UPDATE SET embedding = ${`[${normalizedDifferent1.join(',')}]`}::vector;
    `;
    
    await prisma.$executeRaw`
      INSERT INTO image_embeddings ("mediaId", embedding)
      VALUES (${media[2].id}, ${`[${normalizedDifferent2.join(',')}]`}::vector)
      ON CONFLICT ("mediaId") DO UPDATE SET embedding = ${`[${normalizedDifferent2.join(',')}]`}::vector;
    `;
    
    // Test search
    const results = await searchSimilarImages(normalizedEmbedding, testClientId, 10);
    
    // Verify ranking
    expect(results).toHaveLength(3);
    expect(results[0].productName).toBe('Identical Product');
    expect(results[0].similarityPercent).toBeGreaterThanOrEqual(99);
    
    // Verify that identical product has higher similarity than others
    expect(results[0].similarityPercent).toBeGreaterThan(results[1].similarityPercent);
    expect(results[0].similarityPercent).toBeGreaterThan(results[2].similarityPercent);
    
    // Clean up
    await prisma.imageEmbedding.deleteMany({
      where: { mediaId: { in: media.map(m => m.id) } }
    });
    await prisma.media.deleteMany({
      where: { productId: { in: products.map(p => p.id) } }
    });
    await prisma.product.deleteMany({
      where: { id: { in: products.map(p => p.id) } }
    });
    await prisma.client.deleteMany({
      where: { id: testClientId }
    });
  });
});
