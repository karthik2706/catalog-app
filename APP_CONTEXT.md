# Stock Mind - Application Context & Architecture

## Overview
**Stock Mind** is a multi-tenant SaaS inventory management platform built with Next.js 15, React 19, TypeScript, Prisma, and PostgreSQL. The application supports multiple clients (tenants) with complete data isolation, advanced product catalog management, visual search capabilities, and comprehensive media handling.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Material UI (MUI), Framer Motion
- **State Management**: React Context (AuthProvider, TenantContext)
- **UI Components**: Radix UI, Headless UI, Lucide React icons

### Backend
- **API**: Next.js API Routes (RESTful)
- **ORM**: Prisma 6.16.2
- **Database**: PostgreSQL with vector extension (pgvector) for embeddings
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: AWS S3 for media files

### External Services
- **Embedding Service**: Python FastAPI service for CLIP image embeddings (512-dimensional vectors)
- **Vector Search**: PostgreSQL pgvector extension for similarity search

## Architecture Patterns

### Multi-Tenancy
- **Client-based isolation**: All data is scoped by `clientId`
- **Role-based access**: MASTER_ADMIN, ADMIN, MANAGER, USER
- **Guest access**: Read-only access with password-protected catalogs
- **Subdomain routing**: Support for client-specific subdomains (future)

### Data Isolation
- All queries filter by `clientId` to ensure tenant isolation
- SKUs are unique per client: `@@unique([sku, clientId])`
- Users belong to clients (except MASTER_ADMIN)
- Products, categories, media, inventory all scoped to clients

### Authentication & Authorization
1. **User Authentication** (JWT):
   - Standard user login with email/password
   - JWT tokens contain: `userId`, `email`, `role`, `clientId`, `clientSlug`
   - Tokens stored in localStorage and cookies
   - Protected routes require valid JWT

2. **Guest Authentication**:
   - Password-protected guest access per client
   - Guest tokens: `type: 'guest'`, `clientId`, `clientSlug`, `clientName`
   - Read-only access (enforced by `rejectGuestTokens()`)
   - Guest routes: `/api/guest/*`

3. **API Key Authentication**:
   - API keys for programmatic access
   - Validated via `authenticateApiKey()` middleware
   - Headers: `x-api-key`, `x-client-id`
   - Permissions array for fine-grained access

## Database Schema

### Core Models

**Client** (Tenant)
- `id`, `name`, `slug` (unique), `domain`, `email`
- `plan`: STARTER | PROFESSIONAL | ENTERPRISE
- `isActive`, `guestAccessEnabled`, `guestPassword`
- Relations: users, products, categories, settings, apiKeys

**User**
- `id`, `email`, `password` (hashed), `name`, `role`
- `clientId` (nullable - null for MASTER_ADMIN)
- `isActive`
- Unique constraint: `[email, clientId]`

**Product**
- `id`, `name`, `sku`, `description`, `price`
- `category` (legacy string), `categoryId` (new relation)
- `stockLevel`, `minStock`, `isActive`
- `clientId` (required)
- `variations` (JSON), `images`, `videos` (JSON - legacy)
- `thumbnailUrl`
- `allowPreorder`
- Relations: categories (many-to-many), media (many-to-many)
- Unique: `[sku, clientId]`

**Category**
- `id`, `name`, `description`, `isActive`
- `clientId`, `parentId` (hierarchical)
- `sortOrder`
- Unique: `[name, clientId, parentId]`

**Media**
- `id`, `kind` (image/video/audio/document)
- `s3Key`, `originalName`, `mimeType`, `fileSize`
- `width`, `height`, `durationMs`
- `altText`, `caption`, `sortOrder`, `isPrimary`
- `status` (pending/completed/error)
- `productId` (optional - legacy direct relation)
- Relations: ProductMedia (junction), ImageEmbedding, VideoFrame

**ProductMedia** (Junction Table)
- Links products to media with ordering
- `productId`, `mediaId`, `isPrimary`, `sortOrder`

**ImageEmbedding**
- `id`, `mediaId` (unique)
- `embedding` (vector(512)) - CLIP embeddings
- Used for visual search

**VideoFrame**
- `id`, `mediaId`, `frameS3Key`, `tsMs`
- `width`, `height`
- Relations: FrameEmbedding (for video search)

**InventoryHistory**
- `id`, `productId`, `quantity`, `type`
- `reason`, `userId`, `clientId`
- Types: PURCHASE, SALE, ADJUSTMENT, RETURN, DAMAGE, TRANSFER

**ApiKey**
- `id`, `name`, `key` (unique), `secret`
- `clientId`, `isActive`, `permissions[]`
- `lastUsedAt`, `expiresAt`

**ClientSettings**
- `id`, `clientId` (unique)
- `companyName`, `email`, `phone`, `address`
- `timezone`, `lowStockThreshold`
- `autoReorder`, `emailNotifications`, `smsNotifications`

## Key Features

### 1. Product Management
- **CRUD Operations**: Full create, read, update, delete
- **Bulk Operations**: Import/export via CSV, bulk delete
- **Categories**: Hierarchical category system with many-to-many product relations
- **Variations**: JSON-based product variations (size, color, etc.)
- **SKU Management**: Unique SKUs per client
- **Stock Tracking**: Real-time inventory with history

### 2. Media Management
- **Upload**: Single and bulk uploads to S3
- **Types**: Images, videos, audio, documents
- **Processing**: 
  - Image thumbnails (300x300)
  - Video frame extraction
  - EXIF stripping for security
  - Image optimization (Sharp)
- **Storage**: S3 with signed URLs (7-day expiry)
- **Organization**: `clients/{clientId}/products/{sku}/media/{type}/{filename}`
- **Relations**: Many-to-many via ProductMedia junction table

### 3. Visual Search (AI-Powered)
- **Embedding Service**: External Python FastAPI service
- **CLIP Model**: 512-dimensional image embeddings
- **Vector Search**: PostgreSQL pgvector cosine similarity
- **Endpoints**:
  - `/api/search/by-image` - Authenticated search
  - `/api/public/search/by-image` - Public/API key search
  - `/api/public/search/by-image/advanced` - Advanced with thresholds
- **Process**:
  1. Upload image → Embedding service
  2. Generate 512-dim embedding
  3. Vector similarity search in PostgreSQL
  4. Filter by similarity threshold (default 60%, advanced 95%+)
  5. Return matching products with similarity scores

### 4. Guest Access
- **Password Protection**: Per-client guest passwords
- **Read-Only**: Guests can view products, search, browse
- **No Modifications**: All write operations rejected
- **Token-Based**: Guest JWT tokens with `type: 'guest'`
- **Routes**: `/api/guest/*` for guest-specific endpoints

### 5. Bulk Operations
- **Product Import**: CSV parsing with category/subcategory creation
- **Bulk Delete**: Up to 100 products at once
- **Media Upload**: Multiple files in single request (20MB limit)
- **SKU Validation**: Duplicate detection within batch and database

### 6. Data Quality
- **Failing Media**: Detection of broken media links
- **Missing Media**: Products without associated media
- **Orphaned Media**: Media files not linked to products
- **Analytics**: Media processing status tracking

### 7. Performance Monitoring
- **Metrics**: FCP, LCP, FID, CLS, TTFB, FMP, TTI
- **Storage**: PerformanceMetrics table
- **Dashboard**: Real-time performance visualization

## API Structure

### Authentication Routes
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/guest/auth` - Guest authentication
- `POST /api/guest/get-token` - Get guest token
- `POST /api/guest/logout` - Guest logout

### Product Routes
- `GET /api/products` - List products (filtered, paginated)
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `POST /api/products/bulk` - Bulk import
- `DELETE /api/products/bulk` - Bulk delete
- `GET /api/products/sku/[sku]` - Get by SKU
- `POST /api/products/sku/bulk` - Bulk get by SKUs

### Media Routes
- `GET /api/media` - List media (filtered)
- `POST /api/media` - Upload single media
- `POST /api/media/bulk-upload` - Bulk upload
- `GET /api/media/[id]` - Get media
- `DELETE /api/media/[id]` - Delete media
- `POST /api/media/assign` - Assign media to product
- `POST /api/media/bulk` - Bulk operations
- `POST /api/media/refresh-urls` - Refresh S3 signed URLs
- `POST /api/media/reprocess/[id]` - Reprocess media

### Search Routes
- `POST /api/search/by-image` - Visual search (authenticated)
- `POST /api/search/by-image-simple` - Simple visual search
- `POST /api/public/search/by-image` - Public visual search
- `POST /api/public/search/by-image/advanced` - Advanced public search

### Category Routes
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/guest/categories` - Guest category list

### Admin Routes
- `GET /api/admin/clients` - List all clients
- `POST /api/admin/clients` - Create client
- `GET /api/admin/clients/[id]` - Get client
- `PUT /api/admin/clients/[id]` - Update client
- `DELETE /api/admin/clients/[id]` - Delete client
- `GET /api/admin/api-keys` - List API keys
- `POST /api/admin/api-keys` - Create API key
- `DELETE /api/admin/api-keys/[id]` - Delete API key

### Public Routes (API Key Auth)
- `GET /api/public/products` - Public product list
- `GET /api/public/products/sku/[sku]` - Get product by SKU
- `POST /api/public/products/sku/bulk` - Bulk get by SKUs
- `POST /api/public/inventory/check` - Check inventory
- `POST /api/public/inventory/reduce` - Reduce inventory
- `POST /api/public/inventory/reduce/bulk` - Bulk reduce
- `POST /api/public/inventory/restore` - Restore inventory

## Security Features

### Authentication Guards
- `rejectGuestTokens()` - Prevents guest access to write operations
- `getUserFromRequest()` - Extracts user from JWT
- `authenticateApiKey()` - Validates API keys
- `authorizeUser()` - Role-based authorization
- `authorizeSuperAdmin()` - MASTER_ADMIN only

### Data Validation
- Input sanitization
- File type validation
- File size limits (20MB bulk, 50MB per file)
- SQL injection prevention (Prisma)
- XSS protection

### S3 Security
- Signed URLs (7-day expiry)
- Metadata sanitization
- EXIF stripping for images
- Content-Type validation

## File Structure

```
src/
├── app/
│   ├── (dashboard)/        # Dashboard routes
│   ├── admin/              # Admin panel
│   ├── api/                # API routes
│   ├── guest/              # Guest pages
│   ├── products/           # Product pages
│   ├── media/              # Media pages
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── ui/                 # UI primitives
│   └── [feature].tsx       # Feature components
├── contexts/               # React contexts
│   └── TenantContext.tsx   # Tenant/client context
├── hooks/                  # Custom hooks
├── lib/                    # Utility libraries
│   ├── prisma.ts           # Prisma client
│   ├── auth.ts             # Auth utilities
│   ├── jwt.ts              # JWT handling
│   ├── search.ts           # Vector search
│   ├── embeddings.ts       # Embedding utilities
│   ├── s3-upload.ts        # S3 operations
│   ├── aws.ts              # AWS utilities
│   └── [other].ts          # Other utilities
└── types/                  # TypeScript types
    └── index.ts            # Shared types

prisma/
├── schema.prisma           # Database schema
└── migrations/             # Database migrations

services/
└── embedding_service/     # Python FastAPI service
    ├── app.py
    ├── Dockerfile
    └── requirements.txt
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="your-secret-key"

# AWS S3
S3_BUCKET_NAME="your-bucket"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"

# Embedding Service
EMBEDDING_SERVICE_URL="http://localhost:8000"

# NextAuth (optional)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
```

## Key Libraries & Dependencies

### Core
- `next`: 15.5.7
- `react`: 19.1.2
- `typescript`: 5
- `prisma`: 6.16.2
- `@prisma/client`: 6.16.2

### UI
- `@mui/material`: 7.3.2
- `@mui/x-data-grid`: 8.11.2
- `tailwindcss`: 3.4.17
- `framer-motion`: 12.23.13
- `lucide-react`: 0.544.0

### AWS
- `@aws-sdk/client-s3`: 3.890.0
- `@aws-sdk/s3-request-presigner`: 3.890.0

### Utilities
- `sharp`: 0.34.4 (image processing)
- `bcrypt`: 6.0.0 (password hashing)
- `jsonwebtoken`: 9.0.2 (JWT)
- `zod`: 3.25.76 (validation)
- `papaparse`: 5.5.3 (CSV parsing)

## Current State & Known Patterns

### Authentication Flow
1. User logs in → JWT token generated
2. Token stored in localStorage + cookie
3. API calls include `Authorization: Bearer <token>`
4. Middleware validates token and extracts user/client context
5. Guest tokens explicitly rejected for write operations

### Multi-Tenant Query Pattern
```typescript
// All queries filter by clientId
const products = await prisma.product.findMany({
  where: {
    clientId: user.clientId,
    // ... other filters
  }
})
```

### Media Upload Flow
1. File uploaded via FormData
2. Validated (type, size)
3. Processed (thumbnails, optimization)
4. Uploaded to S3 with unique key
5. Media record created in database
6. ProductMedia junction record created
7. Embedding generated (async) for images

### Visual Search Flow
1. Image uploaded to search endpoint
2. Sent to embedding service
3. 512-dim embedding returned
4. Vector similarity search in PostgreSQL
5. Results filtered by similarity threshold
6. Products enriched with media URLs
7. Results returned with similarity scores

## Important Notes

1. **Guest Access**: Read-only, enforced at API level
2. **SKU Uniqueness**: Per-client, not global
3. **Media Relations**: Migrating from direct `productId` to junction table
4. **Categories**: Supporting both legacy string and new relation-based
5. **Vector Search**: Requires pgvector extension in PostgreSQL
6. **S3 URLs**: Signed URLs expire after 7 days, need refresh
7. **Embeddings**: Generated asynchronously after media upload
8. **Bulk Operations**: Limited to 100 items for performance

## Development Workflow

### Setup
```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed-saas  # For multi-tenant setup
npm run dev
```

### Database
```bash
npm run db:migrate    # Create migration
npm run db:push       # Push schema changes
npm run db:studio     # Open Prisma Studio
```

### Scripts
```bash
npm run backfill:media    # Backfill media from products
npm run reembed           # Regenerate all embeddings
npm run db:copy-prod      # Copy production to local
npm run db:backup-prod    # Backup production database
```

## Testing
- Vitest for unit tests
- E2E tests in `tests/` directory
- Visual search tests: `tests/search-by-image.spec.ts`
- Media processing tests: `tests/media-reprocess.spec.ts`

---

**Last Updated**: 2025-01-XX
**Version**: 0.1.0
**Status**: Production-ready multi-tenant SaaS platform

