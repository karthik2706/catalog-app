import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { generateProductMediaFileName, generateBulkUploadFileName } from './unique-naming'

// AWS S3 Configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'quick-stock-media'
export const AWS_REGION = process.env.AWS_REGION || 'us-east-2'

// S3 Configuration Constants
export const S3_CONFIG = {
  bucket: S3_BUCKET_NAME,
  region: AWS_REGION,
  baseUrl: `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`,
  allowedFileTypes: {
    images: ['image/jpeg', 'image/png', 'image/webp'],
    videos: ['video/mp4', 'video/webm'],
  },
  maxFileSize: 50 * 1024 * 1024, // 50MB
  imageOptimization: {
    quality: 85,
    maxWidth: 1920,
    maxHeight: 1080,
    thumbnailWidth: 300,
    thumbnailHeight: 300,
  },
}

// Function to get current S3 configuration (useful for client-side components)
export function getCurrentS3Config() {
  return {
    bucket: process.env.S3_BUCKET_NAME || 'quick-stock-media',
    region: process.env.AWS_REGION || 'us-east-1',
    baseUrl: `https://${process.env.S3_BUCKET_NAME || 'quick-stock-media'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
  }
}

// File validation helper
export function validateFileType(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    ...S3_CONFIG.allowedFileTypes.images,
    ...S3_CONFIG.allowedFileTypes.videos,
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }
  
  if (file.size > S3_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${S3_CONFIG.maxFileSize / 1024 / 1024}MB`
    }
  }
  
  return { valid: true }
}

// Generate S3 key for file upload with proper folder structure and unique naming
export function generateS3Key(
  fileName: string, 
  clientId: string, 
  sku: string, 
  fileType: 'image' | 'video' = 'image'
): string {
  // Generate unique filename with product context
  const uniqueFileName = generateProductMediaFileName(fileName, fileType, sku, clientId)
  
  // Clean SKU to be filesystem-safe (remove special characters)
  const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
  
  // Structure: clients/{clientId}/products/{sku}/media/{fileType}/{unique-filename}
  return `clients/${clientId}/products/${cleanSku}/media/${fileType}/${uniqueFileName}`
}

// Generate thumbnail S3 key with unique naming
export function generateThumbnailS3Key(
  fileName: string, 
  clientId: string, 
  sku: string
): string {
  // Generate unique filename for thumbnail (always .jpg)
  const uniqueFileName = generateProductMediaFileName(fileName, 'image', sku, clientId)
  const thumbnailFileName = uniqueFileName.replace(/\.[^/.]+$/, '.jpg')
  
  // Clean SKU to be filesystem-safe
  const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
  
  // Structure: clients/{clientId}/products/{sku}/media/thumbnails/{unique-filename}
  return `clients/${clientId}/products/${cleanSku}/media/thumbnails/${thumbnailFileName}`
}

// Generate folder path for a product's media
export function generateProductMediaFolder(clientId: string, sku: string): string {
  const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
  return `clients/${clientId}/products/${cleanSku}/media`
}

// Generate signed URL for private files
export async function generateSignedUrl(key: string, expiresIn: number = 3600, region?: string): Promise<string> {
  try {
    const targetRegion = region || AWS_REGION
    const client = targetRegion === AWS_REGION ? s3Client : new S3Client({
      region: targetRegion,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    })
    return await getSignedUrl(client, command, { expiresIn })
  } catch (error: any) {
    console.error('Error generating signed URL:', error.message)
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }
}

// Check if a signed URL is expired or about to expire (within 1 day)
export function isUrlExpired(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const expires = urlObj.searchParams.get('X-Amz-Expires')
    const date = urlObj.searchParams.get('X-Amz-Date')
    
    if (expires && date) {
      const expiresIn = parseInt(expires)
      // Parse AWS date format: 20250921T135252Z -> 2025-09-21T13:52:52Z
      const formattedDate = date.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
      const urlDate = new Date(formattedDate)
      const expirationTime = new Date(urlDate.getTime() + (expiresIn * 1000))
      const now = new Date()
      const timeUntilExpiry = expirationTime.getTime() - now.getTime()
      // Consider expired if less than 1 day (86400000 ms) remaining
      return timeUntilExpiry < 86400000
    }
    return true // If no expiration info, consider expired
  } catch {
    return true
  }
}

// Extract region from S3 URL
function extractRegionFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    // Extract region from hostname like: bucket.s3.region.amazonaws.com
    const match = hostname.match(/\.s3\.([^.]+)\.amazonaws\.com/)
    return match ? match[1] : null
  } catch (error) {
    console.error('Error extracting region from URL:', error)
    return null
  }
}

// Helper function to extract S3 key from signed URL
function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // Remove leading slash and decode URI components
    const key = decodeURIComponent(urlObj.pathname.substring(1))
    return key || null
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error)
    return null
  }
}

// Refresh signed URLs for existing media
export async function refreshMediaUrls(media: any[]): Promise<any[]> {
  try {
    const refreshedMedia = await Promise.all(
      media.map(async (item) => {
        if (!item.key) return item
        try {
          const isDirectS3Url = item.url && item.url.includes('.s3.') && !item.url.includes('X-Amz-Signature')
          const isMainUrlExpired = item.url && isUrlExpired(item.url)
          const isThumbnailExpired = item.thumbnailUrl && isUrlExpired(item.thumbnailUrl)
          const shouldRefresh = !item.url || isMainUrlExpired || isDirectS3Url || isThumbnailExpired
          if (!shouldRefresh) return item

          const region = AWS_REGION
          const newUrl = await generateSignedUrl(item.key, 7 * 24 * 60 * 60, region)
          let newThumbnailUrl: string | undefined
          if (item.thumbnailKey) {
            newThumbnailUrl = await generateSignedUrl(item.thumbnailKey, 7 * 24 * 60 * 60, region)
          } else if (item.thumbnailUrl) {
            try {
              const thumbnailKey = extractS3KeyFromUrl(item.thumbnailUrl)
              if (thumbnailKey) {
                newThumbnailUrl = await generateSignedUrl(thumbnailKey, 7 * 24 * 60 * 60, region)
              }
            } catch {
              // ignore
            }
          }
          return {
            ...item,
            url: newUrl,
            thumbnailUrl: newThumbnailUrl ?? item.thumbnailUrl
          }
        } catch {
          return item
        }
      })
    )
    return refreshedMedia
  } catch (error: any) {
    console.error('Error refreshing media URLs:', error?.message)
    return media
  }
}
