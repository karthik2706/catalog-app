#!/usr/bin/env tsx

/**
 * Backfill Media Rows from Historical Product JSON Data
 * 
 * This script processes existing Product.images and Product.videos JSON arrays
 * and creates corresponding Media rows for the visual search system.
 * 
 * Usage:
 *   tsx scripts/backfill_media_from_products.ts --dry
 *   tsx scripts/backfill_media_from_products.ts --tenant=client-slug
 *   tsx scripts/backfill_media_from_products.ts --all
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Command } from 'commander';

const prisma = new PrismaClient();

interface BackfillStats {
  tenant: string;
  productsProcessed: number;
  mediaCreated: number;
  mediaUpdated: number;
  errors: number;
}

interface MediaData {
  productId: string;
  clientId: string;
  kind: 'image' | 'video';
  s3Key: string;
  originalUrl: string;
}

/**
 * Extract S3 key from URL by removing domain and query parameters
 */
function extractS3Key(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Remove leading slash and query parameters
    let s3Key = urlObj.pathname.substring(1);
    if (urlObj.search) {
      s3Key = s3Key.split('?')[0];
    }
    
    // Must start with 'clients/' to be valid
    if (!s3Key.startsWith('clients/')) {
      return null;
    }
    
    return s3Key;
  } catch (error) {
    return null;
  }
}

/**
 * Detect media kind from file extension
 */
function detectMediaKind(url: string): 'image' | 'video' | null {
  const extension = url.split('.').pop()?.toLowerCase();
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
  const videoExtensions = ['mp4', 'webm', 'avi', 'mov', 'mkv'];
  
  if (imageExtensions.includes(extension || '')) {
    return 'image';
  }
  
  if (videoExtensions.includes(extension || '')) {
    return 'video';
  }
  
  return null;
}

/**
 * Parse media URLs from Product JSON arrays
 */
function parseMediaFromProduct(product: any): MediaData[] {
  const mediaData: MediaData[] = [];
  
  // Process images array
  if (product.images && Array.isArray(product.images)) {
    for (const imageItem of product.images) {
      let imageUrl = null;
      let s3Key = null;
      
      if (typeof imageItem === 'string') {
        imageUrl = imageItem;
        s3Key = extractS3Key(imageUrl);
      } else if (typeof imageItem === 'object' && imageItem !== null) {
        // Handle object format with key/url properties
        imageUrl = imageItem.url || imageItem.URL || imageItem.src;
        s3Key = imageItem.key || imageItem.s3Key || imageItem.Key || imageItem.s3_key;
        
        // If we have s3Key but no URL, try to extract from s3Key
        if (s3Key && !imageUrl) {
          imageUrl = `https://quick-stock-media.s3.us-east-2.amazonaws.com/${s3Key}`;
        }
      }
      
      if (s3Key) {
        const kind = detectMediaKind(imageUrl || s3Key);
        
        if (kind) {
          mediaData.push({
            productId: product.id,
            clientId: product.clientId,
            kind,
            s3Key,
            originalUrl: imageUrl || s3Key,
          });
        }
      }
    }
  }
  
  // Process videos array
  if (product.videos && Array.isArray(product.videos)) {
    for (const videoItem of product.videos) {
      let videoUrl = null;
      let s3Key = null;
      
      if (typeof videoItem === 'string') {
        videoUrl = videoItem;
        s3Key = extractS3Key(videoUrl);
      } else if (typeof videoItem === 'object' && videoItem !== null) {
        // Handle object format with key/url properties
        videoUrl = videoItem.url || videoItem.URL || videoItem.src;
        s3Key = videoItem.key || videoItem.s3Key || videoItem.Key || videoItem.s3_key;
        
        // If we have s3Key but no URL, try to extract from s3Key
        if (s3Key && !videoUrl) {
          videoUrl = `https://quick-stock-media.s3.us-east-2.amazonaws.com/${s3Key}`;
        }
      }
      
      if (s3Key) {
        const kind = detectMediaKind(videoUrl || s3Key);
        
        if (kind) {
          mediaData.push({
            productId: product.id,
            clientId: product.clientId,
            kind,
            s3Key,
            originalUrl: videoUrl || s3Key,
          });
        }
      }
    }
  }
  
  return mediaData;
}

/**
 * Backfill media for a specific tenant
 */
async function backfillTenant(tenantSlug: string, dryRun: boolean): Promise<BackfillStats> {
  console.log(`\n🔄 Processing tenant: ${tenantSlug}`);
  
  // Get tenant info
  const tenant = await prisma.client.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, name: true, slug: true },
  });
  
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantSlug}`);
  }
  
  console.log(`   Tenant: ${tenant.name} (${tenant.id})`);
  
  // Get all products for this tenant
  const products = await prisma.product.findMany({
    where: {
      clientId: tenant.id,
      OR: [
        { images: { not: Prisma.JsonNull } },
        { videos: { not: Prisma.JsonNull } },
      ],
    },
    select: {
      id: true,
      name: true,
      sku: true,
      clientId: true,
      images: true,
      videos: true,
    },
  });
  
  console.log(`   Found ${products.length} products with media JSON`);
  
  const stats: BackfillStats = {
    tenant: tenantSlug,
    productsProcessed: 0,
    mediaCreated: 0,
    mediaUpdated: 0,
    errors: 0,
  };
  
  for (const product of products) {
    try {
      const mediaData = parseMediaFromProduct(product);
      
      if (mediaData.length === 0) {
        continue;
      }
      
      console.log(`   📦 Product: ${product.name} (${product.sku}) - ${mediaData.length} media items`);
      
      for (const media of mediaData) {
        if (dryRun) {
          console.log(`     [DRY RUN] Would upsert: ${media.kind} - ${media.s3Key}`);
          stats.mediaCreated++;
        } else {
          try {
            const result = await prisma.media.upsert({
              where: {
                s3Key: media.s3Key,
              },
              create: {
                productId: media.productId,
                clientId: media.clientId,
                kind: media.kind,
                s3Key: media.s3Key,
                status: 'completed', // Mark as completed since it's existing media
                width: null, // Will be populated when processed
                height: null,
                durationMs: null,
              },
              update: {
                // Update metadata if re-running
                updatedAt: new Date(),
              },
            });
            
            if (result.createdAt.getTime() === result.updatedAt.getTime()) {
              stats.mediaCreated++;
            } else {
              stats.mediaUpdated++;
            }
          } catch (error) {
            console.error(`     ❌ Error upserting media: ${media.s3Key}`, error);
            stats.errors++;
          }
        }
      }
      
      stats.productsProcessed++;
    } catch (error) {
      console.error(`   ❌ Error processing product ${product.sku}:`, error);
      stats.errors++;
    }
  }
  
  return stats;
}

/**
 * Backfill media for all tenants
 */
async function backfillAllTenants(dryRun: boolean): Promise<BackfillStats[]> {
  console.log('\n🌍 Processing all tenants...');
  
  const tenants = await prisma.client.findMany({
    where: { isActive: true },
    select: { slug: true, name: true },
    orderBy: { name: 'asc' },
  });
  
  console.log(`Found ${tenants.length} active tenants`);
  
  const allStats: BackfillStats[] = [];
  
  for (const tenant of tenants) {
    try {
      const stats = await backfillTenant(tenant.slug, dryRun);
      allStats.push(stats);
    } catch (error) {
      console.error(`❌ Error processing tenant ${tenant.slug}:`, error);
      allStats.push({
        tenant: tenant.slug,
        productsProcessed: 0,
        mediaCreated: 0,
        mediaUpdated: 0,
        errors: 1,
      });
    }
  }
  
  return allStats;
}

/**
 * Print summary statistics
 */
function printSummary(stats: BackfillStats[]): void {
  console.log('\n📊 BACKFILL SUMMARY');
  console.log('==================');
  
  let totalProducts = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  for (const stat of stats) {
    console.log(`\n🏢 ${stat.tenant}:`);
    console.log(`   Products processed: ${stat.productsProcessed}`);
    console.log(`   Media created: ${stat.mediaCreated}`);
    console.log(`   Media updated: ${stat.mediaUpdated}`);
    console.log(`   Errors: ${stat.errors}`);
    
    totalProducts += stat.productsProcessed;
    totalCreated += stat.mediaCreated;
    totalUpdated += stat.mediaUpdated;
    totalErrors += stat.errors;
  }
  
  console.log('\n🎯 TOTALS:');
  console.log(`   Products processed: ${totalProducts}`);
  console.log(`   Media created: ${totalCreated}`);
  console.log(`   Media updated: ${totalUpdated}`);
  console.log(`   Errors: ${totalErrors}`);
  
  if (totalErrors > 0) {
    console.log('\n⚠️  Some errors occurred. Check the logs above for details.');
  } else {
    console.log('\n✅ Backfill completed successfully!');
  }
}

/**
 * Main function
 */
async function main() {
  const program = new Command();
  
  program
    .name('backfill-media')
    .description('Backfill Media rows from historical Product JSON data')
    .version('1.0.0')
    .option('--dry', 'Dry run mode - show what would be done without making changes')
    .option('--tenant <slug>', 'Process specific tenant by slug')
    .option('--all', 'Process all active tenants')
    .option('--help', 'Show help')
    .parse();
  
  const options = program.opts();
  
  if (!options.tenant && !options.all) {
    console.error('❌ Error: Must specify either --tenant <slug> or --all');
    console.log('\nUsage:');
    console.log('  tsx scripts/backfill_media_from_products.ts --dry --all');
    console.log('  tsx scripts/backfill_media_from_products.ts --tenant=client-slug');
    console.log('  tsx scripts/backfill_media_from_products.ts --all');
    process.exit(1);
  }
  
  try {
    console.log('🚀 Starting media backfill process...');
    console.log(`Mode: ${options.dry ? 'DRY RUN' : 'LIVE RUN'}`);
    
    let stats: BackfillStats[];
    
    if (options.tenant) {
      stats = [await backfillTenant(options.tenant, options.dry)];
    } else {
      stats = await backfillAllTenants(options.dry);
    }
    
    printSummary(stats);
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
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

export { backfillTenant, backfillAllTenants, parseMediaFromProduct };
