# Stock Mind - Application Context & Architecture

## Overview

**Stock Mind** is a comprehensive multi-tenant SaaS inventory management platform built with Next.js 15, React 19, TypeScript, Prisma, and PostgreSQL. The application has evolved from a single-tenant inventory system to a full-featured SaaS platform with advanced features including visual search, media management, and guest access.

## Core Architecture

### Technology Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Material UI (MUI)
- Framer Motion (animations)
- Radix UI components

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL with pgvector extension (for vector similarity search)
- JWT authentication
- bcrypt for password hashing

**Infrastructure:**
- AWS S3 for media storage
- FastAPI embedding service (Python) for visual search
- CLIP ViT-B/32 model for image embeddings
- Docker support for embedding service

**Deployment:**
- Vercel (primary)
- Terraform for infrastructure (in `infra/terraform/`)

## Multi-Tenancy Architecture

### Tenant Isolation
- **Client-based isolation**: Each client has a unique `slug` and `clientId`
- **Subdomain routing**: Clients can access via `{slug}.localhost:3000` (development) or custom domains (production)
- **Data isolation**: All data models include `clientId` for tenant separation
- **Unique constraints**: SKUs and other identifiers are unique per client (e.g., `@@unique([sku, clientId])`)

### User Roles
1. **MASTER_ADMIN**: Platform administrators (no `clientId`)
2. **ADMIN**: Client administrators
3. **MANAGER**: Client managers
4. **USER**: Regular client users

### Client Plans
- **STARTER**: Basic features
- **PROFESSIONAL**: Advanced features
- **ENTERPRISE**: Full features, custom domains

## Database Schema

### Core Models

**Client** - Tenant/organization
- `id`, `name`, `slug` (unique), `domain`, `email`
- `plan`, `isActive`, `guestPassword`, `guestAccessEnabled`
- Relations: users, products, categories, settings, apiKeys

**User** - System users
- `id`, `email`, `password` (hashed), `name`, `role`
- `clientId` (null for MASTER_ADMIN), `isActive`
- Unique constraint: `[email, clientId]`

**Product** - Inventory items
- `id`, `name`, `sku`, `description`, `price`
- `category`, `categoryId`, `variations` (JSON)
- `stockLevel`, `minStock`, `isActive`, `allowPreorder`
- `images`, `videos` (JSON), `thumbnailUrl`
- `clientId` (required for isolation)
- Unique constraint: `[sku, clientId]`

**Category** - Product categories
- Hierarchical structure with `parentId`
- Client-specific with `clientId`
- Unique constraint: `[name, clientId, parentId]`

**Media** - Media files (images/videos)
- `id`, `productId`, `kind`, `s3Key`, `originalName`
- `mimeType`, `fileSize`, `width`, `height`, `durationMs`
- `status`, `error`, `sortOrder`, `isPrimary`
- Relations: ImageEmbedding, VideoFrame, ProductMedia

**ImageEmbedding** - Vector embeddings for visual search
- `id`, `mediaId` (unique), `embedding` (pgvector, 512 dimensions)
- Used for CLIP-based image similarity search

**VideoFrame** - Extracted video frames
- `id`, `mediaId`, `frameS3Key`, `tsMs` (timestamp)
- Relations: FrameEmbedding for vector search

**InventoryHistory** - Stock change tracking
- `id`, `productId`, `quantity`, `type` (enum)
- `reason`, `userId`, `clientId`, `createdAt`

**ApiKey** - API authentication keys
- `id`, `name`, `key` (unique), `secret`, `clientId`
- `permissions` (string array), `isActive`, `expiresAt`

**ClientSettings** - Client configuration
- `id`, `clientId` (unique), `companyName`, `email`
- `timezone`, `lowStockThreshold`, `autoReorder`
- `emailNotifications`, `smsNotifications`

## Key Features

### 1. Product Management
- Full CRUD operations with tenant isolation
- Multiple categories per product (many-to-many)
- Product variations (size, color, etc.) stored as JSON
- Media management (images/videos) with S3 storage
- Bulk operations (import/export)
- SKU-based lookup

### 2. Visual Search (AI-Powered)
- **CLIP-based image similarity search**
- FastAPI service generates 512-dimensional embeddings
- PostgreSQL pgvector for cosine similarity search
- Search by uploading an image
- Video frame extraction and search
- Public API endpoints with API key authentication
- Similarity threshold filtering (default 60%, high-precision 95%)

**Endpoints:**
- `/api/search/by-image` - Authenticated search
- `/api/public/search/by-image` - Public API (requires API key)
- `/api/public/search/by-image/advanced` - Advanced public search

**Embedding Service:**
- FastAPI service on port 8000
- CLIP ViT-B/32 model
- GPU/CPU support
- Docker containerized

### 3. Media Management
- S3 storage with presigned URLs
- Image and video support
- Thumbnail generation
- Bulk upload
- Media assignment to products
- Reprocessing capabilities
- EXIF data extraction
- Video frame extraction for search

**Endpoints:**
- `/api/media` - List, create, update media
- `/api/media/bulk-upload` - Bulk upload
- `/api/media/assign` - Assign to products
- `/api/media/reprocess/[id]` - Reprocess media
- `/api/media/refresh-urls` - Refresh S3 URLs

### 4. Guest Access
- Password-protected catalog sharing
- Read-only product viewing
- JWT-based guest sessions (24-hour expiry)
- Client-specific guest URLs: `/guest/[slug]`
- Guest catalog view: `/guest/[slug]/catalog`

**Configuration:**
- Enable/disable per client
- Custom password or auto-generated
- Managed via Settings → Guest Access

### 5. Inventory Tracking
- Real-time stock level updates
- Inventory history with audit trail
- Multiple inventory types: PURCHASE, SALE, ADJUSTMENT, RETURN, DAMAGE, TRANSFER
- Low stock alerts
- Inventory analytics

### 6. API Management
- API key generation and management
- Client-specific API keys
- Permission-based access control
- Public API endpoints for external integrations
- Rate limiting support (infrastructure ready)

### 7. Admin Panel
- Super admin dashboard at `/admin`
- Client management (CRUD)
- Platform analytics
- System management
- API key management

### 8. Analytics & Reporting
- Dashboard with key metrics
- Low stock reports
- Inventory analytics
- Performance metrics tracking
- Activity logging

## Authentication & Authorization

### Authentication Flow
1. **Login**: `POST /api/auth/login` → Returns JWT token
2. **Token Storage**: localStorage + HTTP-only cookie
3. **Middleware**: Validates JWT on protected routes
4. **Guest Auth**: Separate JWT flow for guest access

### Authorization
- **JWT-based**: All protected endpoints require Bearer token
- **Role-based**: MASTER_ADMIN, ADMIN, MANAGER, USER
- **Tenant-scoped**: Users can only access their client's data
- **API Keys**: Alternative auth for public APIs

### Middleware
- `src/middleware.ts`: Request size validation for bulk uploads
- `src/lib/auth-middleware.ts`: JWT validation
- `src/lib/api-key-middleware.ts`: API key validation

## File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard routes
│   ├── admin/             # Super admin panel
│   ├── api/               # API routes (68 files)
│   ├── guest/             # Guest access routes
│   └── [pages]/           # Public pages
├── components/            # React components (42 files)
├── contexts/              # React contexts (TenantContext)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries (28 files)
│   ├── auth.ts           # Authentication utilities
│   ├── search.ts         # Vector search functions
│   ├── s3-upload.ts      # S3 upload utilities
│   ├── tenant.ts         # Tenant resolution
│   └── ...
└── types/                 # TypeScript types

services/
└── embedding_service/     # FastAPI embedding service
    ├── app.py            # Main FastAPI app
    ├── Dockerfile        # Docker configuration
    └── requirements.txt  # Python dependencies

prisma/
├── schema.prisma         # Database schema
└── migrations/           # Database migrations

infra/
└── terraform/            # Infrastructure as code
```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_REGION` - AWS region
- `AWS_S3_BUCKET` - S3 bucket name

Optional:
- `EMBEDDING_SERVICE_URL` - Embedding service URL (default: http://localhost:8000)
- `NEXTAUTH_URL` - Base URL for NextAuth
- `NEXTAUTH_SECRET` - NextAuth secret

## API Patterns

### Standard Response Format
```typescript
{
  success: boolean
  data?: any
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

### Error Handling
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate data)
- 500: Internal Server Error

### Tenant Resolution
- Extract `clientId` from JWT token
- Or resolve from subdomain/slug
- All queries filtered by `clientId`

## Performance Optimizations

1. **Vector Search**: pgvector with HNSW/IVFFLAT indexes
2. **Image Optimization**: Next.js Image component with WebP/AVIF
3. **Caching**: Static asset caching, API response caching
4. **Database**: Connection pooling, query optimization
5. **Media**: Presigned URLs, CDN-ready S3 storage

## Security Features

1. **JWT Authentication**: Secure token-based auth
2. **Password Hashing**: bcrypt with salt
3. **Tenant Isolation**: Data separation at database level
4. **Input Validation**: Zod schemas, Prisma validation
5. **SQL Injection Protection**: Prisma ORM
6. **CORS**: Configurable CORS headers
7. **Rate Limiting**: Infrastructure ready (not fully implemented)

## Development Workflow

### Setup
```bash
npm install
npm run setup-saas  # Generates Prisma client, pushes schema, seeds data
npm run dev
```

### Database
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
```

### Scripts
- `backfill:media` - Backfill media from products
- `reembed` - Regenerate all embeddings
- `db:copy-prod` - Copy production DB to local
- `db:backup-prod` - Backup production DB

## Testing

- Vitest for unit tests
- Test files in `tests/` directory
- E2E tests for visual search
- Smoke tests for embedding service

## Deployment

### Vercel
- Automatic deployments from Git
- Environment variables in Vercel dashboard
- Custom domain configuration for subdomains

### Database Migrations
```bash
npx prisma migrate deploy  # Production migrations
```

### Embedding Service
- Docker container
- Can be deployed separately
- Requires GPU for optimal performance

## Known Issues & Technical Debt

1. **TypeScript Errors**: Build configured to ignore type errors (`ignoreBuildErrors: true`)
2. **ESLint Errors**: Build configured to ignore lint errors (`ignoreDuringBuilds: true`)
3. **Rate Limiting**: Infrastructure ready but not fully implemented
4. **Error Handling**: Some endpoints need better error handling
5. **Logging**: Structured logging with Pino, but not comprehensive

## Recent Changes

- Multi-tenant SaaS architecture
- Visual search with CLIP embeddings
- Guest access feature
- Media management system
- API key management
- Video frame extraction
- Performance metrics tracking

## Documentation Files

- `README.md` - Basic setup and usage
- `SAAS_README.md` - Multi-tenant architecture details
- `GUEST_ACCESS.md` - Guest access feature documentation
- `API_DOCUMENTATION.md` - API endpoint documentation
- `AWS_SETUP.md` - AWS configuration guide
- `VERCEL_DEPLOYMENT.md` - Vercel deployment guide
- `PRODUCTION_MIGRATION.md` - Production migration guide

## Key Libraries & Dependencies

**Core:**
- `next@15.5.3` - Framework
- `react@19.1.0` - UI library
- `prisma@6.16.2` - ORM
- `@prisma/client@6.16.2` - Prisma client

**UI:**
- `@mui/material@7.3.2` - Material UI
- `tailwindcss@3.4.17` - Styling
- `framer-motion@12.23.13` - Animations
- `lucide-react@0.544.0` - Icons

**Backend:**
- `pg@8.11.3` - PostgreSQL client
- `jsonwebtoken@9.0.2` - JWT
- `bcrypt@6.0.0` - Password hashing
- `@aws-sdk/client-s3@3.890.0` - AWS S3

**Utilities:**
- `zod@3.25.76` - Validation
- `sharp@0.34.4` - Image processing
- `papaparse@5.5.3` - CSV parsing
- `pino@8.16.2` - Logging

## Next Steps / Roadmap

Potential improvements:
- Complete rate limiting implementation
- Fix TypeScript/ESLint errors
- Comprehensive error handling
- Enhanced logging and monitoring
- Mobile app development
- Advanced analytics dashboard
- Email/SMS notifications
- Third-party integrations
- White-label customization

