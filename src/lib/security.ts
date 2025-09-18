import sharp from 'sharp';
import exifr from 'exifr';
import { createLogger } from './log';

const log = createLogger();

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  stripMetadata?: boolean;
  stripExif?: boolean;
}

export interface ProcessedImage {
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    hasExif: boolean;
  };
}

/**
 * Strip EXIF data and process image for security
 */
export async function processImageForSecurity(
  inputBuffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 85,
    format = 'jpeg',
    stripMetadata = true,
    stripExif = true,
  } = options;

  try {
    // Check for EXIF data before processing
    let hasExif = false;
    if (stripExif) {
      try {
        const exifData = await exifr.parse(inputBuffer);
        hasExif = !!exifData;
        if (hasExif) {
          log.info('EXIF data detected and will be stripped', {
            exifKeys: Object.keys(exifData || {}),
          });
        }
      } catch (error) {
        // EXIF parsing failed, continue without stripping
        log.debug('EXIF parsing failed, continuing without EXIF data', { error });
      }
    }

    // Process image with Sharp
    let sharpInstance = sharp(inputBuffer);

    // Resize if needed
    sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Convert format and set quality
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ 
          quality,
          progressive: true,
          mozjpeg: true, // Better compression
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ 
          quality,
          progressive: true,
        });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ 
          quality,
          effort: 6, // Higher effort for better compression
        });
        break;
    }

    // Strip metadata if requested
    if (stripMetadata) {
      sharpInstance = sharpInstance.withMetadata({
        exif: stripExif ? {} : undefined, // Strip EXIF if requested
        iptc: {}, // Strip IPTC
        xmp: {}, // Strip XMP
        icc: undefined, // Strip ICC color profile
      });
    }

    // Process the image
    const processedBuffer = await sharpInstance.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: processedBuffer.length,
        hasExif: hasExif,
      },
    };
  } catch (error) {
    log.error('Image processing failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to process image for security');
  }
}

/**
 * Validate image file for security
 */
export async function validateImageSecurity(
  buffer: Buffer,
  filename: string,
  maxSize: number = 10 * 1024 * 1024 // 10MB
): Promise<{ valid: boolean; reason?: string }> {
  try {
    // Check file size
    if (buffer.length > maxSize) {
      return {
        valid: false,
        reason: `File size ${Math.round(buffer.length / 1024 / 1024)}MB exceeds maximum ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    // Check if it's a valid image
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      return {
        valid: false,
        reason: 'Invalid image file',
      };
    }

    // Check dimensions (prevent extremely large images)
    if (metadata.width > 10000 || metadata.height > 10000) {
      return {
        valid: false,
        reason: 'Image dimensions too large',
      };
    }

    // Check for suspicious patterns in filename
    const suspiciousPatterns = [
      /\.\./, // Path traversal
      /<script/i, // Script injection
      /javascript:/i, // JavaScript protocol
      /data:/i, // Data URI
      /vbscript:/i, // VBScript protocol
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(filename)) {
        return {
          valid: false,
          reason: 'Suspicious filename pattern detected',
        };
      }
    }

    return { valid: true };
  } catch (error) {
    log.error('Image validation failed', {
      error: error instanceof Error ? error.message : String(error),
      filename,
    });
    return {
      valid: false,
      reason: 'Failed to validate image',
    };
  }
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(
  originalFilename: string,
  prefix: string = 'media'
): string {
  // Remove path traversal and special characters
  const sanitized = originalFilename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/^\.+/, '') // Remove leading dots
    .toLowerCase();

  // Generate timestamp and random string
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  // Get extension
  const extension = sanitized.split('.').pop() || 'bin';
  
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Sanitize S3 key for security
 */
export function sanitizeS3Key(key: string): string {
  return key
    .replace(/[^a-zA-Z0-9/._-]/g, '_') // Replace special chars
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/^\/+/, '') // Remove leading slashes
    .replace(/\/+/g, '/') // Replace multiple slashes with single
    .toLowerCase();
}

/**
 * Validate S3 key for security
 */
export function validateS3Key(key: string): { valid: boolean; reason?: string } {
  // Check for path traversal
  if (key.includes('..') || key.includes('//')) {
    return {
      valid: false,
      reason: 'Path traversal detected in S3 key',
    };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(key)) {
      return {
        valid: false,
        reason: 'Suspicious pattern detected in S3 key',
      };
    }
  }

  // Check length
  if (key.length > 1024) {
    return {
      valid: false,
      reason: 'S3 key too long',
    };
  }

  return { valid: true };
}

/**
 * Generate secure presigned URL with restrictions
 */
export function generateSecurePresignedUrl(
  s3Client: any,
  bucket: string,
  key: string,
  operation: 'getObject' | 'putObject',
  expiresIn: number = 3600,
  additionalConditions: any = {}
): Promise<string> {
  const conditions = {
    // Content type restrictions
    'Content-Type': ['image/jpeg', 'image/png', 'image/webp'],
    // Size restrictions (10MB max)
    'content-length-range': [1, 10 * 1024 * 1024],
    // Additional conditions
    ...additionalConditions,
  };

  const params = {
    Bucket: bucket,
    Key: key,
    Expires: expiresIn,
    Conditions: conditions,
  };

  if (operation === 'getObject') {
    return s3Client.getSignedUrl('getObject', params);
  } else {
    return s3Client.getSignedUrl('putObject', params);
  }
}

/**
 * Check for malicious file content
 */
export async function scanForMaliciousContent(buffer: Buffer): Promise<{
  safe: boolean;
  threats: string[];
}> {
  const threats: string[] = [];
  
  try {
    // Convert buffer to string for pattern matching
    const content = buffer.toString('binary');
    
    // Check for common malicious patterns
    const maliciousPatterns = [
      { pattern: /<script[^>]*>.*?<\/script>/gi, name: 'Script tags' },
      { pattern: /javascript:/gi, name: 'JavaScript protocol' },
      { pattern: /vbscript:/gi, name: 'VBScript protocol' },
      { pattern: /data:text\/html/gi, name: 'Data URI HTML' },
      { pattern: /<iframe[^>]*>/gi, name: 'Iframe tags' },
      { pattern: /<object[^>]*>/gi, name: 'Object tags' },
      { pattern: /<embed[^>]*>/gi, name: 'Embed tags' },
      { pattern: /eval\s*\(/gi, name: 'Eval function' },
      { pattern: /document\.write/gi, name: 'Document write' },
      { pattern: /window\.location/gi, name: 'Window location' },
    ];

    for (const { pattern, name } of maliciousPatterns) {
      if (pattern.test(content)) {
        threats.push(name);
      }
    }

    // Check for suspicious file headers
    const suspiciousHeaders = [
      { header: 'GIF89a', name: 'GIF with potential script' },
      { header: 'JFIF', name: 'JPEG with potential metadata' },
    ];

    for (const { header, name } of suspiciousHeaders) {
      if (content.startsWith(header)) {
        // Additional checks could be added here
        // For now, just log the detection
        log.debug('Suspicious file header detected', { header, name });
      }
    }

    return {
      safe: threats.length === 0,
      threats,
    };
  } catch (error) {
    log.error('Malicious content scan failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    // If scanning fails, err on the side of caution
    return {
      safe: false,
      threats: ['Content scan failed'],
    };
  }
}

/**
 * Generate secure hash for file verification
 */
export async function generateFileHash(buffer: Buffer): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Validate file hash against expected value
 */
export function validateFileHash(
  buffer: Buffer,
  expectedHash: string
): Promise<boolean> {
  return generateFileHash(buffer).then(hash => hash === expectedHash);
}

export default {
  processImageForSecurity,
  validateImageSecurity,
  generateSecureFilename,
  sanitizeS3Key,
  validateS3Key,
  generateSecurePresignedUrl,
  scanForMaliciousContent,
  generateFileHash,
  validateFileHash,
};
