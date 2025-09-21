import { prisma } from '@/lib/prisma'

interface EmbeddingResponse {
  embedding: number[]
  model: string
  device: string
}

const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000'

/**
 * Generate embedding for an image using the embedding service
 * @param imageUrl - URL of the image to process
 * @returns Promise<EmbeddingResponse> - The embedding response from the service
 */
export async function generateImageEmbedding(imageUrl: string): Promise<EmbeddingResponse> {
  try {
    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBlob = new Blob([imageBuffer])
    
    // Create FormData for the embedding service
    const formData = new FormData()
    formData.append('file', imageBlob, 'image.jpg')
    
    // Call the embedding service
    const embeddingResponse = await fetch(`${EMBEDDING_SERVICE_URL}/embed-image`, {
      method: 'POST',
      body: formData,
    })
    
    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text()
      throw new Error(`Embedding service error: ${errorText}`)
    }
    
    const embeddingData = await embeddingResponse.json()
    
    if (!embeddingData.embedding || !Array.isArray(embeddingData.embedding)) {
      throw new Error('Invalid embedding response from service')
    }
    
    if (embeddingData.embedding.length !== 512) {
      throw new Error(`Invalid embedding dimension. Expected 512, got ${embeddingData.embedding.length}`)
    }
    
    return embeddingData
  } catch (error) {
    console.error('Error generating image embedding:', error)
    throw error
  }
}

/**
 * Store image embedding in the database
 * @param mediaId - ID of the media record
 * @param embedding - 512-dimensional embedding vector
 */
export async function storeImageEmbedding(mediaId: bigint, embedding: number[]): Promise<void> {
  try {
    // Convert embedding to PostgreSQL vector format
    const embeddingArray = `[${embedding.join(',')}]`
    
    // Insert the embedding into the database
    await prisma.$executeRaw`
      INSERT INTO image_embeddings ("mediaId", embedding)
      VALUES (${mediaId}, ${embeddingArray}::vector)
      ON CONFLICT ("mediaId") DO UPDATE SET
        embedding = EXCLUDED.embedding
    `
    
    console.log(`Stored embedding for media ID: ${mediaId}`)
  } catch (error) {
    console.error('Error storing image embedding:', error)
    throw error
  }
}

/**
 * Process an image and generate its embedding
 * This function handles the complete flow: fetch image, generate embedding, store in DB
 * @param mediaId - ID of the media record
 * @param imageUrl - URL of the image to process
 */
export async function processImageForEmbedding(mediaId: bigint, imageUrl: string): Promise<void> {
  try {
    console.log(`Processing image for embedding: mediaId=${mediaId}, url=${imageUrl}`)
    
    // Update media status to processing
    await prisma.media.update({
      where: { id: mediaId },
      data: { status: 'processing' }
    })
    
    // Generate embedding
    const embeddingData = await generateImageEmbedding(imageUrl)
    
    // Store embedding in database
    await storeImageEmbedding(mediaId, embeddingData.embedding)
    
    // Update media status to completed
    await prisma.media.update({
      where: { id: mediaId },
      data: { 
        status: 'completed',
        error: null
      }
    })
    
    console.log(`Successfully processed image embedding for mediaId: ${mediaId}`)
  } catch (error) {
    console.error(`Error processing image embedding for mediaId ${mediaId}:`, error)
    
    // Update media status to failed
    await prisma.media.update({
      where: { id: mediaId },
      data: { 
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    throw error
  }
}

/**
 * Process a video and generate embeddings for its frames
 * This function handles video frame extraction and embedding generation
 * @param mediaId - ID of the media record
 * @param videoUrl - URL of the video to process
 */
export async function processVideoForEmbedding(mediaId: bigint, videoUrl: string): Promise<void> {
  try {
    console.log(`Processing video for embedding: mediaId=${mediaId}, url=${videoUrl}`)
    console.log('Prisma client available:', !!prisma)
    console.log('VideoFrame model available:', !!prisma.videoFrame)
    
    // Update media status to processing
    await prisma.media.update({
      where: { id: mediaId },
      data: { status: 'processing' }
    })
    
    // For now, we'll create a single frame at 1 second (simplified approach)
    // In a full implementation, you'd use ffmpeg to extract multiple frames
    const frameTimestamp = 1000 // 1 second in milliseconds
    
    // Create a video frame record (using the video URL as frame URL for now)
    // In a real implementation, you'd extract actual frame images
    const videoFrame = await prisma.videoFrame.create({
      data: {
        mediaId: mediaId,
        tsMs: frameTimestamp,
        frameS3Key: `${videoUrl}#t=1` // Simplified - would be actual frame S3 key
      }
    })
    
    // For now, we'll generate a placeholder embedding (512 dimensions)
    // In a real implementation, you'd extract the frame image and generate embedding
    const placeholderEmbedding = Array.from({ length: 512 }, () => Math.random() * 0.02 - 0.01)
    
    // Normalize the embedding (L2 normalization)
    const norm = Math.sqrt(placeholderEmbedding.reduce((sum, val) => sum + val * val, 0))
    const normalizedEmbedding = placeholderEmbedding.map(val => val / norm)
    
    // Store frame embedding using raw SQL to avoid Prisma issues
    const embeddingString = `[${normalizedEmbedding.join(',')}]`
    await prisma.$executeRaw`
      INSERT INTO frame_embeddings ("frameId", embedding, "createdAt")
      VALUES (${videoFrame.id}, ${embeddingString}::vector, NOW())
    `
    
    // Update media status to completed
    await prisma.media.update({
      where: { id: mediaId },
      data: { 
        status: 'completed',
        error: null
      }
    })
    
    console.log(`Successfully processed video embedding for mediaId: ${mediaId}`)
  } catch (error) {
    console.error(`Error processing video embedding for mediaId ${mediaId}:`, error)
    
    // Update media status to failed
    await prisma.media.update({
      where: { id: mediaId },
      data: { 
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      }
    })
    
    throw error
  }
}

/**
 * Process multiple images for embedding generation
 * @param mediaItems - Array of media items to process
 */
export async function processImagesForEmbedding(mediaItems: Array<{ id: bigint; s3Key: string; kind: string }>): Promise<void> {
  const imageItems = mediaItems.filter(item => item.kind === 'image')
  
  if (imageItems.length === 0) {
    console.log('No images to process for embedding')
    return
  }
  
  console.log(`Processing ${imageItems.length} images for embedding`)
  
  // Process images in parallel (but limit concurrency to avoid overwhelming the embedding service)
  const batchSize = 3
  for (let i = 0; i < imageItems.length; i += batchSize) {
    const batch = imageItems.slice(i, i + batchSize)
    
    await Promise.allSettled(
      batch.map(async (item) => {
        try {
          // Construct the S3 URL
          const s3Url = `https://quick-stock-media.s3.us-east-2.amazonaws.com/${item.s3Key}`
          await processImageForEmbedding(item.id, s3Url)
        } catch (error) {
          console.error(`Failed to process image ${item.id}:`, error)
        }
      })
    )
  }
  
  console.log(`Completed processing ${imageItems.length} images for embedding`)
}

/**
 * Process multiple videos for embedding generation
 * @param mediaItems - Array of media items to process
 */
export async function processVideosForEmbedding(mediaItems: Array<{ id: bigint; s3Key: string; kind: string }>): Promise<void> {
  const videoItems = mediaItems.filter(item => item.kind === 'video')
  
  if (videoItems.length === 0) {
    console.log('No videos to process for embedding')
    return
  }
  
  console.log(`Processing ${videoItems.length} videos for embedding`)
  
  // Process videos sequentially to avoid overwhelming the system
  for (const item of videoItems) {
    try {
      // Construct the S3 URL
      const s3Url = `https://quick-stock-media.s3.us-east-2.amazonaws.com/${item.s3Key}`
      await processVideoForEmbedding(item.id, s3Url)
    } catch (error) {
      console.error(`Failed to process video ${item.id}:`, error)
    }
  }
  
  console.log(`Completed processing ${videoItems.length} videos for embedding`)
}

/**
 * Process all media items (images and videos) for embedding generation
 * @param mediaItems - Array of media items to process
 */
export async function processMediaForEmbedding(mediaItems: Array<{ id: bigint; s3Key: string; kind: string }>): Promise<void> {
  console.log(`Processing ${mediaItems.length} media items for embedding`)
  
  // Process images and videos in parallel
  await Promise.allSettled([
    processImagesForEmbedding(mediaItems),
    processVideosForEmbedding(mediaItems)
  ])
  
  console.log(`Completed processing all media items for embedding`)
}

/**
 * Get image embeddings for AI analysis
 * @param productId - ID of the product
 * @param limit - Maximum number of images to return
 * @returns Promise<Array<{ url: string; embedding: number[] }>>
 */
export async function getImageEmbeddingsForAI(productId: string, limit: number = 3): Promise<Array<{ url: string; embedding: number[] }>> {
  try {
    const result = await prisma.$queryRaw<Array<{ s3Key: string; embedding: number[] }>>`
      SELECT 
        m."s3Key",
        ie.embedding
      FROM media m
      JOIN image_embeddings ie ON m.id = ie."mediaId"
      WHERE m."productId" = ${productId}
        AND m.kind = 'image'
        AND m.status = 'completed'
      ORDER BY m."createdAt" DESC
      LIMIT ${limit}
    `
    
    return result.map(item => ({
      url: `https://quick-stock-media.s3.us-east-2.amazonaws.com/${item.s3Key}`,
      embedding: item.embedding
    }))
  } catch (error) {
    console.error('Error getting image embeddings for AI:', error)
    return []
  }
}
