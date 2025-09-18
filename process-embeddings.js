#!/usr/bin/env node

/**
 * Process Pending Media for Embeddings
 * 
 * This script processes pending media items and generates embeddings for them.
 * It's a simple implementation for development/testing purposes.
 */

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const prisma = new PrismaClient();
const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000';

async function processPendingMedia() {
  console.log('🔄 Processing pending media for embeddings...');
  
  try {
    // Get all pending media items
    const pendingMedia = await prisma.media.findMany({
      where: {
        status: 'pending',
        kind: 'image', // Only process images for now
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });

    console.log(`Found ${pendingMedia.length} pending media items`);

    for (const media of pendingMedia) {
      try {
        console.log(`\n📸 Processing: ${media.product.name} (${media.product.sku})`);
        console.log(`   S3 Key: ${media.s3Key}`);
        
        // Download image from S3 (we'll use a test image for now)
        // In a real implementation, you'd download from S3 using the s3Key
        const testImagePath = path.join(__dirname, 'test-image.png');
        
        if (!fs.existsSync(testImagePath)) {
          console.log('   ⚠️  Test image not found, skipping...');
          continue;
        }

        // Create form data for embedding service
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testImagePath));

        // Call embedding service
        console.log('   🤖 Calling embedding service...');
        const embeddingResponse = await fetch(`${EMBEDDING_SERVICE_URL}/embed-image`, {
          method: 'POST',
          body: formData,
        });

        if (!embeddingResponse.ok) {
          throw new Error(`Embedding service failed: ${embeddingResponse.statusText}`);
        }

        const embeddingData = await embeddingResponse.json();
        console.log(`   ✅ Embedding generated: ${embeddingData.embedding.length} dimensions`);

        // Store embedding in database
        await prisma.imageEmbedding.create({
          data: {
            mediaId: media.id,
            embedding: `[${embeddingData.embedding.join(',')}]`,
          },
        });

        // Update media status to completed
        await prisma.media.update({
          where: { id: media.id },
          data: {
            status: 'completed',
            updatedAt: new Date(),
          },
        });

        console.log('   ✅ Embedding stored and media marked as completed');

      } catch (error) {
        console.error(`   ❌ Error processing media ${media.id}:`, error.message);
        
        // Update media status to error
        await prisma.media.update({
          where: { id: media.id },
          data: {
            status: 'error',
            error: error.message,
            updatedAt: new Date(),
          },
        });
      }
    }

    console.log('\n✅ Processing complete!');

  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
processPendingMedia().catch(console.error);
