# Stock Mind - Multi-Tenant SaaS Platform

A comprehensive inventory management system built as a multi-tenant SaaS platform using Next.js, TypeScript, Prisma, and PostgreSQL.

## 🏗️ Architecture Overview

This application has been transformed into a multi-tenant SaaS platform where:

- **Platform Administrators** can onboard and manage multiple clients
- **Each Client** gets their own isolated environment with subdomain access
- **Data Isolation** ensures complete separation between client data
- **Scalable Design** supports unlimited clients with proper resource management

## 🚀 Key Features

### Multi-Tenancy
- ✅ **Client Isolation** - Complete data separation between clients
- ✅ **Subdomain Routing** - Each client gets their own subdomain (e.g., `client1.localhost:3000`)
- ✅ **Super Admin Panel** - Platform administrators can manage all clients
- ✅ **Client-Specific Settings** - Each client has their own configuration

### Client Management
- ✅ **Client Onboarding** - Easy client creation and setup
- ✅ **User Management** - Client-specific user accounts and roles
- ✅ **Plan Management** - Different subscription tiers (Starter, Professional, Enterprise)
- ✅ **Settings Management** - Client-specific application settings

### Inventory Management
- ✅ **Product Catalog** - Complete product management with variations
- ✅ **Inventory Tracking** - Real-time stock level monitoring
- ✅ **Category Management** - Organized product categorization
- ✅ **Reports & Analytics** - Low stock alerts and inventory reports

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt
- **Multi-tenancy**: Subdomain-based routing with middleware

## 📊 Database Schema

### Core Models

```prisma
model Client {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique // For subdomain routing
  domain      String?  // Custom domain support
  email       String
  plan        Plan     @default(STARTER)
  isActive    Boolean  @default(true)
  // ... relations to users, products, categories
}

model User {
  id        String   @id @default(cuid())
  email     String
  clientId  String?  // Null for super admin users
  role      Role     @default(ADMIN)
  isActive  Boolean  @default(true)
  // ... relations
}

model Product {
  id       String @id @default(cuid())
  name     String
  sku      String
  clientId String // Required for tenant isolation
  // ... other fields
  @@unique([sku, clientId]) // SKU unique within client
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd catalog-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your database URL and JWT secret:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/catalog_app?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   ```

4. **Set up the database**
   ```bash
   npm run setup-saas
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Access the Application

- **Super Admin Panel**: http://localhost:3000/admin
- **Client Subdomains**: 
  - http://techcorp.localhost:3000
  - http://retailmax.localhost:3000
  - http://enterprise.localhost:3000

### Default Login Credentials

- **Super Admin**: admin@platform.com / admin123
- **TechCorp**: admin@techcorp.com / password123
- **RetailMax**: admin@retailmax.com / password123
- **Enterprise**: admin@enterprise.com / password123

## 🏢 Client Onboarding Process

### For Platform Administrators

1. **Access Super Admin Panel**
   - Navigate to `/admin`
   - Login with super admin credentials

2. **Create New Client**
   - Click "Add Client" button
   - Fill in client details (name, email, plan)
   - System automatically creates:
     - Client account with unique slug
     - Default admin user
     - Client-specific settings
     - Sample categories and products

3. **Client Access**
   - Client can access their subdomain: `https://{slug}.localhost:3000`
   - Default admin user is created automatically
   - Client can manage their own users and settings

### For Client Administrators

1. **Access Client Dashboard**
   - Navigate to their subdomain
   - Login with provided credentials

2. **Manage Users**
   - Create additional users with different roles
   - Set permissions and access levels

3. **Configure Settings**
   - Update company information
   - Set currency and timezone
   - Configure notifications

4. **Manage Inventory**
   - Add products and categories
   - Track inventory levels
   - Generate reports

## 🔐 User Roles & Permissions

### Super Admin
- Manage all clients and their settings
- Access platform-wide analytics
- Create and deactivate client accounts
- Manage subscription plans

### Client Admin
- Manage client users and settings
- Full access to client inventory
- Create and manage products
- Access client reports

### Client Manager
- Manage products and inventory
- View reports and analytics
- Limited user management

### Client User
- View products and inventory
- Basic inventory operations
- Limited reporting access

## 🌐 Subdomain Configuration

### Development Setup

For local development, you need to configure your hosts file:

**On macOS/Linux:**
```bash
sudo nano /etc/hosts
```

Add these lines:
```
127.0.0.1 localhost
127.0.0.1 techcorp.localhost
127.0.0.1 retailmax.localhost
127.0.0.1 enterprise.localhost
```

**On Windows:**
Edit `C:\Windows\System32\drivers\etc\hosts` and add the same lines.

### Production Setup

For production, configure your DNS to point subdomains to your server:
- `*.yourdomain.com` → Your server IP
- `yourdomain.com` → Your server IP

## 📱 API Endpoints

### Super Admin APIs
- `GET /api/admin/clients` - List all clients
- `POST /api/admin/clients` - Create new client
- `PUT /api/admin/clients/[id]` - Update client
- `DELETE /api/admin/clients/[id]` - Delete client

### Tenant APIs
- `GET /api/tenants/[slug]` - Get client information
- `GET /api/tenants/[slug]/settings` - Get client settings
- `PUT /api/tenants/[slug]/settings` - Update client settings

### Client APIs (Tenant-Isolated)
- `GET /api/products` - Get client products
- `POST /api/products` - Create product
- `GET /api/categories` - Get client categories
- `POST /api/categories` - Create category
- `GET /api/users` - Get client users
- `POST /api/users` - Create client user

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/catalog_app?schema=public"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# Optional: Email service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Client Plans

The platform supports three subscription plans:

- **Starter**: Basic inventory management, 1 admin user
- **Professional**: Advanced features, up to 10 users
- **Enterprise**: Full features, unlimited users, custom domain

## 🚀 Deployment

### Using Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Configure custom domains** for subdomains
4. **Deploy** - Vercel handles the rest

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Database Migration

```bash
# Generate migration
npx prisma migrate dev --name init

# Apply migration to production
npx prisma migrate deploy
```

## 📈 Monitoring & Analytics

### Platform Metrics
- Total clients and users
- Revenue and subscription analytics
- Client activity and usage patterns
- System performance metrics

### Client Metrics
- Inventory levels and turnover
- User activity and engagement
- Product performance analytics
- Low stock alerts and reports

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Data Isolation** ensuring complete client separation
- **Role-Based Access Control** with granular permissions
- **Input Validation** and SQL injection prevention
- **HTTPS Enforcement** for all communications
- **Rate Limiting** to prevent abuse

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Multi-tenant architecture
- ✅ Client management system
- ✅ Basic inventory management

### Phase 2 (Planned)
- 🔄 Advanced analytics and reporting
- 🔄 Email notifications and alerts
- 🔄 API rate limiting and quotas
- 🔄 Custom domain support

### Phase 3 (Future)
- 🔄 Mobile applications
- 🔄 Third-party integrations
- 🔄 Advanced automation features
- 🔄 White-label solutions

---

**Quick Stock** - Empowering businesses with intelligent inventory management.
