# Stock Mind - Multi-Tenant SaaS Inventory Management Platform

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Frontend Components](#frontend-components)
7. [Authentication & Authorization](#authentication--authorization)
8. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
9. [File Storage & Media Management](#file-storage--media-management)
10. [Deployment & Configuration](#deployment--configuration)
11. [Development Setup](#development-setup)
12. [Enhancement Opportunities](#enhancement-opportunities)

## 🎯 Overview

**Stock Mind** is a comprehensive multi-tenant SaaS inventory management platform built with Next.js 15, TypeScript, and PostgreSQL. The application provides a complete solution for businesses to manage their product inventory, track stock levels, and generate reports across multiple client organizations.

### Key Features
- **Multi-Tenant Architecture**: Complete data isolation between clients with subdomain-based routing
- **Product Management**: Full CRUD operations for products with SKU, pricing, categories, and variations
- **Inventory Tracking**: Real-time stock level monitoring with detailed history
- **Media Management**: AWS S3 integration for product images and videos with signed URLs
- **User Management**: Role-based access control (Super Admin, Admin, Manager, User)
- **Reporting & Analytics**: Low stock alerts, inventory reports, and dashboard analytics
- **Responsive Design**: Mobile-first UI with Tailwind CSS and Framer Motion animations
- **Client Onboarding**: Automated client setup with default configurations

## 🏗️ Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js 15)  │◄──►│   (API Routes)  │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AWS S3        │    │   Middleware    │    │   Prisma ORM    │
│   (File Storage)│    │   (Auth/Routing)│    │   (Data Layer)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Multi-Tenant Architecture
- **Subdomain Routing**: Each client gets a unique subdomain (e.g., `client1.localhost:3000`)
- **Data Isolation**: Complete separation of client data using `clientId` foreign keys
- **Middleware**: Automatic tenant detection and context injection
- **Super Admin Panel**: Platform-wide client management at `/admin`

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth transitions
- **UI Components**: Custom component library with Radix UI primitives
- **State Management**: React Context API for authentication and tenant context

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: AWS S3 with presigned URLs
- **Validation**: Built-in TypeScript type checking

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with Next.js configuration
- **Database Management**: Prisma Studio
- **Type Safety**: TypeScript with strict mode

## 🗄️ Database Schema

### Core Models

#### Client (Multi-Tenant Root)
```prisma
model Client {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique // For subdomain routing
  domain      String?  // Custom domain support
  email       String
  phone       String?
  address     String?
  logo        String?  // Logo URL
  countryId   String?  // Client's country
  currencyId  String?  // Client's currency
  isActive    Boolean  @default(true)
  plan        Plan     @default(STARTER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  country     Country?  @relation(fields: [countryId], references: [id])
  currency    Currency? @relation(fields: [currencyId], references: [id])
  users       User[]
  products    Product[]
  categories  Category[]
  settings    ClientSettings?
  inventoryHistory InventoryHistory[]
}
```

#### User Management
```prisma
model User {
  id        String   @id @default(cuid())
  email     String
  password  String
  name      String?
  role      Role     @default(ADMIN)
  clientId  String?  // Null for super admin users
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  client           Client?           @relation(fields: [clientId], references: [id], onDelete: Cascade)
  inventoryHistory InventoryHistory[]

  // Ensure email is unique within a client
  @@unique([email, clientId])
}
```

#### Product Management
```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  sku         String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  category    String   // Keep for backward compatibility
  categoryId  String?  // New foreign key to categories table
  variations  Json?    // Store product variations as JSON
  stockLevel  Int      @default(0)
  minStock    Int      @default(0)
  isActive    Boolean  @default(true)
  clientId    String   // Required for multi-tenancy
  
  // Media fields
  media       Json?    // Array of media URLs and metadata
  images      Json?    // Array of image URLs and metadata
  videos      Json?    // Array of video URLs and metadata
  thumbnailUrl String? // Primary thumbnail URL
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  client           Client            @relation(fields: [clientId], references: [id], onDelete: Cascade)
  inventoryHistory InventoryHistory[]
  categoryRef      Category?         @relation(fields: [categoryId], references: [id])
  categories       ProductCategory[] // Many-to-many relationship

  // Ensure SKU is unique within a client
  @@unique([sku, clientId])
}
```

#### Inventory Tracking
```prisma
model InventoryHistory {
  id          String   @id @default(cuid())
  productId   String
  quantity    Int      // Positive for additions, negative for subtractions
  type        InventoryType
  reason      String?
  userId      String?
  clientId    String   // For tenant isolation
  createdAt   DateTime @default(now())

  // Relations
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  user    User?   @relation(fields: [userId], references: [id])
  client  Client  @relation(fields: [clientId], references: [id], onDelete: Cascade)
}
```

#### Category Management
```prisma
model Category {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  clientId    String   // Required for multi-tenancy
  parentId    String?  // For hierarchical categories
  sortOrder   Int      @default(0) // For custom ordering
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  client     Client            @relation(fields: [clientId], references: [id], onDelete: Cascade)
  products   Product[]         // Legacy relation
  parent     Category?         @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children   Category[]        @relation("CategoryHierarchy")
  productCategories ProductCategory[] // Many-to-many relationship

  // Ensure category name is unique within a client and parent
  @@unique([name, clientId, parentId])
}
```

### Enums
```prisma
enum Role {
  SUPER_ADMIN  // Platform administrators
  ADMIN        // Client administrators
  MANAGER      // Client managers
  USER         // Client users
}

enum Plan {
  STARTER      // Basic plan
  PROFESSIONAL // Professional plan
  ENTERPRISE   // Enterprise plan
}

enum InventoryType {
  PURCHASE
  SALE
  ADJUSTMENT
  RETURN
  DAMAGE
  TRANSFER
}
```

## 🔌 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Super Admin Endpoints
- `GET /api/admin/clients` - List all clients
- `POST /api/admin/clients` - Create new client
- `PUT /api/admin/clients/[id]` - Update client
- `DELETE /api/admin/clients/[id]` - Delete client

### Tenant Management
- `GET /api/tenants/[slug]` - Get client information
- `GET /api/tenants/[slug]/settings` - Get client settings
- `PUT /api/tenants/[slug]/settings` - Update client settings

### Product Management (Tenant-Isolated)
- `GET /api/products` - Get client products with filtering and pagination
- `POST /api/products` - Create new product
- `GET /api/products/[id]` - Get single product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Soft delete product

### Category Management
- `GET /api/categories` - Get client categories
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

### Inventory Management
- `POST /api/inventory` - Update inventory levels
- `GET /api/inventory` - Get inventory history

### Media Management
- `POST /api/upload-presigned` - Generate presigned URLs for S3 upload
- `POST /api/upload-media` - Upload media files to S3
- `GET /api/s3-management` - Manage S3 files

### Query Parameters for Products API
- `search` - Search by name, SKU, or description
- `category` - Filter by category
- `minPrice` / `maxPrice` - Price range filter
- `inStock` - Show only products with stock > 0
- `lowStock` - Show only low stock products
- `sortBy` - Sort by: name, price, stockLevel, createdAt
- `sortOrder` - Sort order: asc, desc
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

## 🎨 Frontend Components

### Core Components
- **DashboardLayout**: Main application layout with sidebar navigation
- **AuthProvider**: Authentication context and state management
- **TenantProvider**: Multi-tenant context management
- **ThemeProvider**: Theme and styling context

### UI Components
- **Button**: Customizable button component with variants
- **Card**: Content container with header and content sections
- **Input**: Form input with validation and icons
- **Modal**: Overlay dialog for forms and confirmations
- **Badge**: Status indicators and labels
- **Loading**: Loading states and spinners
- **AnimatedCard**: Card with hover animations
- **AnimatedWrapper**: Animation container components

### Page Components
- **Dashboard**: Main dashboard with stats and quick actions
- **Products**: Product listing with search and filters
- **ProductForm**: Create/edit product form
- **Admin**: Super admin client management
- **Reports**: Analytics and reporting interface
- **Settings**: Client and user settings

### Media Components
- **MediaUpload**: File upload with drag-and-drop
- **MediaPreview**: Image and video preview
- **MediaUploadPresigned**: S3 presigned URL upload

## 🔐 Authentication & Authorization

### JWT Implementation
- **Token Storage**: Local storage for client-side persistence
- **Token Validation**: Server-side verification on each request
- **Role-Based Access**: Different permissions for different user roles
- **Password Security**: bcrypt hashing with salt rounds

### User Roles
1. **SUPER_ADMIN**: Platform administrators with access to all clients
2. **ADMIN**: Client administrators with full access to their client's data
3. **MANAGER**: Client managers with limited administrative access
4. **USER**: Basic users with read-only access

### Middleware Protection
- **Route Protection**: Automatic authentication checks
- **Role Verification**: Role-based access control
- **Tenant Isolation**: Automatic client context injection

## 🏢 Multi-Tenancy Implementation

### Subdomain Routing
```typescript
// middleware.ts
const subdomain = hostname.split('.')[0]
if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
  // This is a tenant subdomain
  response.headers.set('x-tenant-slug', subdomain)
}
```

### Data Isolation
- **Client ID Filtering**: All queries filtered by `clientId`
- **Unique Constraints**: SKU and email uniqueness within client scope
- **Cascade Deletes**: Automatic cleanup when client is deleted

### Tenant Context
```typescript
// TenantContext.tsx
interface TenantContextType {
  client: Client | null
  clientSettings: ClientSettings | null
  loading: boolean
  error: string | null
  setClient: (client: Client | null) => void
  refreshClient: () => Promise<void>
}
```

## 📁 File Storage & Media Management

### AWS S3 Integration
- **Bucket Configuration**: Organized folder structure by client and product
- **Presigned URLs**: Secure file upload without exposing credentials
- **File Validation**: Type and size validation before upload
- **Image Optimization**: Automatic resizing and compression

### Folder Structure
```
clients/
  {clientId}/
    products/
      {sku}/
        media/
          image/
            {timestamp}-{random}.{ext}
          video/
            {timestamp}-{random}.{ext}
          thumbnails/
            {timestamp}-{random}.jpg
```

### Media Features
- **Multiple File Types**: Support for images (JPEG, PNG, WebP) and videos (MP4, WebM)
- **Thumbnail Generation**: Automatic thumbnail creation for images
- **URL Expiration**: Signed URLs with configurable expiration
- **File Size Limits**: 50MB maximum file size
- **Quality Optimization**: 85% quality with max 1920x1080 resolution

## 🚀 Deployment & Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/catalog_app?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/catalog_app?schema=public"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-bucket-name"

# Optional: Email service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Vercel Deployment
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure custom domains for subdomains
4. Deploy with automatic builds

### Database Migration
```bash
# Generate migration
npx prisma migrate dev --name init

# Apply migration to production
npx prisma migrate deploy

# Seed database
npm run db:seed-saas
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- AWS S3 bucket (for media storage)
- npm or yarn

### Installation
```bash
# Clone repository
git clone <repository-url>
cd catalog-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up database
npm run setup-saas

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data
- `npm run db:seed-saas` - Seed database with SaaS data

### Local Subdomain Setup
Add to `/etc/hosts` (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 localhost
127.0.0.1 techcorp.localhost
127.0.0.1 retailmax.localhost
127.0.0.1 enterprise.localhost
```

## 🎯 Enhancement Opportunities

### Phase 1: Core Improvements
1. **Advanced Analytics Dashboard**
   - Real-time inventory metrics
   - Sales trend analysis
   - Profit margin calculations
   - Custom date range filtering

2. **Email Notifications System**
   - Low stock alerts
   - Inventory change notifications
   - User activity summaries
   - Automated report generation

3. **API Rate Limiting & Quotas**
   - Per-client API usage limits
   - Rate limiting by plan tier
   - Usage analytics and monitoring
   - Quota exceeded notifications

4. **Advanced Search & Filtering**
   - Full-text search across all fields
   - Advanced filter combinations
   - Saved search queries
   - Search result highlighting

### Phase 2: Business Features
1. **Order Management System**
   - Purchase order creation
   - Supplier management
   - Order tracking and status updates
   - Automated reorder points

2. **Barcode & QR Code Support**
   - Barcode scanning for mobile devices
   - QR code generation for products
   - Mobile app integration
   - Batch operations via scanning

3. **Multi-Location Inventory**
   - Warehouse/location management
   - Transfer between locations
   - Location-specific stock levels
   - Location-based reporting

4. **Advanced Reporting**
   - Custom report builder
   - Scheduled report generation
   - Export to PDF/Excel
   - Dashboard customization

### Phase 3: Enterprise Features
1. **API & Webhook Integration**
   - RESTful API for third-party integration
   - Webhook notifications for events
   - API documentation portal
   - SDK for common languages

2. **White-Label Solution**
   - Custom branding per client
   - Custom domain support
   - Theme customization
   - Logo and color scheme management

3. **Advanced User Management**
   - SSO integration (SAML, OAuth)
   - Two-factor authentication
   - User activity logging
   - Advanced permission system

4. **Mobile Applications**
   - React Native mobile app
   - Offline capability
   - Push notifications
   - Camera integration for barcode scanning

### Phase 4: AI & Automation
1. **Predictive Analytics**
   - Demand forecasting
   - Optimal stock level suggestions
   - Seasonal trend analysis
   - Machine learning recommendations

2. **Automated Workflows**
   - Custom business rules engine
   - Automated inventory adjustments
   - Smart reorder suggestions
   - Exception handling workflows

3. **Advanced Media Management**
   - AI-powered image tagging
   - Automatic product categorization
   - Image quality enhancement
   - Video thumbnail generation

### Technical Improvements
1. **Performance Optimization**
   - Database query optimization
   - Caching layer implementation
   - CDN integration for media
   - Lazy loading and code splitting

2. **Security Enhancements**
   - API security audit
   - Data encryption at rest
   - Audit logging
   - Security monitoring

3. **Scalability Improvements**
   - Horizontal scaling support
   - Database sharding
   - Microservices architecture
   - Load balancing

4. **Developer Experience**
   - Comprehensive test suite
   - API documentation
   - Development tools
   - CI/CD pipeline

### Integration Opportunities
1. **E-commerce Platforms**
   - Shopify integration
   - WooCommerce sync
   - Magento connector
   - Custom e-commerce APIs

2. **Accounting Software**
   - QuickBooks integration
   - Xero connector
   - Sage integration
   - Custom accounting APIs

3. **Shipping & Logistics**
   - FedEx API integration
   - UPS connector
   - DHL integration
   - Custom shipping providers

4. **Payment Processing**
   - Stripe integration
   - PayPal connector
   - Square integration
   - Custom payment gateways

This comprehensive documentation provides a complete overview of the Stock Mind platform, its architecture, implementation details, and potential enhancement opportunities for future development.
