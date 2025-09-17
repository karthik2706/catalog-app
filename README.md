# Stock Mind - Inventory Management System

A comprehensive React + Next.js application for managing retail products and inventory with real-time tracking, reporting, and admin authentication.

## Features

- **Product Management**: Full CRUD operations for products with SKU, pricing, categories, and variations
- **Inventory Tracking**: Real-time stock level updates with detailed history
- **Search & Filtering**: Advanced product search with category and price filters
- **Low Stock Reports**: Automated reporting for products below minimum stock levels
- **User Authentication**: Secure admin access with JWT-based authentication
- **Responsive Design**: Material UI components with mobile-friendly interface
- **Dashboard Analytics**: Overview of inventory metrics and key performance indicators

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Material UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT tokens with bcrypt password hashing
- **Styling**: Material UI with custom theme

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

## Local Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd stock-mind
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/stock_mind"

# JWT Secret (generate a strong secret for production)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# NextAuth (if using NextAuth.js)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"
```

### 3. Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE stock_mind;
```

2. Generate and run Prisma migrations:
```bash
npx prisma generate
npx prisma db push
```

3. (Optional) Seed the database with sample data:
```bash
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - Get all products (with filtering and pagination)
- `POST /api/products` - Create new product
- `GET /api/products/[id]` - Get single product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Soft delete product

### Inventory
- `POST /api/inventory` - Update inventory levels
- `GET /api/inventory` - Get inventory history

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

## Database Schema

### Products Table
- `id` - Unique identifier
- `name` - Product name
- `sku` - Stock Keeping Unit (unique)
- `description` - Product description
- `price` - Product price (decimal)
- `category` - Product category
- `variations` - Product variations (JSON)
- `stockLevel` - Current stock level
- `minStock` - Minimum stock threshold
- `isActive` - Product status
- `createdAt` / `updatedAt` - Timestamps

### Inventory History Table
- `id` - Unique identifier
- `productId` - Reference to product
- `quantity` - Quantity change (positive/negative)
- `type` - Type of change (PURCHASE, SALE, ADJUSTMENT, etc.)
- `reason` - Reason for change
- `userId` - User who made the change
- `createdAt` - Timestamp

### Users Table
- `id` - Unique identifier
- `email` - User email (unique)
- `password` - Hashed password
- `name` - User display name
- `role` - User role (ADMIN, MANAGER, USER)
- `createdAt` / `updatedAt` - Timestamps

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-nextauth-secret"
```

### Database Migration

```bash
npx prisma db push
```

## Usage

1. **First Time Setup**: Register an admin account
2. **Add Products**: Use the "Add Product" button to create new products
3. **Manage Inventory**: Click the inventory icon to update stock levels
4. **View Reports**: Check the Reports page for low stock alerts
5. **Search & Filter**: Use the search bar and filters to find specific products

## Features in Detail

### Product Management
- Create products with detailed information
- Support for product variations (size, color, etc.)
- Category-based organization
- SKU-based identification

### Inventory Tracking
- Real-time stock level updates
- Detailed inventory history
- Multiple inventory change types
- User attribution for changes

### Reporting
- Low stock alerts
- Category-wise analysis
- Value at risk calculations
- CSV export functionality

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Secure API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.