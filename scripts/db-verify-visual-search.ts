#!/usr/bin/env ts-node

/**
 * Database Verification Script for Visual Search
 * 
 * This script verifies that the pgvector extension is installed and
 * the visual search tables are properly created with correct indexes.
 * 
 * Usage: npx ts-node scripts/db-verify-visual-search.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
  success: boolean;
  message: string;
  details?: any;
}

async function checkPgVectorExtension(): Promise<VerificationResult> {
  try {
    const result = await prisma.$queryRaw<Array<{ extname: string; extversion: string }>>`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector'
    `;
    
    if (result.length === 0) {
      return {
        success: false,
        message: 'pgvector extension is not installed',
        details: { installed: false }
      };
    }
    
    const version = result[0].extversion;
    return {
      success: true,
      message: `pgvector extension is installed (version: ${version})`,
      details: { installed: true, version }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to check pgvector extension: ${error}`,
      details: { error: String(error) }
    };
  }
}

async function checkTablesExist(): Promise<VerificationResult> {
  const requiredTables = ['media', 'image_embeddings', 'video_frames', 'frame_embeddings'];
  const results: { [key: string]: boolean } = {};
  
  try {
    for (const table of requiredTables) {
      const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        ) as exists
      `;
      results[table] = result[0].exists;
    }
    
    const missingTables = requiredTables.filter(table => !results[table]);
    
    if (missingTables.length > 0) {
      return {
        success: false,
        message: `Missing tables: ${missingTables.join(', ')}`,
        details: { tableStatus: results, missing: missingTables }
      };
    }
    
    return {
      success: true,
      message: 'All required tables exist',
      details: { tableStatus: results }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to check tables: ${error}`,
      details: { error: String(error) }
    };
  }
}

async function checkVectorIndexes(): Promise<VerificationResult> {
  try {
    const indexResult = await prisma.$queryRaw<Array<{ 
      indexname: string; 
      indexdef: string;
      tablename: string;
    }>>`
      SELECT indexname, indexdef, tablename
      FROM pg_indexes 
      WHERE tablename IN ('image_embeddings', 'frame_embeddings')
      AND indexdef LIKE '%vector%'
    `;
    
    const hasHNSW = indexResult.some(idx => idx.indexdef.includes('hnsw'));
    const hasIVFFLAT = indexResult.some(idx => idx.indexdef.includes('ivfflat'));
    
    if (!hasHNSW && !hasIVFFLAT) {
      return {
        success: false,
        message: 'No vector indexes found for similarity search',
        details: { indexes: indexResult }
      };
    }
    
    return {
      success: true,
      message: `Vector indexes found (HNSW: ${hasHNSW}, IVFFLAT: ${hasIVFFLAT})`,
      details: { indexes: indexResult, hasHNSW, hasIVFFLAT }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to check vector indexes: ${error}`,
      details: { error: String(error) }
    };
  }
}

async function checkTableCounts(): Promise<VerificationResult> {
  try {
    const counts = await Promise.all([
      prisma.media.count(),
      prisma.imageEmbedding.count(),
      prisma.videoFrame.count(),
      prisma.frameEmbedding.count()
    ]);
    
    const [mediaCount, imageEmbeddingCount, videoFrameCount, frameEmbeddingCount] = counts;
    
    return {
      success: true,
      message: 'Table counts retrieved successfully',
      details: {
        media: mediaCount,
        imageEmbeddings: imageEmbeddingCount,
        videoFrames: videoFrameCount,
        frameEmbeddings: frameEmbeddingCount
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to get table counts: ${error}`,
      details: { error: String(error) }
    };
  }
}

async function checkForeignKeys(): Promise<VerificationResult> {
  try {
    const fkResult = await prisma.$queryRaw<Array<{
      constraint_name: string;
      table_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>>`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('media', 'image_embeddings', 'video_frames', 'frame_embeddings')
    `;
    
    const expectedFKs = [
      'media_productId_fkey',
      'media_clientId_fkey', 
      'image_embeddings_mediaId_fkey',
      'video_frames_mediaId_fkey',
      'frame_embeddings_frameId_fkey'
    ];
    
    const foundFKs = fkResult.map(fk => fk.constraint_name);
    const missingFKs = expectedFKs.filter(fk => !foundFKs.includes(fk));
    
    if (missingFKs.length > 0) {
      return {
        success: false,
        message: `Missing foreign keys: ${missingFKs.join(', ')}`,
        details: { found: foundFKs, missing: missingFKs, all: fkResult }
      };
    }
    
    return {
      success: true,
      message: 'All foreign key constraints are in place',
      details: { foreignKeys: fkResult }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to check foreign keys: ${error}`,
      details: { error: String(error) }
    };
  }
}

async function main() {
  console.log('🔍 Verifying Visual Search Database Setup...\n');
  
  const checks = [
    { name: 'pgvector Extension', fn: checkPgVectorExtension },
    { name: 'Required Tables', fn: checkTablesExist },
    { name: 'Vector Indexes', fn: checkVectorIndexes },
    { name: 'Foreign Keys', fn: checkForeignKeys },
    { name: 'Table Counts', fn: checkTableCounts }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${result.message}`);
      
      if (result.details && process.env.DEBUG) {
        console.log('   Details:', JSON.stringify(result.details, null, 2));
      }
      
      if (!result.success) {
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${check.name}: Error - ${error}`);
      allPassed = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All checks passed! Visual search database is ready.');
    process.exit(0);
  } else {
    console.log('⚠️  Some checks failed. Please review the issues above.');
    process.exit(1);
  }
}

// Handle cleanup
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(1);
});

// Run the verification
main()
  .catch(async (error) => {
    console.error('💥 Verification failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
