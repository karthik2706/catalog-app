import { query } from './pg';
import { generateSignedUrl } from './aws';

export interface SearchResult {
  productId: string;
  productName: string;
  score: number;
  similarityPercent: number;
  match: {
    type: 'image' | 'video';
    tsMs?: number;
    thumbUrl?: string;
  };
}

export interface ImageMatch {
  productId: string;
  productName: string;
  score: number;
  similarityPercent: number;
  s3Key: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export interface VideoMatch {
  productId: string;
  productName: string;
  score: number;
  frameS3Key: string;
  tsMs: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

/**
 * Search for similar images using vector cosine similarity
 * 
 * @param embedding - 512-dimensional CLIP embedding vector
 * @param clientId - Tenant client ID for isolation
 * @param limit - Maximum number of results to return
 * @returns Promise<ImageMatch[]> - Array of matching images
 * 
 * TUNING:
 * - Use LIMIT to control result set size (24-100 for UI, 1000+ for batch processing)
 * - HNSW: ef_search=50-100 for production, ef_search=200+ for high recall
 * - IVFFLAT: probes=10-50, higher for better recall but slower queries
 * - Consider adding WHERE clauses before vector search to reduce index size
 * - Monitor query performance with EXPLAIN ANALYZE
 */
export async function searchSimilarImages(
  embedding: number[],
  clientId: string,
  limit: number = 24
): Promise<ImageMatch[]> {
  const embeddingArray = `[${embedding.join(',')}]`;
  
  const sql = `
    SELECT 
      p.id as "productId",
      p.name as "productName",
      ie.embedding <#> $1::vector as score,
      ((1 - (ie.embedding <#> $1::vector)) * 50) as "similarityPercent",
      m."s3Key",
      m.width,
      m.height,
      p."thumbnailUrl"
    FROM image_embeddings ie
    JOIN media m ON ie."mediaId" = m.id
    JOIN products p ON m."productId" = p.id
    WHERE p."clientId" = $2
      AND p."isActive" = true
    ORDER BY ie.embedding <#> $1::vector
    LIMIT $3
  `;

  try {
    const result = await query<ImageMatch>(sql, [embeddingArray, clientId, limit]);
    
    // Filter out poor matches (similarityPercent < 60 means very different)
    const filteredResults = result.rows.filter(match => match.similarityPercent >= 60);
    
    // If we have good matches, return them; otherwise return the best available
    return filteredResults.length > 0 ? filteredResults : result.rows.slice(0, 3);
  } catch (error) {
    console.error('Error searching similar images:', error);
    throw new Error('Failed to search similar images');
  }
}

/**
 * Search for similar video frames using vector cosine similarity
 * 
 * @param embedding - 512-dimensional CLIP embedding vector
 * @param clientId - Tenant client ID for isolation
 * @param limit - Maximum number of results to return
 * @returns Promise<VideoMatch[]> - Array of matching video frames
 * 
 * TUNING:
 * - Frame budget: 1-5 frames per second for videos, enable scene detection
 * - HNSW: ef_search=100-200 for video frames (higher recall needed)
 * - IVFFLAT: probes=20-100 for video frames, more probes for better temporal matching
 * - Consider temporal clustering to group similar frames from same video
 * - Use tsMs for temporal ordering and deduplication
 */
export async function searchSimilarVideoFrames(
  embedding: number[],
  clientId: string,
  limit: number = 24
): Promise<VideoMatch[]> {
  const embeddingArray = `[${embedding.join(',')}]`;
  
  const sql = `
    SELECT 
      p.id as "productId",
      p.name as "productName",
      fe.embedding <#> $1::vector as score,
      vf."frameS3Key",
      vf."tsMs",
      m.width,
      m.height,
      p."thumbnailUrl"
    FROM frame_embeddings fe
    JOIN video_frames vf ON fe."frameId" = vf.id
    JOIN media m ON vf."mediaId" = m.id
    JOIN products p ON m."productId" = p.id
    WHERE p."clientId" = $2
      AND p."isActive" = true
    ORDER BY fe.embedding <#> $1::vector
    LIMIT $3
  `;

  try {
    const result = await query<VideoMatch>(sql, [embeddingArray, clientId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error searching similar video frames:', error);
    throw new Error('Failed to search similar video frames');
  }
}

/**
 * Search for similar products by combining image and video frame matches
 * Groups results by productId and returns the best match for each product
 * 
 * @param embedding - 512-dimensional CLIP embedding vector
 * @param clientId - Tenant client ID for isolation
 * @param limit - Maximum number of products to return
 * @returns Promise<SearchResult[]> - Array of matching products with best match info
 */
export async function searchSimilarProducts(
  embedding: number[],
  clientId: string,
  limit: number = 24
): Promise<SearchResult[]> {
  try {
    // Search both images and video frames in parallel
    const [imageMatches, videoMatches] = await Promise.all([
      searchSimilarImages(embedding, clientId, limit * 2), // Get more results to account for grouping
      searchSimilarVideoFrames(embedding, clientId, limit * 2)
    ]);

    // Combine and group by productId
    const productMap = new Map<string, SearchResult>();

    // Process image matches
    for (const match of imageMatches) {
      const existing = productMap.get(match.productId);
      
      if (!existing || match.score < existing.score) {
        // Prioritize thumbnailUrl over s3Key for better image display
        const thumbUrl = match.thumbnailUrl || match.s3Key;
        
        productMap.set(match.productId, {
          productId: match.productId,
          productName: match.productName,
          score: match.score,
          similarityPercent: match.similarityPercent,
          match: {
            type: 'image',
            thumbUrl: thumbUrl,
          }
        });
      }
    }

    // Process video frame matches
    for (const match of videoMatches) {
      const existing = productMap.get(match.productId);
      
      if (!existing || match.score < existing.score) {
        // Prioritize thumbnailUrl over frameS3Key for better image display
        const thumbUrl = match.thumbnailUrl || match.frameS3Key;
        
        productMap.set(match.productId, {
          productId: match.productId,
          productName: match.productName,
          score: match.score,
          match: {
            type: 'video',
            tsMs: match.tsMs,
            thumbUrl: thumbUrl,
          }
        });
      }
    }

    // Convert to array and sort by score (lower is better for negative cosine similarity)
    const results = Array.from(productMap.values())
      .sort((a, b) => a.score - b.score)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('Error searching similar products:', error);
    throw new Error('Failed to search similar products');
  }
}

/**
 * Get product details for search results
 * This can be used to enrich search results with additional product information
 * 
 * @param productIds - Array of product IDs
 * @param clientId - Tenant client ID for isolation
 * @returns Promise with product details
 */
export async function getProductDetails(
  productIds: string[],
  clientId: string
): Promise<any[]> {
  if (productIds.length === 0) return [];

  const placeholders = productIds.map((_, index) => `$${index + 2}`).join(',');
  
  const sql = `
    SELECT 
      id,
      name,
      sku,
      description,
      price,
      "thumbnailUrl",
      "stockLevel",
      "isActive"
    FROM products
    WHERE id IN (${placeholders})
      AND "clientId" = $1
      AND "isActive" = true
  `;

  try {
    const result = await query(sql, [clientId, ...productIds]);
    return result.rows;
  } catch (error) {
    console.error('Error getting product details:', error);
    throw new Error('Failed to get product details');
  }
}

/**
 * Convert S3 key to full URL
 * This is a helper function to generate proper URLs for media files
 * 
 * @param s3Key - S3 object key
 * @param bucket - S3 bucket name
 * @param region - AWS region
 * @returns Full S3 URL
 */
export function getS3Url(s3Key: string, bucket?: string, region?: string): string {
  const bucketName = bucket || process.env.S3_BUCKET_NAME;
  const awsRegion = region || process.env.AWS_REGION || 'us-east-1';
  
  if (!bucketName) {
    console.warn('S3_BUCKET_NAME not configured, returning key as-is');
    return s3Key;
  }
  
  return `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${s3Key}`;
}

/**
 * Enrich search results with full URLs and additional metadata
 * 
 * @param results - Search results from searchSimilarProducts
 * @returns Enriched search results with full URLs
 */
export async function enrichSearchResults(results: SearchResult[]): Promise<SearchResult[]> {
  const enrichedResults = await Promise.all(
    results.map(async (result) => {
      let thumbUrl = undefined;
      
      if (result.match.thumbUrl) {
        // If it's already a full URL (like thumbnailUrl from Unsplash), use it directly
        if (result.match.thumbUrl.startsWith('http')) {
          thumbUrl = result.match.thumbUrl;
        } else {
          // If it's an S3 key, generate a signed URL
          try {
            thumbUrl = await generateSignedUrl(result.match.thumbUrl, 7 * 24 * 60 * 60); // 7 days
          } catch (error) {
            console.error('Error generating signed URL for search result:', error);
            // Fallback to raw S3 URL if signing fails
            thumbUrl = getS3Url(result.match.thumbUrl);
          }
        }
      }
      
      return {
        ...result,
        match: {
          ...result.match,
          thumbUrl,
        }
      };
    })
  );
  
  return enrichedResults;
}
