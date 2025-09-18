#!/usr/bin/env tsx

/**
 * Re-embed All Images Script
 * 
 * This script re-embeds all existing images using the normalized FastAPI service
 * to ensure consistent L2-normalized vectors for proper similarity calculation.
 */

import { PrismaClient } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
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

interface EmbeddingResponse {
  embedding: number[];
  model: string;
  device: string;
  normalized: boolean;
  dimension: number;
}

async function downloadImageFromS3(s3Key: string): Promise<Buffer> {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME is not defined in environment variables.');
  }

  console.log(`   📥 Downloading: ${s3Key}`);
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  try {
    const { Body } = await s3Client.send(command);
    const chunks = [];
    for await (const chunk of Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error: any) {
    console.error(`   ❌ Failed to download ${s3Key}: ${error.message}`);
    throw error;
  }
}

async function generateEmbedding(imageBuffer: Buffer): Promise<EmbeddingResponse> {
  const tempImagePath = join(process.cwd(), `temp_reembed_${Date.now()}.png`);
  writeFileSync(tempImagePath, imageBuffer);

  try {
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('file', blob, 'image.png');

    const response = await fetch(`${EMBEDDING_SERVICE_URL}/embed-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding service error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.embedding || !Array.isArray(result.embedding)) {
      throw new Error('Invalid embedding response from service');
    }

    if (result.embedding.length !== 512) {
      throw new Error(`Invalid embedding dimension. Expected 512, got ${result.embedding.length}`);
    }

    if (!result.normalized) {
      throw new Error('Embedding is not normalized');
    }

    return result;
  } finally {
    try {
      unlinkSync(tempImagePath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

async function reembedImages() {
  console.log('🔄 Re-embedding all images with normalized vectors...');

  // Get all media with images
  const mediaItems = await prisma.media.findMany({
    where: {
      kind: 'image',
      status: 'completed',
    },
    include: {
      product: {
        select: {
          name: true,
          sku: true,
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log(`Found ${mediaItems.length} images to re-embed`);

  let successCount = 0;
  let errorCount = 0;
  const batchSize = 100;

  for (let i = 0; i < mediaItems.length; i += batchSize) {
    const batch = mediaItems.slice(i, i + batchSize);
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(mediaItems.length / batchSize)} (${batch.length} items)`);

    const promises = batch.map(async (mediaItem) => {
      try {
        console.log(`\n📸 Processing: ${mediaItem.product.name} (${mediaItem.product.sku})`);
        console.log(`   Media ID: ${mediaItem.id}`);
        console.log(`   S3 Key: ${mediaItem.s3Key}`);

        // Download image from S3
        const imageBuffer = await downloadImageFromS3(mediaItem.s3Key);
        console.log(`   📥 Downloaded ${imageBuffer.length} bytes`);

        // Generate normalized embedding
        console.log(`   🤖 Generating normalized embedding...`);
        const embeddingData = await generateEmbedding(imageBuffer);
        console.log(`   ✅ Generated ${embeddingData.dimension}D normalized embedding`);

        // Update embedding in database
        await prisma.$executeRaw`
          INSERT INTO image_embeddings ("mediaId", embedding)
          VALUES (${mediaItem.id}, ${`[${embeddingData.embedding.join(',')}]`}::vector)
          ON CONFLICT ("mediaId") DO UPDATE SET embedding = ${`[${embeddingData.embedding.join(',')}]`}::vector;
        `;

        console.log(`   ✅ Updated embedding in database`);
        return { success: true, mediaId: mediaItem.id };
      } catch (error: any) {
        console.error(`   ❌ Error processing ${mediaItem.product.sku}: ${error.message}`);
        return { success: false, mediaId: mediaItem.id, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    
    const batchSuccess = results.filter(r => r.success).length;
    const batchErrors = results.filter(r => !r.success).length;
    
    successCount += batchSuccess;
    errorCount += batchErrors;
    
    console.log(`   📊 Batch complete: ${batchSuccess} success, ${batchErrors} errors`);
  }

  console.log(`\n✅ Re-embedding complete!`);
  console.log(`   📊 Total: ${successCount} success, ${errorCount} errors`);
  console.log(`   📈 Success rate: ${((successCount / mediaItems.length) * 100).toFixed(1)}%`);
}

async function main() {
  try {
    await reembedImages();
  } catch (error) {
    console.error('❌ Re-embedding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
