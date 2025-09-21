import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client, S3_BUCKET_NAME, generateS3Key, generateThumbnailS3Key, generateSignedUrl } from './aws'
import sharp from 'sharp'

/**
 * S3 Upload Module - 100% Quality Preservation
 * 
 * This module is configured to maintain 100% original quality for all uploaded
 * images and videos. No compression, resizing, or quality reduction is applied
 * to the main files. Only thumbnails are compressed for preview purposes.
 */

export interface UploadResult {
  success: boolean
  url?: string
  thumbnailUrl?: string
  key?: string
  error?: string
}

export interface ProcessedFile {
  buffer: Buffer
  thumbnailBuffer?: Buffer
  contentType: string
  originalName: string
}

// Configuration for image processing
export const IMAGE_PROCESSING_CONFIG = {
  // Set to true to skip all image processing for maximum quality
  SKIP_PROCESSING: true, // Always skip processing for 100% quality
  // Maximum file size in KB to skip processing (unlimited for quality)
  MAX_SKIP_SIZE_KB: 999999,
  // Maximum dimensions to skip processing (unlimited for quality)
  MAX_SKIP_WIDTH: 99999,
  MAX_SKIP_HEIGHT: 99999,
  // Quality settings (not used when SKIP_PROCESSING is true)
  JPEG_QUALITY: 100,
  PNG_QUALITY: 100,
  WEBP_QUALITY: 100,
  THUMBNAIL_QUALITY: 90, // Only thumbnails get compressed
  // Resize threshold (not used when SKIP_PROCESSING is true)
  RESIZE_THRESHOLD: 99999
}

// Process and optimize image files
export async function processImageFile(
  file: Buffer,
  originalName: string,
  contentType: string
): Promise<ProcessedFile> {
  try {
    // Skip all processing to maintain 100% original quality
    if (IMAGE_PROCESSING_CONFIG.SKIP_PROCESSING) {
      console.log('Preserving 100% original quality - no processing:', originalName)
      // Only create thumbnail for preview purposes (this is compressed)
      const thumbnailBuffer = await sharp(file)
        .resize(400, 400, { fit: 'cover', withoutEnlargement: true })
        .jpeg({ quality: IMAGE_PROCESSING_CONFIG.THUMBNAIL_QUALITY, progressive: true })
        .toBuffer()
      
      return {
        buffer: file, // Original file with 100% quality
        thumbnailBuffer, // Compressed thumbnail for preview
        contentType, // Original content type preserved
        originalName,
      }
    }

    let image = sharp(file)
    const metadata = await image.metadata()
    
    // Check if image is already optimized
    const fileSizeKB = file.length / 1024
    const isAlreadyOptimized = fileSizeKB < IMAGE_PROCESSING_CONFIG.MAX_SKIP_SIZE_KB && 
      metadata.width && metadata.width <= IMAGE_PROCESSING_CONFIG.MAX_SKIP_WIDTH && 
      metadata.height && metadata.height <= IMAGE_PROCESSING_CONFIG.MAX_SKIP_HEIGHT
    
    let optimizedBuffer: Buffer
    let finalContentType = contentType
    
    if (isAlreadyOptimized) {
      // Skip processing for already optimized images
      console.log('Image already optimized, skipping processing:', originalName)
      optimizedBuffer = file
    } else {
      // Only resize if extremely large
      if (metadata.width && metadata.width > IMAGE_PROCESSING_CONFIG.RESIZE_THRESHOLD) {
        image = image.resize(IMAGE_PROCESSING_CONFIG.RESIZE_THRESHOLD, 2160, { fit: 'inside', withoutEnlargement: true })
      }
      
      // Preserve original format and quality
      if (contentType === 'image/png') {
        // Keep PNG format with high quality
        optimizedBuffer = await image
          .png({ quality: IMAGE_PROCESSING_CONFIG.PNG_QUALITY, compressionLevel: 6 })
          .toBuffer()
      } else if (contentType === 'image/webp') {
        // Keep WebP format with high quality
        optimizedBuffer = await image
          .webp({ quality: IMAGE_PROCESSING_CONFIG.WEBP_QUALITY })
          .toBuffer()
      } else {
        // For JPEG and other formats, use high quality JPEG
        optimizedBuffer = await image
          .jpeg({ 
            quality: IMAGE_PROCESSING_CONFIG.JPEG_QUALITY, 
            progressive: true, 
            mozjpeg: true 
          })
          .toBuffer()
        finalContentType = 'image/jpeg'
      }
    }
    
    // Create high-quality thumbnail (always create this)
    const thumbnailBuffer = await sharp(file)
      .resize(400, 400, { fit: 'cover', withoutEnlargement: true })
      .jpeg({ quality: IMAGE_PROCESSING_CONFIG.THUMBNAIL_QUALITY, progressive: true })
      .toBuffer()
    
    return {
      buffer: optimizedBuffer,
      thumbnailBuffer,
      contentType: finalContentType,
      originalName,
    }
  } catch (error) {
    throw new Error(`Failed to process image: ${error.message}`)
  }
}

// Process video files - NO PROCESSING to maintain 100% original quality
export async function processVideoFile(
  file: Buffer,
  originalName: string,
  contentType: string
): Promise<ProcessedFile> {
  // Return original video file without any processing to maintain 100% quality
  // Note: Video thumbnails would require a video processing library like ffmpeg
  return {
    buffer: file, // Original video with 100% quality
    contentType,
    originalName,
  }
}

/**
 * Extract a thumbnail frame from a video buffer
 * @param videoBuffer - The video file buffer
 * @param originalName - Original filename for naming the thumbnail
 * @returns Promise<ProcessedFile> - The extracted thumbnail as a JPEG image
 */
export async function extractVideoThumbnail(
  videoBuffer: Buffer,
  originalName: string
): Promise<ProcessedFile> {
  try {
    // Import the improved video thumbnail generator
    const { extractVideoThumbnail: generateThumbnail } = await import('./video-thumbnail-generator')
    
    // Use the improved thumbnail generation
    return await generateThumbnail(videoBuffer, originalName)
  } catch (error) {
    console.error('Error extracting video thumbnail:', error)
    
    // Fallback to simple placeholder if import fails
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    const thumbnailName = `${nameWithoutExt}-thumbnail.png`
    
    // Create a minimal 200x150 placeholder as fallback
    const fallbackPng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0xC8, // Width: 200
      0x00, 0x00, 0x00, 0x96, // Height: 150
      0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 2 (RGB)
      0x4C, 0x5D, 0x00, 0x5E, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x2D, 0x37, 0x48, // Compressed dark gray data
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ])
    
    console.log(`Generated fallback thumbnail for video: ${originalName} -> ${thumbnailName}`)
    
    return {
      buffer: fallbackPng,
      contentType: 'image/png',
      originalName: thumbnailName,
    }
  }
}

/**
 * Upload video with automatic thumbnail generation
 * @param videoFile - The processed video file
 * @param videoBuffer - Original video buffer for thumbnail extraction
 * @param clientId - Client ID for S3 path
 * @param sku - Product SKU for S3 path
 * @returns Promise<{video: UploadResult, thumbnail: UploadResult}> - Both video and thumbnail upload results
 */
export async function uploadVideoWithThumbnail(
  videoFile: ProcessedFile,
  videoBuffer: Buffer,
  clientId: string,
  sku: string
): Promise<{video: UploadResult, thumbnail: UploadResult}> {
  try {
    console.log(`Uploading video with thumbnail generation for SKU: ${sku}`)
    
    // Upload the video first
    const videoResult = await uploadToS3(videoFile, clientId, sku, 'video')
    console.log(`Video uploaded successfully: ${videoResult.key}`)
    
    // Extract and upload thumbnail
    const thumbnailFile = await extractVideoThumbnail(videoBuffer, videoFile.originalName)
    const thumbnailResult = await uploadToS3(thumbnailFile, clientId, sku, 'image')
    console.log(`Thumbnail uploaded successfully: ${thumbnailResult.key}`)
    
    return {
      video: videoResult,
      thumbnail: thumbnailResult
    }
  } catch (error) {
    console.error('Error uploading video with thumbnail:', error)
    throw new Error(`Failed to upload video with thumbnail: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Upload file to S3
export async function uploadToS3(
  file: ProcessedFile,
  clientId: string,
  sku: string,
  fileType: 'image' | 'video' = 'image'
): Promise<UploadResult> {
  try {
    const key = generateS3Key(file.originalName, clientId, sku, fileType)
    
            // Upload main file
            const uploadCommand = new PutObjectCommand({
              Bucket: S3_BUCKET_NAME,
              Key: key,
              Body: file.buffer,
              ContentType: file.contentType,
              // Removed ACL as bucket doesn't support it
            })
    
    await s3Client.send(uploadCommand)
    
    // Generate signed URL for public access (valid for 7 days - AWS max)
    const url = await generateSignedUrl(key, 7 * 24 * 60 * 60) // 7 days
    
    // Upload thumbnail if available
    let thumbnailUrl: string | undefined
    if (file.thumbnailBuffer) {
      const thumbnailKey = generateThumbnailS3Key(file.originalName, clientId, sku)
      const thumbnailCommand = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: thumbnailKey,
        Body: file.thumbnailBuffer,
        ContentType: 'image/jpeg',
        // Removed ACL as bucket doesn't support it
      })
      
      await s3Client.send(thumbnailCommand)
      // Generate signed URL for thumbnail (valid for 7 days - AWS max)
      thumbnailUrl = await generateSignedUrl(thumbnailKey, 7 * 24 * 60 * 60) // 7 days
    }
    
    return {
      success: true,
      url,
      thumbnailUrl,
      key,
    }
  } catch (error) {
    console.error('S3 upload error:', error)
    return {
      success: false,
      error: `Upload failed: ${error.message}`,
    }
  }
}


// Delete file from S3
export async function deleteFromS3(key: string): Promise<boolean> {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    })
    
    await s3Client.send(command)
    return true
  } catch (error) {
    console.error('S3 delete error:', error)
    return false
  }
}
