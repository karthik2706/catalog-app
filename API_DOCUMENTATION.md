# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

### Products

#### Get All Products
```http
GET /api/products?search=keyword&category=Electronics&minPrice=10&maxPrice=100&inStock=true&lowStock=true&sortBy=name&sortOrder=asc&page=1&limit=10
```

**Query Parameters:**
- `search` (string, optional): Search by name, SKU, or description
- `category` (string, optional): Filter by category
- `minPrice` (number, optional): Minimum price filter
- `maxPrice` (number, optional): Maximum price filter
- `inStock` (boolean, optional): Show only products with stock > 0
- `lowStock` (boolean, optional): Show only low stock products
- `sortBy` (string, optional): Sort by field (name, price, stockLevel, createdAt)
- `sortOrder` (string, optional): Sort order (asc, desc)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Response:**
```json
{
  "products": [
    {
      "id": "product_id",
      "name": "Product Name",
      "sku": "SKU123",
      "description": "Product description",
      "price": 29.99,
      "category": "Electronics",
      "variations": [
        {
          "id": "var1",
          "name": "Color",
          "value": "Red",
          "priceAdjustment": 0
        }
      ],
      "stockLevel": 50,
      "minStock": 10,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "inventoryHistory": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### Create Product
```http
POST /api/products
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "New Product",
  "sku": "SKU123",
  "description": "Product description",
  "price": 29.99,
  "category": "Electronics",
  "variations": [
    {
      "id": "var1",
      "name": "Color",
      "value": "Red",
      "priceAdjustment": 0
    }
  ],
  "stockLevel": 0,
  "minStock": 10
}
```

**Response:**
```json
{
  "id": "product_id",
  "name": "New Product",
  "sku": "SKU123",
  "description": "Product description",
  "price": 29.99,
  "category": "Electronics",
  "variations": [...],
  "stockLevel": 0,
  "minStock": 10,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "inventoryHistory": []
}
```

#### Get Single Product
```http
GET /api/products/{id}
```

**Response:**
```json
{
  "id": "product_id",
  "name": "Product Name",
  "sku": "SKU123",
  "description": "Product description",
  "price": 29.99,
  "category": "Electronics",
  "variations": [...],
  "stockLevel": 50,
  "minStock": 10,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "inventoryHistory": [
    {
      "id": "history_id",
      "quantity": 10,
      "type": "PURCHASE",
      "reason": "Initial stock",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "name": "John Doe",
        "email": "user@example.com"
      }
    }
  ]
}
```

#### Update Product
```http
PUT /api/products/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Product Name",
  "price": 39.99,
  "stockLevel": 75
}
```

**Response:**
```json
{
  "id": "product_id",
  "name": "Updated Product Name",
  "sku": "SKU123",
  "description": "Product description",
  "price": 39.99,
  "category": "Electronics",
  "variations": [...],
  "stockLevel": 75,
  "minStock": 10,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "inventoryHistory": [...]
}
```

#### Delete Product
```http
DELETE /api/products/{id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Product deleted successfully"
}
```

### Inventory

#### Update Inventory
```http
POST /api/inventory
Content-Type: application/json
Authorization: Bearer <token>

{
  "productId": "product_id",
  "quantity": 10,
  "type": "PURCHASE",
  "reason": "Stock replenishment"
}
```

**Inventory Types:**
- `PURCHASE` - Stock added through purchase
- `SALE` - Stock reduced through sale
- `ADJUSTMENT` - Manual stock adjustment
- `RETURN` - Stock added through return
- `DAMAGE` - Stock reduced due to damage
- `TRANSFER` - Stock moved between locations

**Response:**
```json
{
  "product": {
    "id": "product_id",
    "name": "Product Name",
    "stockLevel": 60,
    "minStock": 10,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "inventoryRecord": {
    "id": "history_id",
    "productId": "product_id",
    "quantity": 10,
    "type": "PURCHASE",
    "reason": "Stock replenishment",
    "userId": "user_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "name": "John Doe",
      "email": "user@example.com"
    }
  }
}
```

#### Get Inventory History
```http
GET /api/inventory?productId=product_id&type=PURCHASE&page=1&limit=20
```

**Query Parameters:**
- `productId` (string, optional): Filter by product ID
- `type` (string, optional): Filter by inventory type
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response:**
```json
{
  "inventoryHistory": [
    {
      "id": "history_id",
      "productId": "product_id",
      "quantity": 10,
      "type": "PURCHASE",
      "reason": "Stock replenishment",
      "userId": "user_id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "product": {
        "name": "Product Name",
        "sku": "SKU123"
      },
      "user": {
        "name": "John Doe",
        "email": "user@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Missing required fields: name, sku, price, category"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Product not found"
}
```

### 409 Conflict
```json
{
  "error": "Product with this SKU already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch products"
}
```

## Data Types

### Product
```typescript
interface Product {
  id: string
  name: string
  sku: string
  description?: string
  price: number
  category: string
  variations?: ProductVariation[]
  stockLevel: number
  minStock: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### ProductVariation
```typescript
interface ProductVariation {
  id: string
  name: string
  value: string
  priceAdjustment?: number
}
```

### InventoryHistory
```typescript
interface InventoryHistory {
  id: string
  productId: string
  quantity: number
  type: InventoryType
  reason?: string
  userId?: string
  createdAt: Date
  product?: Product
  user?: User
}
```

### User
```typescript
interface User {
  id: string
  email: string
  name?: string
  role: Role
  createdAt: Date
  updatedAt: Date
}
```

### Enums
```typescript
enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER'
}

enum InventoryType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
  TRANSFER = 'TRANSFER'
}
```

## Rate Limiting

Currently, there are no rate limits implemented. For production deployment, consider implementing rate limiting to prevent abuse.

## CORS

The API supports CORS for cross-origin requests. In production, configure CORS settings appropriately for your domain.

## Security Considerations

1. **JWT Tokens**: Store JWT tokens securely and implement proper token refresh
2. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds
3. **Input Validation**: All inputs are validated on both client and server side
4. **SQL Injection**: Prisma ORM provides protection against SQL injection
5. **Authentication**: All protected endpoints require valid JWT tokens
6. **Authorization**: Role-based access control for admin functions
