import { randomBytes } from 'crypto'

/**
 * Generate a unique filename for media assets
 * Format: {timestamp}-{uuid}-{sanitized-original-name}.{extension}
 * 
 * @param originalName - The original filename
 * @param prefix - Optional prefix for the filename
 * @returns Unique filename
 */
export function generateUniqueFileName(originalName: string, prefix?: string): string {
  // Extract file extension
  const lastDotIndex = originalName.lastIndexOf('.')
  const extension = lastDotIndex > 0 ? originalName.substring(lastDotIndex) : ''
  const nameWithoutExt = lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName
  
  // Generate timestamp
  const timestamp = Date.now()
  
  // Generate UUID-like string (8 characters)
  const uuid = randomBytes(4).toString('hex')
  
  // Sanitize original name (remove special characters, limit length)
  const sanitizedName = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length to 50 characters
  
  // Build the unique filename
  const parts = [timestamp.toString(), uuid]
  if (prefix) {
    parts.unshift(prefix)
  }
  if (sanitizedName) {
    parts.push(sanitizedName)
  }
  
  return `${parts.join('-')}${extension}`
}

/**
 * Generate a unique filename with descriptive prefix
 * 
 * @param originalName - The original filename
 * @param fileType - Type of file (image, video, audio, document)
 * @param clientId - Client ID for additional uniqueness
 * @returns Unique filename with descriptive prefix
 */
export function generateDescriptiveFileName(
  originalName: string, 
  fileType: 'image' | 'video' | 'audio' | 'document',
  clientId?: string
): string {
  // Create descriptive prefix based on file type
  const typePrefix = fileType.charAt(0).toUpperCase() + fileType.slice(1)
  
  // Add client prefix if provided
  const prefix = clientId ? `${clientId.slice(-4)}-${typePrefix}` : typePrefix
  
  return generateUniqueFileName(originalName, prefix)
}

/**
 * Generate a unique filename for media assets with product context
 * 
 * @param originalName - The original filename
 * @param fileType - Type of file (image, video, audio, document)
 * @param sku - Product SKU for context
 * @param clientId - Client ID for additional uniqueness
 * @returns Unique filename with product context
 */
export function generateProductMediaFileName(
  originalName: string,
  fileType: 'image' | 'video' | 'audio' | 'document',
  sku: string,
  clientId?: string
): string {
  // Clean SKU for filename
  const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase().substring(0, 20)
  
  // Create prefix with product context
  const prefix = clientId ? `${clientId.slice(-4)}-${cleanSku}-${fileType}` : `${cleanSku}-${fileType}`
  
  return generateUniqueFileName(originalName, prefix)
}

/**
 * Generate a unique filename for bulk uploads
 * 
 * @param originalName - The original filename
 * @param fileType - Type of file (image, video, audio, document)
 * @param folder - Upload folder name
 * @param clientId - Client ID for additional uniqueness
 * @returns Unique filename for bulk uploads
 */
export function generateBulkUploadFileName(
  originalName: string,
  fileType: 'image' | 'video' | 'audio' | 'document',
  folder: string,
  clientId?: string
): string {
  // Clean folder name
  const cleanFolder = folder.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase().substring(0, 15)
  
  // Create prefix with folder context
  const prefix = clientId ? `${clientId.slice(-4)}-${cleanFolder}-${fileType}` : `${cleanFolder}-${fileType}`
  
  return generateUniqueFileName(originalName, prefix)
}

/**
 * Extract metadata from unique filename
 * 
 * @param uniqueFileName - The unique filename
 * @returns Parsed metadata
 */
export function parseUniqueFileName(uniqueFileName: string): {
  timestamp: number | null
  uuid: string | null
  originalName: string | null
  extension: string
  prefix: string | null
} {
  const lastDotIndex = uniqueFileName.lastIndexOf('.')
  const extension = lastDotIndex > 0 ? uniqueFileName.substring(lastDotIndex) : ''
  const nameWithoutExt = lastDotIndex > 0 ? uniqueFileName.substring(0, lastDotIndex) : uniqueFileName
  
  const parts = nameWithoutExt.split('-')
  
  let timestamp: number | null = null
  let uuid: string | null = null
  let originalName: string | null = null
  let prefix: string | null = null
  
  if (parts.length >= 2) {
    // Look for timestamp pattern (13 digits)
    let timestampIndex = -1
    for (let i = 0; i < parts.length; i++) {
      if (/^\d{13}$/.test(parts[i])) {
        timestampIndex = i
        timestamp = parseInt(parts[i])
        break
      }
    }
    
    if (timestampIndex >= 0) {
      // Found timestamp, look for UUID pattern (8 hex characters)
      if (timestampIndex + 1 < parts.length && /^[a-f0-9]{8}$/.test(parts[timestampIndex + 1])) {
        uuid = parts[timestampIndex + 1]
        
        // Everything before timestamp is prefix
        if (timestampIndex > 0) {
          prefix = parts.slice(0, timestampIndex).join('-')
        }
        
        // Everything after UUID is original name
        if (timestampIndex + 2 < parts.length) {
          originalName = parts.slice(timestampIndex + 2).join('-')
        }
      } else {
        // No UUID found, everything before timestamp is prefix, after is original name
        if (timestampIndex > 0) {
          prefix = parts.slice(0, timestampIndex).join('-')
        }
        if (timestampIndex + 1 < parts.length) {
          originalName = parts.slice(timestampIndex + 1).join('-')
        }
      }
    } else {
      // No timestamp found, treat first part as prefix if it's not numeric
      if (parts.length > 0 && !/^\d+$/.test(parts[0])) {
        prefix = parts[0]
        if (parts.length > 1) {
          originalName = parts.slice(1).join('-')
        }
      } else {
        // No clear structure, treat as original name
        originalName = nameWithoutExt
      }
    }
  }
  
  return {
    timestamp,
    uuid,
    originalName,
    extension,
    prefix
  }
}
