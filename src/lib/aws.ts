import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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

// Generate S3 key for file upload with proper folder structure
export function generateS3Key(
  fileName: string, 
  clientId: string, 
  sku: string, 
  fileType: 'image' | 'video' = 'image'
): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = fileName.split('.').pop()
  
  // Clean SKU to be filesystem-safe (remove special characters)
  const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
  
  // Structure: clients/{clientId}/products/{sku}/media/{fileType}/{timestamp}-{random}.{ext}
  return `clients/${clientId}/products/${cleanSku}/media/${fileType}/${timestamp}-${randomString}.${extension}`
}

// Generate thumbnail S3 key
export function generateThumbnailS3Key(
  fileName: string, 
  clientId: string, 
  sku: string
): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  
  // Clean SKU to be filesystem-safe
  const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
  
  // Structure: clients/{clientId}/products/{sku}/media/thumbnails/{timestamp}-{random}.jpg
  return `clients/${clientId}/products/${cleanSku}/media/thumbnails/${timestamp}-${randomString}.jpg`
}

// Generate folder path for a product's media
export function generateProductMediaFolder(clientId: string, sku: string): string {
  const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
  return `clients/${clientId}/products/${cleanSku}/media`
}

// Generate signed URL for private files
export async function generateSignedUrl(key: string, expiresIn: number = 3600, region?: string): Promise<string> {
  try {
    console.log('Generating signed URL for:', {
      key,
      expiresIn,
      region,
      bucket: S3_BUCKET_NAME,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    })
    
    // Use the provided region or default to the configured region
    const targetRegion = region || AWS_REGION
    
    // Create a new S3 client for the specific region if different
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
    
    const signedUrl = await getSignedUrl(client, command, { expiresIn })
    console.log('Generated signed URL successfully:', {
      key,
      signedUrl: signedUrl.substring(0, 100) + '...',
      hasSignature: signedUrl.includes('X-Amz-Signature')
    })
    
    return signedUrl
  } catch (error: any) {
    console.error('Error generating signed URL:', {
      key,
      error: error.message,
      stack: error.stack,
      bucket: S3_BUCKET_NAME,
      region: region || AWS_REGION
    })
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
      const urlDate = new Date(date)
      const expirationTime = new Date(urlDate.getTime() + (expiresIn * 1000))
      const now = new Date()
      const timeUntilExpiry = expirationTime.getTime() - now.getTime()
      
      // Consider expired if less than 1 day (86400000 ms) remaining
      return timeUntilExpiry < 86400000
    }
    return true // If no expiration info, consider expired
  } catch (error) {
    console.error('Error checking URL expiration:', error)
    return true // If error parsing, consider expired
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

// Refresh signed URLs for existing media
export async function refreshMediaUrls(media: any[]): Promise<any[]> {
  try {
    console.log('Refreshing media URLs for', media.length, 'items')
    const refreshedMedia = await Promise.all(
      media.map(async (item, index) => {
        if (item.key) {
          try {
            // Check if URL is a direct S3 URL (not signed) or expired
            const isDirectS3Url = item.url && item.url.includes('.s3.') && !item.url.includes('X-Amz-Signature')
            const shouldRefresh = !item.url || isUrlExpired(item.url) || isDirectS3Url
            console.log(`Item ${index}: shouldRefresh=${shouldRefresh}, hasUrl=${!!item.url}, isDirectS3Url=${isDirectS3Url}`)
            
            if (shouldRefresh) {
              console.log(`Refreshing URLs for item ${index} with key:`, item.key)
              
              // Always use the current configured region instead of extracting from old URL
              const region = AWS_REGION // Use current configured region
              console.log(`Item ${index} using current region:`, region)
              console.log(`AWS_REGION constant value:`, AWS_REGION)
              console.log(`process.env.AWS_REGION:`, process.env.AWS_REGION)
              
              const newUrl = await generateSignedUrl(item.key, 7 * 24 * 60 * 60, region) // 7 days
              const newThumbnailUrl = item.thumbnailKey 
                ? await generateSignedUrl(item.thumbnailKey, 7 * 24 * 60 * 60, region) // 7 days
                : undefined
              
              console.log(`Successfully refreshed URLs for item ${index}`)
              console.log(`Old URL: ${item.url}`)
              console.log(`New URL: ${newUrl}`)
              return {
                ...item,
                url: newUrl,
                thumbnailUrl: newThumbnailUrl || item.thumbnailUrl
              }
            }
            
            console.log(`No refresh needed for item ${index}`)
            return item // Return original if no refresh needed
          } catch (error) {
            console.error('Error refreshing URL for key:', item.key, error)
            return item // Return original if refresh fails
          }
        }
        console.log(`Item ${index} has no key, skipping`)
        return item
      })
    )
    console.log('Media URL refresh completed')
    return refreshedMedia
  } catch (error) {
    console.error('Error refreshing media URLs:', error)
    return media // Return original if refresh fails
  }
}
