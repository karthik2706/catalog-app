# Catalog App - Complete Application Audit & Context

**Last Updated:** January 2025  
**Application Name:** Stock Mind (Multi-Tenant SaaS Catalog & Inventory Management)  
**Version:** 1.0.0

---

## Executive Summary

**Stock Mind** is a comprehensive multi-tenant SaaS platform for product catalog and inventory management with advanced capabilities including AI-powered visual search, guest e-commerce, media management, and order processing. Originally built as a single-tenant inventory system, it has evolved into a full-featured multi-tenant platform serving multiple clients with complete data isolation.

### Key Highlights
- ✅ **Multi-Tenant Architecture**: Row-level security with subdomain-based routing
- ✅ **AI-Powered Visual Search**: CLIP embeddings for image and video similarity search
- ✅ **Guest E-Commerce**: Password-protected guest catalog access with shopping cart
- ✅ **Media Management**: S3-based storage with automated processing and embeddings
- ✅ **Order Management**: Complete e-commerce order processing with payment tracking
- ✅ **API-First Design**: RESTful APIs with API key authentication
- ✅ **Role-Based Access Control**: 4-tier permission system (MASTER_ADMIN, ADMIN, MANAGER, USER)

---

## 🏗️ Architecture Overview

### Technology Stack

#### Frontend
- **Framework**: Next.js 15.5.9 (App Router)
- **React**: 19.1.2 (Server & Client Components)
- **Language**: TypeScript 5.x
- **Styling**: 
  - Tailwind CSS 3.4.17 (primary)
  - Material UI v7 (legacy components)
  - Radix UI (accessible primitives)
  - Framer Motion (animations)
- **Icons**: Lucide React, Heroicons, MUI Icons
- **Forms**: React Hook Form (implied)
- **Notifications**: Sonner (toast notifications)

#### Backend
- **Runtime**: Node.js (ES2020+)
- **API**: Next.js API Routes (Serverless Functions)
- **ORM**: Prisma 6.16.2
- **Database**: PostgreSQL with pgvector extension
- **Authentication**: JWT (jsonwebtoken), bcrypt for password hashing
- **File Storage**: AWS S3 (@aws-sdk/client-s3 v3.890.0)

#### External Services
- **Embedding Service**: FastAPI Python service (CLIP model)
  - Endpoint: `EMBEDDING_SERVICE_URL` (default: `http://localhost:8000`)
  - Dockerized service in `services/embedding_service/`
- **Vector Search**: PostgreSQL pgvector extension (512-dimension vectors)
- **Image Processing**: Sharp (Next.js built-in), exifr for metadata

#### Infrastructure
- **Primary Deployment**: Vercel
- **Database**: PostgreSQL (managed or self-hosted)
- **Storage**: AWS S3
- **Infrastructure as Code**: Terraform (in `infra/terraform/`)

### Architecture Patterns

#### Multi-Tenancy Model
- **Isolation Strategy**: Row-level security via `clientId` foreign keys
- **Routing**: Subdomain-based (e.g., `techcorp.localhost:3000`) and slug-based (`/guest/[slug]`)
- **Tenant Resolution**: Header-based (`x-tenant-slug`) for API routes, cookie-based for guest pages
- **Data Isolation**: Complete separation via `clientId` scoping on all tenant resources

#### Application Structure
```
┌─────────────────────────────────────────────────────────┐
│                    Client/Browser                       │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   Admin Dashboard    Guest Catalog (SSR)
        │                   │
        └─────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        │   Next.js App     │
        │   (API Routes)    │
        └─────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────┴────┐      ┌───────┴────────┐
   │ Prisma  │      │ Embedding      │
   │  ORM    │      │   Service      │
   └────┬────┘      │   (FastAPI)    │
        │           └────────────────┘
   ┌────┴────┐
   │PostgreSQL│
   │(pgvector)│
   └────┬────┘
        │
   ┌────┴────┐
   │  AWS S3 │
   └─────────┘
```

---

## 🗄️ Database Schema (Prisma)

### Core Models

#### **Client** (Tenant Root)
```prisma
model Client {
  id                String             @id @default(cuid())
  name              String
  slug              String             @unique  // For subdomain/slug routing
  domain            String?
  email             String
  phone             String?
  address           String?
  logo              String?
  countryId         String?
  currencyId        String?
  isActive          Boolean            @default(true)
  plan              Plan               @default(STARTER)
  guestPassword     String?            // Simple password auth for guests
  guestAccessEnabled Boolean           @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Relations
  apiKeys           ApiKey[]
  categories        Category[]
  settings          ClientSettings?
  country           Country?
  currency          Currency?
  inventoryHistory  InventoryHistory[]
  products          Product[]
  users             User[]
  orders            Order[]
}
```

**Key Features:**
- Multi-tenant root entity
- Guest access configuration
- Country/currency localization
- SaaS plan tiers (STARTER, PROFESSIONAL, ENTERPRISE)

#### **User**
```prisma
model User {
  id                String             @id @default(cuid())
  email             String
  password          String             // bcrypt hashed
  name              String?
  role              Role               @default(ADMIN)
  clientId          String?            // null = super admin
  isActive          Boolean            @default(true)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Relations
  inventoryHistory  InventoryHistory[]
  client            Client?
  
  @@unique([email, clientId])  // Email unique per tenant
  @@map("users")
}
```

**Roles:**
- `MASTER_ADMIN` (4): Platform-wide super admin, no `clientId`
- `ADMIN` (3): Full access within tenant
- `MANAGER` (2): Inventory/product management
- `USER` (1): Read-only, limited access

#### **Product**
```prisma
model Product {
  id                String             @id @default(cuid())
  name              String
  sku               String             // Unique per tenant
  description       String?
  price             Decimal            @db.Decimal(10, 2)
  category          String             // Legacy field
  categoryId        String?            // New category relation
  variations        Json?              // Size, color, etc.
  stockLevel        Int                @default(0)
  minStock          Int                @default(0)
  isActive          Boolean            @default(true)
  clientId          String             // Required tenant scope
  images            Json?              // Legacy field
  videos            Json?              // Legacy field
  thumbnailUrl      String?
  allowPreorder     Boolean            @default(false)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Relations
  inventoryHistory  InventoryHistory[]
  media             Media[]
  productMedia      ProductMedia[]
  categories        ProductCategory[]
  orderItems        OrderItem[]
  client            Client
  
  @@unique([sku, clientId])  // SKU unique per tenant
  @@map("products")
}
```

**Key Features:**
- Tenant-scoped with `clientId`
- Media support via `Media` and `ProductMedia` relations
- Category hierarchy support
- Inventory tracking with preorder support

#### **Media**
```prisma
model Media {
  id                String             @id @default(cuid())
  productId         String?
  kind              String             // 'image' | 'video'
  s3Key             String             // S3 object key
  originalName      String
  mimeType          String
  fileSize          Int
  width             Int?
  height            Int?
  durationMs        Int?               // For videos
  altText           String?
  caption           String?
  sortOrder         Int                @default(0)
  isPrimary         Boolean            @default(false)
  status            String             @default("pending")
  error             String?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Relations
  imageEmbedding    ImageEmbedding?
  products          Product?
  productMedia      ProductMedia[]
  videoFrames       VideoFrame[]
  
  @@map("media")
}
```

**Processing Flow:**
1. Upload to S3 → `Media` record created with `status: "pending"`
2. Metadata extraction (dimensions, duration)
3. Thumbnail generation (for videos)
4. Embedding generation (for images)
5. Video frame extraction (for videos)
6. Status updated to `"completed"` or `"error"`

#### **ImageEmbedding & VideoFrame**
```prisma
model ImageEmbedding {
  id                String             @id @default(cuid())
  mediaId           String             @unique
  embedding         Unsupported("vector")  // 512-dim CLIP embedding
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  media             Media
  
  @@map("image_embeddings")
}

model VideoFrame {
  id                String             @id @default(cuid())
  mediaId           String
  frameS3Key        String             // Extracted frame stored in S3
  tsMs              Int                // Timestamp in milliseconds
  width             Int?
  height            Int?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  embeddings        FrameEmbedding?
  media             Media
  
  @@map("video_frames")
}

model FrameEmbedding {
  id                String             @id @default(cuid())
  frameId           String             @unique
  embedding         Unsupported("vector")  // 512-dim CLIP embedding
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  frame             VideoFrame
  
  @@map("frame_embeddings")
}
```

**Vector Search:**
- Uses PostgreSQL `vector` type (pgvector extension)
- Cosine similarity via `<#>` operator (negative inner product)
- Similarity threshold filtering (≥60% for images, ≥95% for public API)
- Indexes: HNSW or IVFFLAT for performance

#### **Order & OrderItem**
```prisma
model Order {
  id                    String      @id @default(cuid())
  orderNumber           String      @unique  // Auto-generated
  clientId              String
  status                OrderStatus @default(PENDING)
  customerName          String
  customerEmail         String
  customerPhone         String
  shippingAddress       Json        // Full address as JSON
  billingAddress        Json?       // Optional
  notes                 String?
  subtotal              Decimal     @db.Decimal(10, 2)
  tax                   Decimal     @default(0) @db.Decimal(10, 2)
  shipping              Decimal     @default(0) @db.Decimal(10, 2)
  total                 Decimal     @db.Decimal(10, 2)
  paymentUTR            String?     // UTR number
  paymentTransactionNumber String?  // Transaction number
  paymentProofUrl       String?     // S3 URL to proof image
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  client                Client
  items                 OrderItem[]
  
  @@index([clientId])
  @@index([orderNumber])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  productId   String
  productName String   // Snapshot at order time
  productSku  String   // Snapshot at order time
  price       Decimal  @db.Decimal(10, 2)  // Snapshot at order time
  quantity    Int
  subtotal    Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  order       Order
  product     Product? // Nullable if product deleted
  
  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}
```

**Order Status Flow:**
`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED` / `CANCELLED`

#### **Category** (Hierarchical)
```prisma
model Category {
  id          String            @id @default(cuid())
  name        String
  description String?
  isActive    Boolean           @default(true)
  clientId    String
  parentId    String?
  sortOrder   Int               @default(0)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  client      Client
  parent      Category?
  children    Category[]
  products    ProductCategory[]
  
  @@unique([name, clientId, parentId])  // Unique name per level per tenant
  @@map("categories")
}

model ProductCategory {
  id         String   @id @default(cuid())
  productId  String
  categoryId String
  createdAt  DateTime @default(now())
  category   Category
  product    Product
  
  @@unique([productId, categoryId])
  @@map("product_categories")
}
```

**Features:**
- Hierarchical categories (unlimited depth)
- Many-to-many product-category relationships
- Tenant-scoped

#### **ApiKey**
```prisma
model ApiKey {
  id          String    @id @default(cuid())
  name        String
  key         String    @unique  // Generated API key
  secret      String?   // Optional secret for HMAC
  clientId    String
  isActive    Boolean   @default(true)
  permissions String[]  @default([])  // Granular permissions
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  client      Client
  
  @@index([clientId])
  @@index([key])
  @@map("api_keys")
}
```

**Authentication:**
- Header: `X-API-Key: <key>` or `Authorization: Bearer <key>`
- Tenant-scoped validation
- Optional expiration and permissions

#### **Other Models**
- **InventoryHistory**: Audit trail for inventory changes (PURCHASE, SALE, ADJUSTMENT, RETURN, DAMAGE, TRANSFER)
- **ClientSettings**: Tenant-specific configuration (company info, notifications, thresholds)
- **Country & Currency**: Localization data
- **PerformanceMetrics**: Core Web Vitals tracking (FCP, LCP, FID, CLS, TTFB, etc.)

---

## 🔐 Authentication & Authorization

### Authentication Methods

#### 1. **JWT-Based Authentication** (Primary)
- **Endpoint**: `POST /api/auth/login`
- **Token Generation**: `jsonwebtoken` with `JWT_SECRET`
- **Expiration**: 24 hours (default)
- **Payload**:
  ```typescript
  {
    userId: string;
    email: string;
    role: Role;
    clientId?: string;  // null for MASTER_ADMIN
    iat: number;
    exp: number;
  }
  ```
- **Usage**: All authenticated API routes
- **Header**: `Authorization: Bearer <token>`

#### 2. **API Key Authentication**
- **Endpoints**: `/api/public/*`
- **Validation**: `src/lib/api-key-middleware.ts`
- **Headers**: 
  - `X-API-Key: <key>` OR
  - `Authorization: Bearer <key>`
- **Scope**: Tenant-scoped via `clientId` from API key
- **Features**: Expiration, permissions, last-used tracking

#### 3. **Guest Access Authentication**
- **Endpoint**: `POST /api/guest/auth`
- **Flow**: 
  1. Client provides `slug` and `password`
  2. Server validates against `Client.guestPassword` and `guestAccessEnabled`
  3. JWT token issued with `type: 'guest'`
  4. Token stored in cookie: `guest_token_{slug}`
  5. Cookie expiration: 24 hours
- **Payload**:
  ```typescript
  {
    type: 'guest';
    clientId: string;
    clientSlug: string;
    clientName: string;
    iat: number;
    exp: number;
  }
  ```
- **Access**: Read-only product catalog, shopping cart, order placement

### Authorization Layers

#### 1. **Role Hierarchy**
```typescript
enum Role {
  MASTER_ADMIN = 4,  // Platform-wide, no clientId
  ADMIN = 3,         // Full tenant access
  MANAGER = 2,       // Inventory/product management
  USER = 1           // Read-only
}
```

#### 2. **Resource Guards**
Located in `src/lib/`:
- `requireAuth()` - Basic authentication check
- `requireAdmin()` - Admin role required
- `authorizeSuperAdmin()` - MASTER_ADMIN only
- `withJWTValidation()` - Wrapper for JWT validation
- `getTenantFromRequest()` - Tenant resolution and validation
- `guest-auth-guard.ts` - Guest token validation

#### 3. **Tenant Isolation**
- All tenant-scoped queries filtered by `clientId`
- Super admins (`clientId: null`) bypass tenant filtering
- Guest tokens scoped to single tenant
- API keys scoped to tenant via `ApiKey.clientId`

---

## 🔌 API Architecture

### API Route Structure

```
/api
├── auth/
│   ├── login          POST    - User login
│   └── register       POST    - User registration
│
├── admin/              (Super Admin Routes)
│   ├── clients/        GET, POST, PUT, DELETE
│   ├── products/       GET, POST, PUT, DELETE
│   ├── api-keys/       GET, POST, PUT, DELETE
│   └── migrate/        POST    - Data migration
│
├── tenants/
│   └── [slug]/
│       ├── GET         - Get tenant info
│       └── settings/   GET, PUT
│
├── products/           (Tenant-Scoped)
│   ├── GET             - List products (with filters)
│   ├── POST            - Create product
│   ├── [id]/
│   │   ├── GET         - Get product
│   │   ├── PUT         - Update product
│   │   └── DELETE      - Soft delete
│   ├── sku/
│   │   └── [sku]/      GET, PUT - SKU-based operations
│   └── bulk/           POST    - Bulk import/export
│
├── categories/         GET, POST, PUT, DELETE
│
├── media/
│   ├── GET             - List media
│   ├── POST            - Upload media
│   ├── [id]/
│   │   ├── GET         - Get media
│   │   ├── PUT         - Update media
│   │   └── DELETE      - Delete media
│   ├── bulk-upload/    POST    - Bulk upload (up to 20MB)
│   ├── assign/         POST    - Assign media to product
│   ├── reprocess/      POST    - Regenerate embeddings
│   ├── refresh-urls/   POST    - Refresh S3 signed URLs
│   └── analytics/      GET     - Media analytics
│
├── inventory/
│   ├── POST            - Update inventory
│   ├── GET             - Inventory history
│   └── analytics/      GET     - Inventory analytics
│
├── orders/             (Tenant-Scoped)
│   ├── GET             - List orders
│   ├── POST            - Create order
│   └── [id]/
│       ├── GET         - Get order
│       └── PUT         - Update order status
│
├── guest/              (Guest Access)
│   ├── auth/           POST    - Guest login
│   ├── products/       GET     - List products (read-only)
│   ├── products/[id]   GET     - Get product (read-only)
│   ├── categories/     GET     - List categories
│   ├── orders/         POST    - Place order
│   ├── orders/[id]     GET     - Get order
│   ├── set-token/      POST    - Set guest token cookie
│   ├── get-token/      GET     - Get guest token from cookie
│   └── logout/         POST    - Logout (clear cookie)
│
├── public/             (API Key Required)
│   ├── products/       GET     - List products
│   ├── products/sku/[sku] GET  - Get product by SKU
│   ├── inventory/      GET     - Get inventory levels
│   └── search/
│       └── by-image/   POST    - Visual search
│
├── search/
│   ├── by-image/       POST    - Visual search (authenticated)
│   └── by-image-simple/ POST   - Simplified visual search
│
├── settings/
│   ├── GET             - Get client settings
│   ├── PUT             - Update client settings
│   └── guest-access/   PUT     - Update guest access config
│
├── users/
│   ├── GET             - List users
│   ├── POST            - Create user
│   ├── [id]/
│   │   ├── GET         - Get user
│   │   ├── PUT         - Update user
│   │   └── DELETE      - Delete user
│   └── profile/        GET, PUT - Current user profile
│
├── analytics/
│   └── performance/    POST    - Record performance metrics
│
├── data-quality/
│   ├── GET             - Data quality overview
│   ├── failing-media/  GET     - Media processing failures
│   └── products-missing-media/ GET - Products without media
│
└── health/             GET     - Health check
```

### Key API Patterns

#### 1. **Tenant Resolution**
```typescript
// Pattern used in most tenant-scoped routes
const { clientId, slug } = await getTenantFromRequest(request);
// OR
const clientId = getClientIdFromRequest(request);  // From JWT or header
```

#### 2. **Authentication Middleware**
```typescript
// JWT validation
const user = getUserFromRequest(request);
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Role check
if (user.role !== 'ADMIN' && user.role !== 'MASTER_ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

#### 3. **Pagination**
```typescript
// Query params
const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
const offset = (page - 1) * limit;

// Response format
{
  data: T[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

#### 4. **Error Handling**
- Standardized error responses: `{ error: string, message?: string }`
- Status codes: `400` (Bad Request), `401` (Unauthorized), `403` (Forbidden), `404` (Not Found), `409` (Conflict), `500` (Internal Server Error)
- Error logging with context (file, operation, user)

#### 5. **S3 Signed URLs**
```typescript
// Generate presigned URLs for media (7-day expiration)
const signedUrl = await generateSignedUrl(s3Key, 7 * 24 * 60 * 60);
```

---

## 🎨 Frontend Architecture

### Routing Structure

```
/                           → Home/Dashboard (authenticated)
/login                      → Authentication page (public)
/admin/*                    → Super Admin Panel (MASTER_ADMIN)
  ├── clients/              → Client management
  ├── products/             → All products across tenants
  ├── api-keys/             → API key management
  ├── analytics/            → Platform analytics
  └── system/               → System settings
/guest/[slug]/*             → Guest Catalog & E-commerce (SSR)
  ├── /                     → Guest login page
  ├── /catalog              → Product catalog
  ├── /product/[id]         → Product detail
  ├── /cart                 → Shopping cart
  └── /checkout             → Checkout flow
/products                   → Product Management (authenticated)
  ├── /                     → Product list
  ├── /new                  → Create product
  └── /[id]                 → Product detail/edit
/inventory                  → Inventory Dashboard
/media                      → Media Library
/orders                     → Order Management
  └── /[id]                 → Order detail
/settings                   → Client Settings
/reports                    → Analytics & Reports
/data-quality               → Data Quality Dashboard
/performance                → Performance Metrics
/profile                    → User Profile
```

### Key Components

#### Layout & Navigation
- **`DashboardLayout`** (`src/components/DashboardLayout.tsx`): Main admin layout with sidebar navigation
- **`AuthProvider`** (`src/components/AuthProvider.tsx`): Authentication context provider
- **`TenantProvider`** (`src/contexts/TenantContext.tsx`): Tenant/client context for SSR pages

#### Product Management
- **`ProductTile`** (`src/components/ProductTile.tsx`): Product display card with media
- **`SearchByImageModal`** (`src/components/SearchByImageModal.tsx`): Visual search interface
- **`ProductMediaSelector`** (`src/components/ProductMediaSelector.tsx`): Media selection for products

#### Media Management
- **`MediaLibrary`** (`src/components/MediaLibrary.tsx`): Media browser and upload
- **`BulkMediaUpload`** (`src/components/BulkMediaUpload.tsx`): Bulk media upload interface
- **`MediaUploadPresigned`** (`src/components/ui/MediaUploadPresigned.tsx`): Presigned URL upload
- **`OptimizedImage`** (`src/components/OptimizedImage.tsx`): Next.js Image wrapper with S3 support

#### Guest E-Commerce
- **`GuestCatalogClient`** (`src/app/guest/[slug]/catalog/page.tsx`): Catalog view (SSR + Client)
- **`GuestCartClient`** (`src/contexts/GuestCartContext.tsx`): Shopping cart context
- **`GuestLoginForm`** (`src/app/guest/[slug]/GuestLoginForm.tsx`): Guest authentication form

#### Dashboards
- **`InventoryDashboard`** (`src/components/InventoryDashboard.tsx`): Inventory overview
- **`DataQualityDashboard`** (`src/components/DataQualityDashboard.tsx`): Data quality metrics
- **`PerformanceDashboard`** (`src/components/PerformanceDashboard.tsx`): Performance metrics
- **`MediaDashboard`** (`src/components/MediaDashboard.tsx`): Media analytics

#### UI Components (`src/components/ui/`)
- **Radix UI Primitives**: Checkbox, Label, Select, Modal
- **Custom Components**: Button, Card, Input, Badge, Loading, AnimatedCard
- **Form Components**: CategorySelect, CategoryDropdown
- **Media Components**: MediaPreview, MediaUpload, MediaUploadNew

### Styling Approach
- **Tailwind CSS**: Utility-first styling (primary)
- **CSS Modules**: Component-specific styles (`globals.css`, `mobile-responsive.css`)
- **Material UI**: Legacy components (DataGrid, some forms)
- **Responsive Design**: Mobile-first with breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`)

---

## 🎯 Core Features

### 1. Product Management
- **CRUD Operations**: Full create, read, update, delete with soft delete
- **SKU Management**: Unique SKUs per tenant, duplicate detection
- **Variations**: JSON-based product variations (size, color, material, etc.)
- **Categories**: Hierarchical category system with many-to-many product relations
- **Media**: Multiple images/videos per product with primary image selection
- **Inventory Tracking**: Stock levels, minimum thresholds, preorder support
- **Bulk Operations**: CSV import/export with validation
- **Search & Filtering**: Text search, category filter, price range, stock status

### 2. Visual Search (AI-Powered)
- **Technology**: CLIP embeddings (512-dimension vectors)
- **Service**: External FastAPI service (`/embed-image`, `/embed-video`)
- **Storage**: PostgreSQL `vector` type with pgvector extension
- **Search Method**: Cosine similarity (`<#>` operator, negative inner product)
- **Features**:
  - Image-to-image search
  - Video frame search
  - Similarity threshold filtering (60%+ for internal, 95%+ for public API)
  - Product grouping (best match per product)
  - Performance optimization with vector indexes (HNSW/IVFFLAT)
- **Endpoints**:
  - `/api/search/by-image` (authenticated)
  - `/api/public/search/by-image` (API key)
  - `/api/search/by-image-simple` (simplified)

**Performance Tuning:**
- HNSW: `ef_search=50-100` for production, `ef_search=200+` for high recall
- IVFFLAT: `probes=10-50` for images, `probes=20-100` for video frames
- Frame budget: 1-5 frames per second for videos
- Index parameters: `m=16-32`, `ef_construction=64-128`

### 3. Guest E-Commerce
- **Access Control**: Password-protected guest sessions
- **Features**:
  - Product catalog browsing (SSR for SEO)
  - Product detail pages
  - Shopping cart (client-side state)
  - Checkout flow with address collection
  - Order placement with payment info (UTR, transaction number, proof upload)
  - Order confirmation
- **Routes**: `/guest/[slug]/*` (server-side rendered)
- **Session**: 24-hour JWT tokens stored in cookies
- **Currency**: Display prices in client's currency

### 4. Media Management
- **Storage**: AWS S3 with presigned URLs
- **Upload Methods**:
  - Direct upload (multipart/form-data)
  - Presigned URL upload (client-side)
  - Bulk upload (up to 20MB per request)
- **Processing Pipeline**:
  1. Upload to S3 (`clients/{clientId}/media/{year}/{month}/{filename}`)
  2. Metadata extraction (EXIF, dimensions, duration)
  3. Thumbnail generation (videos)
  4. Embedding generation (images) - async via FastAPI service
  5. Video frame extraction (videos) - async
  6. Frame embedding generation (video frames) - async
  7. Status tracking (`pending` → `processing` → `completed` / `error`)
- **Organization**: S3 folder structure per tenant with date-based organization
- **Features**:
  - Media library browser
  - Assign media to products
  - Bulk operations (assign, delete, reprocess)
  - URL refresh (regenerate signed URLs)
  - Analytics (upload counts, processing status, storage usage)

### 5. Inventory Management
- **Stock Tracking**: Real-time stock levels with history
- **History Types**: PURCHASE, SALE, ADJUSTMENT, RETURN, DAMAGE, TRANSFER
- **Audit Trail**: Complete history with user attribution, timestamps, reasons
- **Reports**: 
  - Low stock alerts (below `minStock`)
  - Inventory analytics (turnover, value at risk)
  - Category-wise analysis
  - CSV export
- **Preorders**: Support for products with `allowPreorder: true`

### 6. Order Management
- **Order Flow**: `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED` / `CANCELLED`
- **Customer Info**: Name, email, phone
- **Addresses**: Shipping and billing addresses (JSON storage)
- **Payment Tracking**: 
  - UTR (Unique Transaction Reference)
  - Transaction number
  - Payment proof upload (S3)
- **Line Items**: Product snapshot at order time (price, name, SKU preserved)
- **Totals**: Subtotal, tax, shipping, total
- **Notes**: Order-specific notes
- **Features**:
  - Order list with filters (status, date range, customer)
  - Order detail view
  - Status updates
  - Payment proof upload
  - Order analytics

### 7. Analytics & Reporting
- **Performance Metrics**: Core Web Vitals tracking (FCP, LCP, FID, CLS, TTFB, FMP, TTI)
  - Client-side collection via Performance API
  - POST to `/api/analytics/performance`
  - Storage in `PerformanceMetrics` table
- **Data Quality**:
  - Media validation (processing failures, missing embeddings)
  - Products missing media
  - Missing product data (descriptions, categories, etc.)
- **Inventory Analytics**:
  - Stock levels by category
  - Low stock alerts
  - Value at risk calculations
- **Order Analytics**:
  - Revenue by period
  - Order status distribution
  - Average order value

### 8. API Key Management
- **Multi-Key Support**: Multiple API keys per tenant
- **Permissions**: Granular permission system (string array)
- **Features**:
  - Key generation (unique, cryptographically secure)
  - Optional expiration
  - Last used tracking
  - Active/inactive status
  - Secret key support (for HMAC authentication - optional)

### 9. Multi-Tenant Management (Super Admin)
- **Client Management**: CRUD operations for tenants
- **Features**:
  - Create/update/delete clients
  - Plan management (STARTER, PROFESSIONAL, ENTERPRISE)
  - Guest access configuration
  - Country/currency assignment
  - Activation/deactivation
- **Platform Analytics**: Aggregated metrics across all tenants
- **Data Migration**: Tools for tenant data migration

---

## 🔧 Infrastructure & Services

### External Services

#### 1. **Embedding Service** (FastAPI)
- **Location**: `services/embedding_service/`
- **Technology**: Python FastAPI, CLIP model (OpenAI CLIP)
- **Endpoints**:
  - `POST /embed-image` - Generate image embedding (512-dim vector)
  - `POST /embed-video` - Generate video embedding (frame extraction + embedding)
- **Docker**: `Dockerfile` provided, runs on port 8000
- **Environment**: `EMBEDDING_SERVICE_URL` (default: `http://localhost:8000`)
- **Deployment**: Separate service, can be containerized or serverless

#### 2. **AWS S3**
- **Purpose**: Media storage (images, videos, payment proofs)
- **Configuration**:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION` (default: `us-east-1`)
  - `S3_BUCKET_NAME` or `AWS_S3_BUCKET`
- **Features**:
  - Presigned URLs for uploads/downloads (7-day expiration)
  - CORS configuration for client-side uploads
  - Folder structure: `clients/{clientId}/media/{year}/{month}/{filename}`
  - Lifecycle policies (recommended for cost optimization)

#### 3. **PostgreSQL**
- **Extensions Required**:
  - `pgvector` - Vector similarity search
  - Standard extensions (UUID, etc.)
- **Connection**: `DATABASE_URL` (PostgreSQL connection string)
- **Connection Pooling**: Handled by Prisma
- **Migrations**: Prisma migrations in `prisma/migrations/`

### Environment Variables

#### Required
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

#### Optional (for full functionality)
```env
# NextAuth (if using NextAuth.js features)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"

# AWS S3 (for media storage)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-bucket-name"
# OR
AWS_S3_BUCKET="your-bucket-name"

# Embedding Service
EMBEDDING_SERVICE_URL="http://localhost:8000"

# Email (for notifications - future)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASS="your-password"
```

### Infrastructure as Code
- **Terraform**: Configuration in `infra/terraform/`
  - `main.tf` - Main infrastructure definitions
  - `variables.tf` - Variable definitions
  - `outputs.tf` - Output values
  - `terraform.tfvars.example` - Example configuration

---

## 📦 Key Libraries & Dependencies

### Core
- `next`: 15.5.9 - Next.js framework
- `react`: 19.1.2 - React library
- `react-dom`: 19.1.2 - React DOM
- `typescript`: 5.x - TypeScript compiler
- `prisma`: 6.16.2 - Prisma ORM
- `@prisma/client`: 6.16.2 - Prisma client

### Authentication & Security
- `jsonwebtoken`: 9.0.2 - JWT token generation/verification
- `bcrypt`: 6.0.0 - Password hashing (Node.js native)
- `bcryptjs`: 3.0.2 - Password hashing (JS fallback)
- `@aws-sdk/client-s3`: 3.890.0 - AWS S3 SDK
- `@aws-sdk/s3-request-presigner`: 3.890.0 - Presigned URL generation

### UI & Styling
- `tailwindcss`: 3.4.17 - Utility-first CSS framework
- `@tailwindcss/forms`: 0.5.10 - Form styling
- `@tailwindcss/typography`: 0.5.16 - Typography plugin
- `@radix-ui/react-*`: Accessible component primitives
- `framer-motion`: 12.23.13 - Animation library
- `lucide-react`: 0.544.0 - Icon library
- `sonner`: 2.0.7 - Toast notifications
- `@mui/material`: 7.3.2 - Material UI (legacy)
- `@mui/x-data-grid`: 8.11.2 - Data grid component

### File Processing
- `sharp`: 0.34.4 - Image processing (Next.js built-in)
- `exifr`: 7.1.3 - EXIF metadata extraction
- `multer`: 2.0.2 - Multipart form data handling
- `multer-s3`: 3.0.1 - S3 upload middleware
- `form-data`: 4.0.4 - Form data handling

### Data Processing
- `papaparse`: 5.5.3 - CSV parsing
- `xlsx`: 0.18.5 - Excel file handling
- `zod`: 3.25.76 - Schema validation

### Utilities
- `clsx`: 2.1.1 - Conditional class names
- `tailwind-merge`: 3.3.1 - Tailwind class merging
- `commander`: 11.1.0 - CLI command parsing
- `dotenv`: 17.2.2 - Environment variable loading
- `pino`: 8.16.2 - Structured logging
- `pino-pretty`: 10.2.3 - Pretty log formatting

### Testing
- `vitest`: 2.1.8 - Test framework

### Development
- `tsx`: 4.7.0 - TypeScript execution
- `eslint`: 9 - Linting
- `eslint-config-next`: 15.5.7 - Next.js ESLint config

---

## 🚀 Development Workflow

### Setup Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema (dev)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Seed database (single tenant)
npm run db:seed

# Seed database (multi-tenant SaaS)
npm run db:seed-saas

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests once
npm run test:run

# Prisma Studio (database GUI)
npm run db:studio
```

### Key Scripts

```bash
# Media & Embeddings
npm run reembed              # Regenerate all embeddings
npm run backfill:media       # Backfill media data from products

# Testing & E2E
npm run e2e:test             # E2E visual search tests
npm run e2e:cleanup          # Cleanup test data

# Database Operations
npm run db:copy-prod         # Copy production DB to local
npm run db:copy-prod-improved # Improved production copy script
npm run db:backup-prod       # Backup production database
npm run db:deep-clean        # Deep clean local database
npm run db:deep-copy         # Deep copy production to local
npm run db:check-migrations  # Check migration status in production

# User Management
npm run create:users         # Create test users
```

### Database Migrations

#### Create Migration
```bash
npx prisma migrate dev --name migration_name
```

#### Apply Migrations (Production)
```bash
npx prisma migrate deploy
```

#### Migration History
Migrations are stored in `prisma/migrations/`:
- `0_init/` - Initial schema
- `20250101000000_add_payment_fields_to_orders/` - Payment fields
- `20250926220000_update_role_enum/` - Role enum updates
- `20251009022100_add_product_media_and_guest_access/` - Media and guest access
- `20251230120000_add_orders_and_order_items/` - Orders system

### Development Tips

1. **Environment Setup**: Copy `env.example` to `.env.local` and fill in values
2. **Database**: Use Prisma Studio (`npm run db:studio`) for database browsing
3. **Hot Reload**: Next.js Turbopack enabled for fast refresh
4. **Type Checking**: TypeScript in strict mode, but build errors ignored (`ignoreBuildErrors: true`)
5. **Linting**: ESLint configured but ignored during builds (`ignoreDuringBuilds: true`)

---

## 🎯 Deployment

### Vercel Configuration

- **Platform**: Vercel (primary deployment target)
- **Build Command**: `npm run build` (runs `prisma generate && next build`)
- **Install Command**: `npm install && npx prisma generate`
- **Function Timeouts**:
  - Standard: 30 seconds
  - Upload endpoints: 60 seconds
  - Bulk upload: 300 seconds (5 minutes)
- **Memory**: Up to 3008MB for bulk operations
- **Environment Variables**: Set in Vercel dashboard

### Production Considerations

1. **Database Migrations**: Run `npx prisma migrate deploy` on deploy (or via CI/CD)
2. **S3 CORS**: Configure CORS for client-side uploads
3. **Embedding Service**: Deploy separately (Docker container, serverless, or VM)
4. **Rate Limiting**: Implement rate limiting for public APIs (recommended)
5. **Monitoring**: Set up error tracking (Sentry, LogRocket, etc.)
6. **Backups**: Regular database backups (automated)
7. **CDN**: Vercel CDN for static assets, CloudFront for S3 (optional)

### Environment Setup (Production)

```env
# Database (Production PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Authentication (Strong secrets)
JWT_SECRET="<generate-strong-secret>"
NEXTAUTH_SECRET="<generate-strong-secret>"

# Application URL
NEXTAUTH_URL="https://your-domain.com"

# AWS S3 (Production bucket)
AWS_ACCESS_KEY_ID="<production-key>"
AWS_SECRET_ACCESS_KEY="<production-secret>"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="<production-bucket>"

# Embedding Service (Production endpoint)
EMBEDDING_SERVICE_URL="https://embedding-service.example.com"
```

---

## 🔍 Code Organization

### Directory Structure

```
catalog-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard routes group
│   │   ├── admin/              # Super admin pages
│   │   ├── api/                # API routes
│   │   ├── guest/              # Guest e-commerce pages (SSR)
│   │   ├── products/           # Product pages
│   │   ├── inventory/          # Inventory page
│   │   ├── media/              # Media page
│   │   ├── orders/             # Order pages
│   │   ├── settings/           # Settings page
│   │   ├── reports/            # Reports page
│   │   ├── data-quality/       # Data quality page
│   │   ├── performance/        # Performance page
│   │   ├── profile/            # Profile page
│   │   ├── login/              # Login page
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css         # Global styles
│   │   └── mobile-responsive.css
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   └── [feature]/          # Feature-specific components
│   │
│   ├── contexts/               # React contexts
│   │   ├── TenantContext.tsx   # Tenant context
│   │   └── GuestCartContext.tsx # Guest cart context
│   │
│   ├── hooks/                  # Custom React hooks
│   │   └── useFileInput.ts
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── auth.ts             # Authentication helpers
│   │   ├── auth-middleware.ts  # Auth middleware
│   │   ├── jwt.ts              # JWT utilities
│   │   ├── tenant.ts           # Tenant resolution
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── search.ts           # Vector similarity search
│   │   ├── s3-upload.ts        # S3 upload utilities
│   │   ├── s3-folder-manager.ts # S3 folder management
│   │   ├── embeddings.ts       # Embedding generation
│   │   ├── rate-limit.ts       # Rate limiting
│   │   ├── api-key-middleware.ts # API key auth
│   │   ├── guest-auth.ts       # Guest authentication
│   │   ├── guest-auth-guard.ts # Guest auth guard
│   │   ├── aws.ts              # AWS utilities
│   │   ├── pg.ts               # PostgreSQL raw queries
│   │   ├── utils.ts            # General utilities
│   │   ├── log.ts              # Logging utilities
│   │   ├── seo.ts              # SEO utilities
│   │   └── ...                 # Other utilities
│   │
│   ├── types/                  # TypeScript types
│   │   ├── index.ts
│   │   └── cart.ts
│   │
│   └── middleware.ts           # Next.js middleware
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   ├── seed.ts                 # Single-tenant seed
│   ├── seed-saas.ts            # Multi-tenant seed
│   └── seed-countries-currencies.ts
│
├── services/
│   └── embedding_service/      # FastAPI embedding service
│       ├── app.py
│       ├── Dockerfile
│       ├── requirements.txt
│       └── README.md
│
├── infra/
│   └── terraform/              # Infrastructure as Code
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars.example
│
├── scripts/                    # Utility scripts
│   ├── copy-prod-to-local.ts
│   ├── backup-prod-db.ts
│   ├── reembed_all.ts
│   └── ...
│
├── tests/                      # Test files
│   ├── embedding_smoke.sh
│   ├── image-similarity.spec.ts
│   └── ...
│
├── public/                     # Static assets
│   ├── favicon.ico
│   └── sample-data/
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.mjs
├── vitest.config.ts
├── vercel.json
└── README.md
```

### Key Libraries by Category

#### Authentication & Authorization
- `src/lib/auth.ts` - Basic auth helpers
- `src/lib/auth-middleware.ts` - Auth middleware wrappers
- `src/lib/jwt.ts` - JWT token management
- `src/lib/tenant.ts` - Tenant resolution
- `src/lib/api-key-middleware.ts` - API key authentication
- `src/lib/guest-auth.ts` - Guest authentication
- `src/lib/guest-auth-guard.ts` - Guest auth guards

#### Database
- `src/lib/prisma.ts` - Prisma client singleton with health checks
- `src/lib/pg.ts` - Raw PostgreSQL queries (for vector search)

#### Media & Storage
- `src/lib/aws.ts` - AWS S3 utilities (signed URLs, etc.)
- `src/lib/s3-upload.ts` - S3 upload helpers
- `src/lib/s3-folder-manager.ts` - S3 folder structure management

#### Search & Embeddings
- `src/lib/search.ts` - Vector similarity search functions
- `src/lib/embeddings.ts` - Embedding generation and processing

#### Utilities
- `src/lib/utils.ts` - General utilities (cn, etc.)
- `src/lib/rate-limit.ts` - Rate limiting utilities
- `src/lib/log.ts` - Structured logging
- `src/lib/seo.ts` - SEO metadata generation
- `src/lib/data-quality.ts` - Data quality checks

---

## 🐛 Known Issues & Technical Debt

### Build Configuration

1. **TypeScript Build Errors Ignored**
   - `ignoreBuildErrors: true` in `next.config.ts`
   - **Impact**: Production builds may contain type errors
   - **Recommendation**: Fix type errors gradually, remove flag

2. **ESLint Errors Ignored**
   - `ignoreDuringBuilds: true` in `next.config.ts`
   - **Impact**: Linting issues don't block builds
   - **Recommendation**: Fix ESLint errors, enable build-time checks

### Code Quality

3. **Middleware Minimal**
   - Only handles bulk upload size check
   - **Missing**: Authentication middleware, tenant resolution, rate limiting
   - **Recommendation**: Implement comprehensive middleware

4. **Rate Limiting Incomplete**
   - Basic rate limiting utilities exist but not applied consistently
   - **Missing**: Global rate limiting, per-endpoint limits, IP-based limits
   - **Recommendation**: Implement rate limiting middleware

5. **Error Logging Basic**
   - Console logging used throughout
   - **Missing**: Structured logging, error tracking (Sentry, etc.)
   - **Recommendation**: Implement structured logging with Pino, integrate error tracking

6. **Testing Coverage Low**
   - Limited test files in `tests/` directory
   - **Missing**: Unit tests, integration tests, E2E tests
   - **Recommendation**: Increase test coverage, add CI/CD testing

### Security

7. **Guest Password Storage**
   - Plain text passwords in `Client.guestPassword`
   - **Risk**: Password exposure if database compromised
   - **Recommendation**: Hash guest passwords with bcrypt

8. **API Key Security**
   - API keys stored in plain text (though hashed storage not necessary if properly secured)
   - **Recommendation**: Ensure proper access controls, consider key rotation

9. **CORS Configuration**
   - Some API routes allow `*` origin
   - **Recommendation**: Restrict CORS to specific domains in production

### Performance

10. **Vector Index Optimization**
    - Vector indexes may not be optimized for scale
    - **Recommendation**: Monitor query performance, tune HNSW/IVFFLAT parameters

11. **S3 Signed URL Caching**
    - Signed URLs regenerated on every request
    - **Recommendation**: Cache signed URLs with appropriate expiration

12. **Database Query Optimization**
    - Some N+1 query patterns may exist
    - **Recommendation**: Review queries, add database indexes, use Prisma `include` strategically

### Architecture

13. **Embedding Service Coupling**
    - Tightly coupled to embedding service URL
    - **Recommendation**: Add retry logic, fallback mechanisms, health checks

14. **Media Processing Async**
    - Embedding generation is async but not properly queued
    - **Recommendation**: Implement job queue (Bull, BullMQ, AWS SQS) for async processing

15. **Multi-Tenant Routing**
    - Tenant resolution relies on headers, may not work well with subdomain routing
    - **Recommendation**: Implement proper subdomain middleware

---

## 🔐 Security Features

### Implemented

1. ✅ **JWT Authentication**: Secure token-based authentication with expiration
2. ✅ **Password Hashing**: bcrypt with salt rounds
3. ✅ **Role-Based Access Control**: 4-tier permission system
4. ✅ **Tenant Isolation**: Complete data separation via `clientId`
5. ✅ **Input Validation**: Zod schemas for API validation
6. ✅ **SQL Injection Protection**: Prisma ORM prevents SQL injection
7. ✅ **CORS Headers**: Configured (though needs restriction in production)
8. ✅ **XSS Protection**: Content Security Policy headers in `next.config.ts`
9. ✅ **API Key Authentication**: Secure API key validation
10. ✅ **Signed URLs**: Presigned S3 URLs with expiration

### Recommendations for Enhancement

1. **Rate Limiting**: Implement comprehensive rate limiting
2. **Guest Password Hashing**: Hash guest passwords instead of plain text
3. **CORS Restrictions**: Limit CORS to specific domains in production
4. **HTTPS Enforcement**: Enforce HTTPS in production (Vercel handles this)
5. **Security Headers**: Add additional security headers (HSTS, CSP, etc.)
6. **Input Sanitization**: Add input sanitization for user-generated content
7. **Audit Logging**: Implement audit logs for sensitive operations
8. **Secret Rotation**: Implement secret rotation strategy for JWT and API keys

---

## 📈 Scalability Considerations

### Database

- **Indexes**: Key indexes on `clientId`, `sku`, `orderNumber`, `email`, `slug`
- **Vector Indexes**: HNSW or IVFFLAT indexes on embeddings for fast similarity search
- **Connection Pooling**: Prisma handles connection pooling
- **Read Replicas**: Consider read replicas for analytics queries

### Performance

- **Image Optimization**: Next.js Image component with WebP/AVIF formats
- **Static Asset Caching**: Next.js static asset caching (1 year)
- **API Response Caching**: Cache headers configured (60 seconds for API routes)
- **Bulk Operations**: Pagination and batch processing for large datasets

### Multi-Tenancy

- **Row-Level Security**: Complete data isolation via `clientId`
- **Tenant-Specific S3 Folders**: Organized folder structure per tenant
- **Tenant Resolution**: Efficient tenant lookup via indexed `slug` field

### Recommendations

1. **Caching Layer**: Implement Redis for caching frequently accessed data
2. **CDN**: Use CloudFront or Vercel Edge Network for static assets
3. **Database Sharding**: Consider sharding by tenant for very large scale
4. **Job Queue**: Implement job queue for async processing (embeddings, media processing)
5. **Monitoring**: Set up APM (Application Performance Monitoring) for production

---

## 📚 Documentation

### Existing Documentation

- **`README.md`**: Basic setup and usage
- **`APP_CONTEXT.md`**: This document (complete application context)
- **`API_DOCUMENTATION.md`**: API endpoint documentation
- **`AUDIT_REPORT.md`**: Application audit report
- **`GUEST_ACCESS.md`**: Guest access implementation details
- **`GUEST_E_COMMERCE_IMPLEMENTATION.md`**: Guest e-commerce feature docs
- **`GUEST_SSR_MIGRATION.md`**: SSR migration for guest pages
- **`PRODUCTION_MIGRATION.md`**: Production deployment guide
- **`VERCEL_DEPLOYMENT.md`**: Vercel deployment instructions
- **`AWS_SETUP.md`**: AWS S3 setup guide
- **`SAAS_README.md`**: Multi-tenant SaaS setup
- **`UNIQUE_NAMING.md`**: Naming conventions
- **`services/embedding_service/README.md`**: Embedding service docs

### Recommended Additional Documentation

1. **API Usage Examples**: Code examples for common API operations
2. **Deployment Guide**: Step-by-step production deployment
3. **Troubleshooting Guide**: Common issues and solutions
4. **Contributing Guide**: Development guidelines and contribution process
5. **Architecture Decision Records (ADRs)**: Document architectural decisions

---

## 🎓 Learning Resources

### Technologies Used

- **Next.js 15**: [Next.js Documentation](https://nextjs.org/docs)
  - App Router, Server Components, API Routes
- **Prisma**: [Prisma Documentation](https://www.prisma.io/docs)
  - ORM patterns, migrations, multi-tenancy
- **PostgreSQL pgvector**: [pgvector Documentation](https://github.com/pgvector/pgvector)
  - Vector similarity search, indexing
- **AWS S3**: [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
  - Presigned URLs, CORS, folder structure
- **CLIP Embeddings**: [OpenAI CLIP](https://openai.com/research/clip)
  - Visual similarity search, embedding generation
- **Multi-Tenant Architecture**: [Multi-Tenancy Patterns](https://docs.microsoft.com/en-us/azure/sql-database/saas-tenancy-app-design-patterns)

---

## 📝 Summary

**Stock Mind** is a sophisticated multi-tenant SaaS platform with:

✅ **Complete Feature Set**:
- Multi-tenant product and inventory management
- AI-powered visual search with CLIP embeddings
- Guest e-commerce with shopping cart and checkout
- Media management with S3 and automated processing
- Order management with payment tracking
- API-first design with API key authentication
- Role-based access control with 4-tier permissions

✅ **Modern Technology Stack**:
- Next.js 15 with React 19 (App Router)
- PostgreSQL with pgvector for vector search
- AWS S3 for media storage
- FastAPI embedding service
- TypeScript for type safety

✅ **Well-Structured Codebase**:
- Clear separation of concerns
- Comprehensive utility libraries
- Reusable components
- Type-safe API routes

⚠️ **Areas for Improvement**:
- Build configuration (type errors, ESLint ignored)
- Testing coverage
- Error logging and monitoring
- Rate limiting implementation
- Guest password security
- Async job processing

The application is **production-ready** with some recommended enhancements for scale and security. The architecture is solid and extensible, making it suitable for continued development and scaling.

---

**Last Updated**: January 2025  
**Maintained By**: Development Team  
**Questions**: Refer to documentation or open an issue
