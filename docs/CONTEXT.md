# StockMind — Full Application Context

> Multi-tenant SaaS catalog & inventory management platform with guest e-commerce, visual search, and media management.

---

## Tech Stack
s
| Layer | Technology |
|---|---|
| Framework | Next.js 15.5.9 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 3, Framer Motion, Radix UI, MUI, Lucide icons |
| ORM | Prisma 6 |
| Database | PostgreSQL with pgvector extension |
| Storage | AWS S3 (presigned URLs, direct upload) |
| Auth | Custom JWT (bcrypt passwords, role-based) |
| AI/ML | OpenAI CLIP embeddings via Python FastAPI microservice |
| Image Processing | Sharp (server-side), Exifr (EXIF stripping) |
| Deployment | Vercel (frontend + API), Docker (embedding service) |
| Infrastructure | Terraform (S3, SQS, IAM, CloudWatch, SNS) |
| Testing | Vitest |
| Linting | ESLint 9 |

---

## Project Structure

```
catalog-app/
├── prisma/                    # Database schema, migrations, seeds
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.ts                # Default seed
│   ├── seed-saas.ts           # Multi-tenant SaaS seed
│   └── seed-countries-currencies.ts
├── public/                    # Static assets
│   └── sample-data/
├── services/
│   └── embedding_service/     # Python CLIP embedding microservice
│       ├── app.py             # FastAPI application
│       ├── Dockerfile
│       └── requirements.txt
├── infra/
│   └── terraform/             # AWS infrastructure as code
├── scripts/                   # Operational & maintenance scripts
│   ├── database/
│   ├── deployment/
│   ├── services/
│   ├── setup/
│   └── sql/
├── src/
│   ├── app/                   # Next.js App Router pages & API routes
│   │   ├── layout.tsx         # Root layout (AuthProvider, fonts, SEO)
│   │   ├── page.tsx           # Dashboard home
│   │   ├── middleware.ts      # Upload size enforcement
│   │   ├── sitemap.ts         # Dynamic sitemap
│   │   ├── robots.ts          # SEO robots.txt
│   │   ├── manifest.ts        # PWA manifest
│   │   ├── (dashboard)/       # Main app route group
│   │   ├── admin/             # Admin panel (layout + pages)
│   │   ├── guest/             # Guest/public catalog (layout + pages)
│   │   ├── api/               # All API route handlers
│   │   └── data-quality/      # Data quality dashboard
│   ├── components/            # Reusable React components
│   │   ├── ui/                # Primitives (Button, Input, Modal, Card, etc.)
│   │   └── *.tsx              # Feature components
│   ├── contexts/              # React Context providers
│   │   ├── GuestCartContext.tsx
│   │   └── TenantContext.tsx
│   ├── hooks/                 # Custom React hooks
│   │   └── useFileInput.ts
│   ├── lib/                   # Server/shared utilities
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # Auth helpers
│   │   ├── jwt.ts             # JWT create/validate/refresh
│   │   ├── aws.ts             # S3 client & signed URLs
│   │   ├── search.ts          # Vector similarity search
│   │   ├── embeddings.ts      # CLIP embedding generation
│   │   └── ...                # 30+ utility modules
│   └── types/                 # TypeScript interfaces
│       ├── index.ts           # Core domain types
│       └── cart.ts            # Cart types
├── tests/                     # Test files
├── docs/                      # Documentation
├── backups/                   # Database backups
├── s3-backups/                # S3 bucket backups
└── config files               # next.config.ts, tailwind.config.js, etc.
```

---

## Database Schema (Prisma)

### Enums

| Enum | Values |
|---|---|
| `Role` | MASTER_ADMIN, ADMIN, MANAGER, USER |
| `Plan` | STARTER, PROFESSIONAL, ENTERPRISE |
| `InventoryType` | PURCHASE, SALE, ADJUSTMENT, RETURN, DAMAGE, TRANSFER |
| `OrderStatus` | PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED |

### Models & Relationships

```
Country ──┐
           ├── Client ──┬── User
Currency ──┘             ├── Product ──┬── ProductMedia ── Media ──┬── ImageEmbedding
                         │             ├── ProductCategory         └── VideoFrame ── FrameEmbedding
                         │             ├── InventoryHistory
                         │             └── OrderItem
                         ├── Category (self-referencing hierarchy)
                         ├── ClientSettings (1:1)
                         ├── ApiKey
                         └── Order ── OrderItem
```

**Key model details:**

- **Client** — Tenant entity. Has slug (unique), plan, guest access toggle, guest password. All data is scoped to a client.
- **User** — Belongs to a Client. Unique on `[email, clientId]`. Roles control access.
- **Product** — Belongs to a Client. Unique on `[sku, clientId]`. Stores price as Decimal(10,2). Has JSON fields for `variations`, `images`, `videos`. Supports `allowPreorder`.
- **Media** — Stores S3 keys, metadata, processing status. Links to products via `ProductMedia` join table (with sort order, primary flag) or direct `productId` FK.
- **ImageEmbedding / FrameEmbedding** — Vector embeddings (pgvector) for visual similarity search.
- **Order / OrderItem** — Stores snapshot data (product name, SKU, price at time of order). Payment tracked via UTR, transaction number, and proof URL.
- **Category** — Hierarchical (self-referencing `parentId`). Unique on `[name, clientId, parentId]`.
- **PerformanceMetrics** — Core Web Vitals storage (FCP, LCP, FID, CLS, TTFB, TTI).

---

## Authentication & Authorization

### User Auth (JWT)
- Login via `/api/auth/login` — returns JWT token
- Token stored in `localStorage` (client-side) and verified server-side
- `getUserFromRequest()` and `authorizeUser()` helpers in API routes
- Password hashing with bcrypt

### Guest Auth
- Clients can enable guest access with a shared password
- Guest login via `/api/guest/auth` — returns guest JWT with `type: 'guest'`
- Guest token stored in cookie: `guest_token_<slug>`
- Separate guest auth guards for guest API routes

### API Key Auth
- API keys created per client for programmatic access
- Middleware validates key + permissions
- Used by public API endpoints

### Role Hierarchy
| Role | Capabilities |
|---|---|
| MASTER_ADMIN | Full system access, manage all clients |
| ADMIN | Manage own client's data, users, settings |
| MANAGER | Product/inventory/order management |
| USER | Read-only or limited access |

---

## Route Map

### Page Routes

| Route | Auth | Description |
|---|---|---|
| `/login` | Public | Login page |
| `/` | User JWT | Dashboard (stats, activity, quick actions) |
| `/products` | User JWT | Product listing (grid/list, search, filters, bulk ops) |
| `/products/new` | User JWT | Create product form |
| `/products/[id]` | User JWT | Product detail (media gallery, inventory history) |
| `/products/[id]/edit` | User JWT | Edit product |
| `/orders` | User JWT | Order listing (search, status filter) |
| `/orders/[id]` | User JWT | Order detail (status updates, payment info) |
| `/inventory` | User JWT | Inventory dashboard, low stock alerts |
| `/media` | User JWT | Media management (upload, library, analytics) |
| `/settings` | User JWT | Tabs: General, Guest Access, Categories, Users, Clients |
| `/profile` | User JWT | User profile, password change |
| `/reports` | User JWT | Low stock report, category breakdown, CSV export |
| `/performance` | User JWT | Core Web Vitals monitoring |
| `/data-quality` | User JWT | Missing/failing media detection |
| `/admin` | Admin+ | Admin dashboard |
| `/admin/clients` | Admin+ | Client CRUD |
| `/admin/products` | Admin+ | Cross-client product management |
| `/admin/api-keys` | Admin+ | API key management |
| `/admin/system` | Admin+ | System health monitoring |
| `/guest/[slug]` | Guest | Guest login |
| `/guest/[slug]/catalog` | Guest | Product catalog (search, filter, pagination) |
| `/guest/[slug]/products/[id]` | Guest | Product detail, add to cart |
| `/guest/[slug]/cart` | Guest | Shopping cart |
| `/guest/[slug]/checkout` | Guest | Checkout (address, payment info) |
| `/guest/[slug]/orders/[id]` | Guest | Order confirmation |

### API Routes (83+ endpoints)

#### Auth & Users
- `POST /api/auth/login` — User login
- `POST /api/auth/register` — User registration
- `GET/POST /api/users` — List / create users
- `GET/PUT/DELETE /api/users/[id]` — User CRUD
- `GET/PUT /api/users/profile` — Profile management

#### Products
- `GET/POST /api/products` — List / create products
- `GET/PUT/DELETE /api/products/[id]` — Product CRUD
- `POST /api/products/bulk` — Bulk operations
- `GET /api/products/sku/[sku]` — Lookup by SKU
- `POST /api/products/sku/bulk` — Bulk SKU lookup

#### Orders
- `GET/POST /api/orders` — List / create orders
- `GET/PUT/DELETE /api/orders/[id]` — Order CRUD
- `POST /api/orders/[id]/payment-proof` — Upload payment proof

#### Media
- `GET/POST /api/media` — List / create media
- `GET/PUT/DELETE /api/media/[id]` — Media CRUD
- `POST /api/media/bulk` — Bulk media operations
- `POST /api/media/bulk-upload` — Bulk upload (up to 100MB)
- `POST /api/media/assign` — Assign media to products
- `POST /api/media/refresh-urls` — Refresh signed URLs
- `GET /api/media/thumbnail/[s3Key]` — Thumbnail generation
- `POST /api/media/reprocess/[id]` — Reprocess media
- `GET /api/media/analytics` — Media analytics
- `GET /api/media/assets` — Media assets listing
- `POST /api/media/register-bulk` — Bulk registration
- `POST /api/media/presigned-bulk` — Bulk presigned URLs

#### Guest
- `POST /api/guest/auth` — Guest login
- `GET/POST /api/guest/products` — Guest product listing
- `GET /api/guest/products/[id]` — Guest product detail
- `GET/POST /api/guest/orders` — Guest order operations
- `GET /api/guest/orders/[id]` — Guest order detail
- `GET /api/guest/categories` — Guest categories
- `POST /api/guest/get-token` / `set-token` / `logout` — Token management

#### Public API (API key auth)
- `GET /api/public/products` — Public product listing
- `GET /api/public/products/sku/[sku]` — Public SKU lookup
- `POST /api/public/products/sku/bulk` — Bulk SKU lookup
- `POST /api/public/inventory/check` — Inventory check
- `POST /api/public/inventory/reduce` — Reduce inventory
- `POST /api/public/inventory/reduce/bulk` — Bulk reduction
- `POST /api/public/inventory/restore` — Restore inventory
- `POST /api/public/search/by-image` — Visual search
- `POST /api/public/search/by-image/advanced` — Advanced visual search

#### Admin
- `GET/POST /api/admin/clients` — Client management
- `GET/PUT/DELETE /api/admin/clients/[id]` — Client CRUD
- `GET/DELETE /api/admin/products` — Cross-client products
- `GET/POST /api/admin/api-keys` — API key management
- `POST /api/admin/migrate` — Database migration

#### Analytics & Monitoring
- `GET /api/stats` — Dashboard statistics
- `GET /api/activity` — Activity feed
- `GET /api/analytics/performance` — Performance metrics
- `GET /api/inventory/analytics` — Inventory analytics
- `GET /api/data-quality` — Data quality checks
- `GET /api/data-quality/products-missing-media` — Missing media report
- `GET /api/data-quality/failing-media` — Failing media report

#### Settings & Config
- `GET/PUT /api/settings` — Application settings
- `GET/PUT /api/settings/guest-access` — Guest access settings
- `GET /api/tenants/[slug]` — Tenant info
- `GET/PUT /api/tenants/[slug]/settings` — Tenant settings

#### Utility
- `GET /api/health` — Health check
- `GET /api/countries` — Country listing
- `GET /api/currencies` — Currency listing
- `POST /api/upload-presigned` — Generate presigned upload URL
- `POST /api/upload-media` — Upload media
- `POST /api/save-media` — Save media metadata
- `POST /api/generate-thumbnail` — Thumbnail generation
- `POST /api/backup/db` — Database backup
- `POST /api/s3-management` — S3 management

---

## Key Features

### 1. Multi-Tenancy
- Every data model is scoped to a `clientId`
- Clients have unique slugs, plans (Starter/Professional/Enterprise), and independent settings
- Tenant resolution via slug in URL or JWT token
- Complete data isolation between tenants

### 2. Product Catalog
- SKU-based product management (unique per client)
- Hierarchical categories (parent/child)
- Product variations stored as JSON
- Multi-image and video support per product
- Price as Decimal(10,2) for financial precision
- Preorder support (`allowPreorder` flag)
- CSV/Excel import and export
- Bulk operations (delete, update)

### 3. Media Management
- Upload to AWS S3 with presigned URLs
- S3 folder structure: `clients/{clientId}/products/{sku}/media/`
- Image processing with Sharp (100% quality preservation)
- EXIF data stripping for security
- Video support with frame extraction
- Bulk upload (up to 100MB per request, 300s timeout)
- Media library with search and filtering
- Automatic thumbnail generation
- Media analytics dashboard

### 4. Visual Search (AI)
- CLIP embedding generation via Python FastAPI microservice
- Image embeddings stored in PostgreSQL pgvector
- Video frame extraction and per-frame embeddings
- Cosine similarity search across product media
- Public API endpoint for external visual search
- Advanced search with configurable thresholds

### 5. Guest E-Commerce
- Password-protected guest access per client
- Full catalog browsing with search and category filters
- Shopping cart (localStorage-backed via React Context)
- Checkout with shipping address and payment info
- Order placement with automatic order number generation
- Order confirmation page
- Manual payment tracking (UTR, transaction number, proof upload)

### 6. Inventory Management
- Stock level tracking per product
- Inventory history with types: Purchase, Sale, Adjustment, Return, Damage, Transfer
- Low stock alerts with configurable thresholds
- Inventory analytics dashboard
- Public API for inventory check/reduce/restore (for external integrations)
- Reports with severity levels (critical, high, medium)

### 7. Order Management
- Full order lifecycle: Pending → Confirmed → Processing → Shipped → Delivered
- Order cancellation support
- Customer info (name, email, phone)
- Shipping/billing address as JSON
- Payment proof upload to S3
- Order notes
- Tax and shipping calculations

### 8. Admin Panel
- Client (tenant) management — create, edit, deactivate
- Cross-client product viewing and management
- API key management with granular permissions
- System health monitoring (database, server, memory, CPU)
- Database migration tools

### 9. Security
- EXIF stripping on uploaded images
- Malicious content scanning
- File type validation
- Rate limiting (in-memory, Redis-ready)
- Security headers (X-XSS-Protection, X-Frame-Options, CSP, etc.)
- CORS configuration for API routes
- Content-Type sniffing prevention

### 10. Performance & Monitoring
- Core Web Vitals tracking (FCP, LCP, FID, CLS, TTFB, TTI)
- Performance dashboard with historical data
- Data quality monitoring (missing media, failing media)
- Optimized image loading (WebP/AVIF, responsive sizes)
- Static asset caching (1 year immutable)
- API response caching (60s)

---

## State Management

| Scope | Mechanism |
|---|---|
| Auth state | `AuthProvider` (React Context) — login, register, logout, token in localStorage |
| Guest cart | `GuestCartContext` (React Context) — localStorage-backed cart with variation support |
| Tenant info | `TenantContext` (React Context) — client info, settings |
| Server state | Direct fetch calls to API routes from components |
| Form state | Local component state (`useState`) |

No Redux or Zustand — lightweight Context API approach.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | App base URL |
| `NEXTAUTH_SECRET` | NextAuth secret (legacy, may not be active) |
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `AWS_REGION` | AWS region |
| `S3_BUCKET_NAME` | S3 bucket for media storage |
| `EMBEDDING_SERVICE_URL` | URL to Python CLIP embedding service |

---

## Deployment

### Vercel (Frontend + API)
- Auto-deploy from `main` branch
- Custom function timeouts: default 30s, upload-media 60s, bulk-upload 300s
- Bulk upload: 3008MB memory allocation
- Build: `prisma generate && next build`
- Install: `npm install && npx prisma generate`

### Embedding Service (Docker)
- Python 3.11 FastAPI application
- Runs on port 8000 with health check
- Generates CLIP embeddings for images and video frames

### Infrastructure (Terraform)
- S3 bucket for media storage
- SQS queues (likely for async processing)
- IAM roles and policies
- CloudWatch monitoring
- SNS notifications
- Security groups

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |
| `npm run db:seed-saas` | Seed multi-tenant data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:copy-prod` | Copy production DB to local |
| `npm run db:backup-prod` | Backup production DB |
| `npm run db:deep-copy` | Deep copy prod to local |
| `npm run s3:backup` | Backup S3 bucket |
| `npm run reembed` | Re-generate all embeddings |
| `npm run backfill:media` | Backfill media from products |
| `npm run e2e:test` | Run visual search E2E tests |
| `npm run create:users` | Create test users |

---

## Component Inventory

### UI Primitives (`src/components/ui/`)
Button, Input, Label, Card, Badge, Modal, Loading, AnimatedCard, AnimatedLoading, AnimatedWrapper, CategoryDropdown, CategorySelect, DuplicateSKUDialog, ImportExportModal, MediaPreview, MediaUpload, MediaUploadNew, MediaUploadPresigned, switch

### Feature Components (`src/components/`)
AuthProvider, DashboardLayout, BulkMediaUpload, DataQualityDashboard, GuestAccessSettings, ImageModal, InventoryDashboard, InventoryManagementModal, MediaDashboard, MediaIngestTable, MediaLibrary, MediaManagementModal, MediaSelectorModal, MobileWrapper, OptimizedImage, PerformanceDashboard, PerformanceMonitor, ProductMediaSelector, ProductTile, SearchByImageModal, SEOHead, ThemeProvider, VideoPreview

### Guest Client Components (`src/app/guest/`)
GuestCatalogClient, GuestCartClient, GuestCheckoutClient, GuestProductDetailClient, GuestOrderConfirmationClient

---

## Utility Modules (`src/lib/`)

| Module | Purpose |
|---|---|
| `prisma.ts` | Prisma client singleton with connection pooling |
| `pg.ts` | Raw PostgreSQL query utilities |
| `auth.ts` | Token verification, user extraction from requests |
| `jwt.ts` | JWT create, validate, refresh, role checks |
| `guest-auth.ts` | Guest token creation and validation |
| `guest-auth-guard.ts` | Guest route protection |
| `api-key-service.ts` | API key CRUD and validation |
| `api-key-middleware.ts` | API key auth middleware |
| `rate-limit.ts` | In-memory rate limiting (Redis-ready) |
| `aws.ts` | S3 client, signed URL generation, key generation |
| `s3-upload.ts` | S3 upload with Sharp image processing |
| `s3-folder-manager.ts` | S3 folder structure management |
| `security.ts` | EXIF stripping, malicious content scanning, file validation |
| `search.ts` | Vector similarity search (pgvector) |
| `embeddings.ts` | CLIP embedding generation and storage |
| `video-thumbnail-generator.ts` | Video frame extraction |
| `tenant.ts` | Multi-tenant resolution and access validation |
| `data-validation.ts` | Zod schemas for all entities |
| `data-quality.ts` | Data quality checks and reporting |
| `csv-utils.ts` | CSV parsing and export (PapaParse) |
| `utils.ts` | General helpers (cn, formatCurrency, formatDate, debounce, throttle) |
| `seo.ts` | SEO utilities |
| `theme.ts` | Theme configuration |
| `log.ts` | Pino structured logging |
| `unique-naming.ts` | Unique filename generation |
| `guest-media.ts` | Guest media URL handling |

---

## Data Flow Summary

### User Login Flow
```
Login Page → POST /api/auth/login → bcrypt verify → JWT created → stored in localStorage → AuthProvider sets user state → redirect to /
```

### Guest Access Flow
```
/guest/[slug] → POST /api/guest/auth (password) → guest JWT created → stored in cookie → redirect to /guest/[slug]/catalog
```

### Product Creation Flow
```
/products/new → fill form → upload media to S3 (presigned URL) → POST /api/products (product + media refs) → Prisma create → embedding service generates CLIP vectors → stored in pgvector
```

### Guest Order Flow
```
Browse catalog → add to cart (localStorage) → /checkout → POST /api/guest/orders → creates Order + OrderItems → reduces inventory → /orders/[id] confirmation
```

### Visual Search Flow
```
Upload image → POST /api/search/by-image → send to embedding service → get CLIP vector → pgvector cosine similarity query → return ranked product matches
```

### Media Upload Flow
```
Client requests presigned URL → POST /api/upload-presigned → upload directly to S3 → POST /api/save-media → create Media record → trigger embedding generation → store vector in pgvector
```

---

## Known Patterns & Conventions

- **File naming**: PascalCase for components, camelCase for utilities, kebab-case for lib modules
- **API routes**: Next.js App Router `route.ts` files with named exports (GET, POST, PUT, DELETE)
- **Auth pattern**: `getUserFromRequest(request)` at the top of every protected API route
- **Multi-tenant scoping**: All queries include `clientId` filter from JWT token
- **Error handling**: Try/catch in API routes, returning JSON `{ error: string }` with appropriate status codes
- **Validation**: Zod schemas in `data-validation.ts` for request body validation
- **Media URLs**: Presigned S3 URLs with expiration, refreshed on demand
- **Logging**: Pino logger with structured JSON output
- **CSS**: Tailwind utility classes with `cn()` helper (clsx + tailwind-merge)
