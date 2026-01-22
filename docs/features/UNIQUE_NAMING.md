# Unique Media Asset Naming System

## Overview

The catalog app now uses a comprehensive unique naming system for all uploaded media assets. This ensures that every file has a unique, meaningful name that prevents conflicts and provides context about the file's origin.

## Naming Format

The unique naming system uses the following format:
```
{prefix}-{timestamp}-{uuid}-{sanitized-original-name}.{extension}
```

### Components

- **Prefix**: Contextual information (client ID, product SKU, file type, folder)
- **Timestamp**: 13-digit Unix timestamp (milliseconds)
- **UUID**: 8-character hexadecimal random string
- **Sanitized Original Name**: Original filename with special characters replaced
- **Extension**: Original file extension

## Examples

### Product Media Upload
```
Original: IMG_3385.JPG
Generated: n2og-0001-image-1759534293839-940e2076-IMG_3385.JPG
S3 Path: clients/cmgbepnyh0001y703yoh9n2og/products/0001/media/image/n2og-0001-image-1759534293839-940e2076-IMG_3385.JPG
```

### Bulk Upload
```
Original: VIDEO-2025-09-26-03-09-54.mp4
Generated: n2og-general-video-1759534293839-6a5cb109-VIDEO-2025-09-26-03-09-54.mp4
S3 Path: clients/cmgbepnyh0001y703yoh9n2og/media/general/video/n2og-general-video-1759534293839-6a5cb109-VIDEO-2025-09-26-03-09-54.mp4
```

## Prefix Patterns

### Product Media
- Format: `{clientId-last4}-{sku}-{fileType}`
- Example: `n2og-0001-image`

### Bulk Upload
- Format: `{clientId-last4}-{folder}-{fileType}`
- Example: `n2og-general-image`

### Descriptive
- Format: `{clientId-last4}-{FileType}`
- Example: `n2og-Image`

## Benefits

1. **Uniqueness**: Timestamp + UUID ensures no filename conflicts
2. **Context**: Prefix provides immediate context about file origin
3. **Traceability**: Can parse filename to understand file metadata
4. **Organization**: Clear folder structure with meaningful names
5. **Security**: Sanitized names prevent path traversal attacks

## Implementation

The unique naming system is implemented in:
- `src/lib/unique-naming.ts` - Core naming functions
- `src/lib/aws.ts` - S3 key generation
- `src/app/api/media/route.ts` - Product media uploads
- `src/app/api/upload-media/route.ts` - Direct uploads
- `src/app/api/media/bulk-upload/route.ts` - Bulk uploads

## Functions

### Core Functions
- `generateUniqueFileName()` - Basic unique filename generation
- `generateDescriptiveFileName()` - With file type context
- `generateProductMediaFileName()` - With product context
- `generateBulkUploadFileName()` - With folder context
- `parseUniqueFileName()` - Parse filename to extract metadata

### Usage
```typescript
import { generateProductMediaFileName } from '@/lib/unique-naming'

const uniqueName = generateProductMediaFileName(
  'IMG_3385.JPG',
  'image',
  '0001',
  'cmgbepnyh0001y703yoh9n2og'
)
// Result: n2og-0001-image-1759534293839-940e2076-IMG_3385.JPG
```

## Migration

Existing files will continue to work with their current names. New uploads will automatically use the unique naming system. No migration is required for existing data.
