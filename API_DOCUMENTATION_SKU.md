# Product SKU API Documentation

This document describes the APIs for retrieving and updating product information by SKU (Stock Keeping Unit) for external system integration.

## Table of Contents

1. [Authentication](#authentication)
2. [Authenticated APIs](#authenticated-apis)
3. [Public APIs](#public-apis)
4. [Image Search APIs](#image-search-apis)
5. [Inventory Management APIs](#inventory-management-apis)
6. [Response Formats](#response-formats)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Examples](#examples)

## Authentication

### Authenticated APIs
- **Required**: JWT Bearer token in Authorization header
- **Format**: `Authorization: Bearer <your-jwt-token>`
- **Access**: Full product data and update capabilities

### Public APIs
- **Optional**: API key in x-api-key header (if configured)
- **Format**: `x-api-key: <your-api-key>`
- **Access**: Read-only product data
- **Client Identification**: Required via query parameter or request body

## Authenticated APIs

### 1. Get Product by SKU

**Endpoint**: `GET /api/products/sku/{sku}`

**Headers**:
```
Authorization: Bearer <jwt-token>
```

**Query Parameters** (for SUPER_ADMIN):
- `clientId` (optional): Client ID for super admin users

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "sku": "KB-002",
    "name": "Mechanical Keyboard",
    "description": "RGB mechanical keyboard with blue switches",
    "price": 89.99,
    "currency": "USD",
    "currencySymbol": "$",
    "stockLevel": 25,
    "minStock": 5,
    "category": "Electronics",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "client": {
      "id": "client_123",
      "name": "Tech Store",
      "slug": "tech-store"
    },
    "images": [
      {
        "id": "media_123",
        "url": "https://example.com/image.jpg",
        "s3Key": "products/keyboard.jpg",
        "width": 800,
        "height": 600,
        "fileType": "image/jpeg"
      }
    ]
  }
}
```

### 2. Update Product by SKU

**Endpoint**: `PUT /api/products/sku/{sku}`

**Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "price": 99.99,
  "stockLevel": 30,
  "minStock": 10,
  "name": "Updated Product Name",
  "description": "Updated description",
  "category": "Updated Category",
  "isActive": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "prod_123",
    "sku": "KB-002",
    "name": "Updated Product Name",
    "description": "Updated description",
    "price": 99.99,
    "currency": "USD",
    "currencySymbol": "$",
    "stockLevel": 30,
    "minStock": 10,
    "category": "Updated Category",
    "isActive": true,
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 3. Bulk Get Products by SKUs

**Endpoint**: `POST /api/products/sku/bulk`

**Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "skus": ["KB-002", "NB-004", "UC-003"]
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "sku": "KB-002",
      "name": "Mechanical Keyboard",
      "price": 89.99,
      "stockLevel": 25,
      // ... other fields
    }
  ],
  "found": 2,
  "requested": 3,
  "notFound": ["UC-003"]
}
```

### 4. Bulk Update Products by SKUs

**Endpoint**: `PUT /api/products/sku/bulk`

**Headers**:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "updates": [
    {
      "sku": "KB-002",
      "price": 99.99,
      "stockLevel": 30
    },
    {
      "sku": "NB-004",
      "price": 15.99,
      "stockLevel": 50
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Updated 2 products successfully",
  "data": {
    "updated": [
      {
        "sku": "KB-002",
        "id": "prod_123",
        "updated": true,
        "data": {
          "name": "Mechanical Keyboard",
          "price": 99.99,
          "stockLevel": 30,
          "updatedAt": "2024-01-01T12:00:00Z"
        }
      }
    ],
    "errors": [],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  }
}
```

## Public APIs

### 1. Get Product by SKU (Public)

**Endpoint**: `GET /api/public/products/sku/{sku}?client={client-slug}`

**Headers** (optional):
```
x-api-key: <your-api-key>
```

**Query Parameters**:
- `client` (required): Client slug (e.g., "tech-store")

**Response**: Same as authenticated API

### 2. Bulk Get Products by SKUs (Public)

**Endpoint**: `POST /api/public/products/sku/bulk`

**Headers** (optional):
```
x-api-key: <your-api-key>
Content-Type: application/json
```

**Request Body**:
```json
{
  "skus": ["KB-002", "NB-004", "UC-003"],
  "client": "tech-store"
}
```

**Response**: Same as authenticated bulk API

## Image Search APIs

### 1. Search Products by Image (High Similarity)

**Endpoint**: `POST /api/public/search/by-image?client={client-slug}`

**Headers** (optional):
```
x-api-key: <your-api-key>
Content-Type: multipart/form-data
```

**Query Parameters**:
- `client` (required): Client slug (e.g., "tech-store")

**Request Body**:
- `image` (required): Image file (multipart/form-data)

**Response**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "productId": "prod_123",
        "productName": "Mechanical Keyboard",
        "sku": "KB-002",
        "description": "RGB mechanical keyboard with blue switches",
        "price": 89.99,
        "currency": "USD",
        "currencySymbol": "$",
        "stockLevel": 25,
        "minStock": 5,
        "category": "Electronics",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "similarity": {
          "percent": 98,
          "score": -0.96
        },
        "image": {
          "id": "media_123",
          "url": "https://example.com/image.jpg",
          "s3Key": "products/keyboard.jpg",
          "width": 800,
          "height": 600,
          "fileType": "image/jpeg"
        },
        "client": {
          "id": "client_123",
          "name": "Tech Store",
          "slug": "tech-store"
        }
      }
    ],
    "total": 1,
    "query": {
      "fileName": "search-image.jpg",
      "fileSize": 245760,
      "fileType": "image/jpeg",
      "model": "CLIP-ViT-B/32",
      "device": "cpu",
      "similarityThreshold": 95
    },
    "client": {
      "id": "client_123",
      "name": "Tech Store",
      "slug": "tech-store"
    }
  }
}
```

**Features**:
- Returns only products with 95%+ similarity
- Maximum 10 results
- Includes product details, pricing, and images
- Sorted by similarity (highest first)

### 2. Advanced Image Search (Configurable)

**Endpoint**: `POST /api/public/search/by-image/advanced?client={client-slug}&threshold={similarity}&limit={max-results}`

**Headers** (optional):
```
x-api-key: <your-api-key>
Content-Type: multipart/form-data
```

**Query Parameters**:
- `client` (required): Client slug (e.g., "tech-store")
- `threshold` (optional): Similarity threshold (0-100, default: 95)
- `limit` (optional): Maximum results (1-50, default: 10)

**Request Body**:
- `image` (required): Image file (multipart/form-data)

**Response**: Same as basic image search with additional filter information:

```json
{
  "success": true,
  "data": {
    "results": [/* same as basic search */],
    "total": 1,
    "query": {
      "fileName": "search-image.jpg",
      "fileSize": 245760,
      "fileType": "image/jpeg",
      "model": "CLIP-ViT-B/32",
      "device": "cpu",
      "similarityThreshold": 95,
      "maxResults": 10
    },
    "client": {/* same as basic search */},
    "filters": {
      "applied": {
        "similarityThreshold": 95,
        "maxResults": 10
      },
      "available": {
        "minSimilarityThreshold": 0,
        "maxSimilarityThreshold": 100,
        "minMaxResults": 1,
        "maxMaxResults": 50
      }
    }
  }
}
```

**Features**:
- Configurable similarity threshold (0-100%)
- Configurable result limit (1-50)
- More flexible for different use cases
- Includes filter information in response

## Inventory Management APIs

### 1. Reduce Inventory (Order Fulfillment)

**Endpoint**: `POST /api/public/inventory/reduce?client={client-slug}`

**Headers** (optional):
```
x-api-key: <your-api-key>
Content-Type: application/json
```

**Query Parameters**:
- `client` (required): Client slug (e.g., "tech-store")

**Request Body**:
```json
{
  "orderId": "order_12345",
  "items": [
    {
      "sku": "KB-002",
      "quantity": 2
    },
    {
      "sku": "NB-004",
      "quantity": 1
    }
  ],
  "reduceMode": "strict",
  "webhookId": "webhook_67890"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "order_12345",
    "webhookId": "webhook_67890",
    "client": {
      "id": "client_123",
      "name": "Tech Store",
      "slug": "tech-store"
    },
    "summary": {
      "totalItems": 2,
      "successful": 2,
      "failed": 0,
      "totalReduced": 3
    },
    "results": [
      {
        "sku": "KB-002",
        "productName": "Mechanical Keyboard",
        "success": true,
        "previousStock": 25,
        "newStock": 23,
        "reduced": 2,
        "belowMinStock": false
      },
      {
        "sku": "NB-004",
        "productName": "Wireless Mouse",
        "success": true,
        "previousStock": 15,
        "newStock": 14,
        "reduced": 1,
        "belowMinStock": true
      }
    ],
    "errors": [],
    "lowStockAlerts": [
      {
        "sku": "NB-004",
        "productName": "Wireless Mouse",
        "currentStock": 14,
        "minStock": 15,
        "message": "Stock level (14) is below minimum (15)"
      }
    ],
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**Features**:
- Reduces inventory when orders are placed
- Two modes: `strict` (fails if insufficient stock) or `allow_negative`
- Returns detailed results for each item
- Low stock alerts for items below minimum
- Webhook support for order tracking

### 2. Check Inventory Availability

**Endpoint**: `POST /api/public/inventory/check?client={client-slug}`

**Headers** (optional):
```
x-api-key: <your-api-key>
Content-Type: application/json
```

**Request Body**:
```json
{
  "items": [
    {
      "sku": "KB-002",
      "quantity": 2
    },
    {
      "sku": "NB-004",
      "quantity": 1
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "client_123",
      "name": "Tech Store",
      "slug": "tech-store"
    },
    "summary": {
      "totalItems": 2,
      "availableItems": 2,
      "unavailableItems": 0,
      "lowStockItems": 1,
      "totalRequested": 3,
      "totalAvailable": 3,
      "totalShortfall": 0
    },
    "availability": [
      {
        "sku": "KB-002",
        "productName": "Mechanical Keyboard",
        "available": true,
        "stockLevel": 25,
        "requested": 2,
        "shortfall": 0,
        "isLowStock": false,
        "minStock": 5,
        "price": 89.99,
        "category": "Electronics"
      }
    ],
    "unavailableItems": [],
    "lowStockAlerts": [
      {
        "sku": "NB-004",
        "productName": "Wireless Mouse",
        "stockLevel": 14,
        "minStock": 15,
        "message": "Stock level (14) is below minimum (15)"
      }
    ],
    "allItemsAvailable": true,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**Features**:
- Check stock availability before placing orders
- Returns detailed availability for each item
- Low stock warnings
- Price and category information included

### 3. Restore Inventory (Order Cancellation/Returns)

**Endpoint**: `POST /api/public/inventory/restore?client={client-slug}`

**Headers** (optional):
```
x-api-key: <your-api-key>
Content-Type: application/json
```

**Request Body**:
```json
{
  "orderId": "order_12345",
  "items": [
    {
      "sku": "KB-002",
      "quantity": 2
    }
  ],
  "reason": "order_cancellation",
  "webhookId": "webhook_67890"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "order_12345",
    "webhookId": "webhook_67890",
    "reason": "order_cancellation",
    "client": {
      "id": "client_123",
      "name": "Tech Store",
      "slug": "tech-store"
    },
    "summary": {
      "totalItems": 1,
      "successful": 1,
      "failed": 0,
      "totalRestored": 2
    },
    "results": [
      {
        "sku": "KB-002",
        "productName": "Mechanical Keyboard",
        "success": true,
        "previousStock": 23,
        "newStock": 25,
        "restored": 2,
        "aboveMinStock": true
      }
    ],
    "errors": [],
    "stockRecovered": [
      {
        "sku": "KB-002",
        "productName": "Mechanical Keyboard",
        "currentStock": 25,
        "minStock": 5,
        "message": "Stock level (25) is now above minimum (5)"
      }
    ],
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**Features**:
- Restores inventory for cancelled orders or returns
- Supports different reasons (cancellation, return, refund)
- Tracks stock recovery above minimum levels
- Webhook support for order tracking

### 4. Bulk Inventory Reduction

**Endpoint**: `POST /api/public/inventory/reduce/bulk?client={client-slug}`

**Headers** (optional):
```
x-api-key: <your-api-key>
Content-Type: application/json
```

**Request Body**:
```json
{
  "orders": [
    {
      "orderId": "order_12345",
      "items": [
        {
          "sku": "KB-002",
          "quantity": 2
        }
      ],
      "webhookId": "webhook_1"
    },
    {
      "orderId": "order_12346",
      "items": [
        {
          "sku": "NB-004",
          "quantity": 1
        }
      ],
      "webhookId": "webhook_2"
    }
  ],
  "reduceMode": "strict",
  "batchId": "batch_20240101_001"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "batchId": "batch_20240101_001",
    "client": {
      "id": "client_123",
      "name": "Tech Store",
      "slug": "tech-store"
    },
    "summary": {
      "totalOrders": 2,
      "successfulOrders": 2,
      "failedOrders": 0,
      "totalItemsProcessed": 2,
      "totalItemsSuccessful": 2,
      "totalItemsFailed": 0,
      "totalQuantityReduced": 3
    },
    "orders": [
      {
        "orderId": "order_12345",
        "webhookId": "webhook_1",
        "success": true,
        "items": [/* item results */],
        "errors": [],
        "summary": {
          "totalItems": 1,
          "successful": 1,
          "failed": 0,
          "totalReduced": 2
        }
      }
    ],
    "lowStockAlerts": [/* low stock items */],
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**Features**:
- Process multiple orders in a single request
- Batch processing for efficiency
- Individual order success/failure tracking
- Comprehensive batch summary

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { /* product data */ },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Error Handling

### HTTP Status Codes

- **200**: Success
- **400**: Bad Request (missing parameters, invalid data)
- **401**: Unauthorized (invalid token or API key)
- **404**: Not Found (product or client not found)
- **500**: Internal Server Error

### Common Error Messages

- `"Client context required"`: Missing client identification
- `"Product not found"`: SKU doesn't exist for the client
- `"Client not found or inactive"`: Invalid client slug
- `"Invalid or missing API key"`: Invalid API key for public endpoints
- `"Maximum 100 SKUs allowed per request"`: Too many SKUs in bulk request

## Rate Limiting

- **Authenticated APIs**: 1000 requests per hour per user
- **Public APIs**: 100 requests per hour per IP (if API key not provided)
- **Public APIs with API key**: 5000 requests per hour per key

## Examples

### cURL Examples

#### Get Product by SKU (Authenticated)
```bash
curl -X GET "https://your-domain.com/api/products/sku/KB-002" \
  -H "Authorization: Bearer your-jwt-token"
```

#### Get Product by SKU (Public)
```bash
curl -X GET "https://your-domain.com/api/public/products/sku/KB-002?client=tech-store" \
  -H "x-api-key: your-api-key"
```

#### Update Product Stock
```bash
curl -X PUT "https://your-domain.com/api/products/sku/KB-002" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"stockLevel": 50, "price": 99.99}'
```

#### Bulk Get Products
```bash
curl -X POST "https://your-domain.com/api/products/sku/bulk" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"skus": ["KB-002", "NB-004"]}'
```

#### Search Products by Image (High Similarity)
```bash
curl -X POST "https://your-domain.com/api/public/search/by-image?client=tech-store" \
  -H "x-api-key: your-api-key" \
  -F "image=@search-image.jpg"
```

#### Advanced Image Search (Configurable)
```bash
curl -X POST "https://your-domain.com/api/public/search/by-image/advanced?client=tech-store&threshold=90&limit=5" \
  -H "x-api-key: your-api-key" \
  -F "image=@search-image.jpg"
```

### JavaScript Examples

#### Get Product Data
```javascript
const response = await fetch('/api/products/sku/KB-002', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
console.log(data.data.price); // 89.99
console.log(data.data.stockLevel); // 25
```

#### Update Product Inventory
```javascript
const response = await fetch('/api/products/sku/KB-002', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    stockLevel: 30,
    price: 99.99
  })
});
const result = await response.json();
```

#### Bulk Inventory Update
```javascript
const response = await fetch('/api/products/sku/bulk', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    updates: [
      { sku: 'KB-002', stockLevel: 30 },
      { sku: 'NB-004', stockLevel: 50 }
    ]
  })
});
const result = await response.json();
console.log(`Updated ${result.data.summary.successful} products`);
```

#### Search Products by Image
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/public/search/by-image?client=tech-store', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey
  },
  body: formData
});
const data = await response.json();

console.log(`Found ${data.data.total} similar products`);
data.data.results.forEach(product => {
  console.log(`${product.productName} (${product.sku}) - ${product.similarity.percent}% similar`);
});
```

#### Advanced Image Search with Custom Threshold
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/public/search/by-image/advanced?client=tech-store&threshold=85&limit=15', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey
  },
  body: formData
});
const data = await response.json();

console.log(`Found ${data.data.total} products with 85%+ similarity`);
console.log('Applied filters:', data.data.filters.applied);
```

#### Reduce Inventory (Order Fulfillment)
```javascript
const response = await fetch('/api/public/inventory/reduce?client=tech-store', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'order_12345',
    items: [
      { sku: 'KB-002', quantity: 2 },
      { sku: 'NB-004', quantity: 1 }
    ],
    reduceMode: 'strict',
    webhookId: 'webhook_67890'
  })
});
const data = await response.json();

console.log(`Reduced inventory for ${data.data.summary.totalReduced} items`);
data.data.results.forEach(item => {
  console.log(`${item.sku}: ${item.previousStock} -> ${item.newStock}`);
});
```

#### Check Inventory Availability
```javascript
const response = await fetch('/api/public/inventory/check?client=tech-store', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    items: [
      { sku: 'KB-002', quantity: 2 },
      { sku: 'NB-004', quantity: 1 }
    ]
  })
});
const data = await response.json();

console.log(`All items available: ${data.data.allItemsAvailable}`);
data.data.availability.forEach(item => {
  console.log(`${item.sku}: ${item.available ? 'Available' : 'Unavailable'} (${item.stockLevel} in stock)`);
});
```

#### Restore Inventory (Order Cancellation)
```javascript
const response = await fetch('/api/public/inventory/restore?client=tech-store', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orderId: 'order_12345',
    items: [
      { sku: 'KB-002', quantity: 2 }
    ],
    reason: 'order_cancellation',
    webhookId: 'webhook_67890'
  })
});
const data = await response.json();

console.log(`Restored ${data.data.summary.totalRestored} items`);
data.data.results.forEach(item => {
  console.log(`${item.sku}: ${item.previousStock} -> ${item.newStock}`);
});
```

#### Bulk Inventory Reduction
```javascript
const response = await fetch('/api/public/inventory/reduce/bulk?client=tech-store', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    orders: [
      {
        orderId: 'order_12345',
        items: [{ sku: 'KB-002', quantity: 2 }],
        webhookId: 'webhook_1'
      },
      {
        orderId: 'order_12346',
        items: [{ sku: 'NB-004', quantity: 1 }],
        webhookId: 'webhook_2'
      }
    ],
    reduceMode: 'strict',
    batchId: 'batch_20240101_001'
  })
});
const data = await response.json();

console.log(`Processed ${data.data.summary.totalOrders} orders`);
console.log(`Successfully reduced ${data.data.summary.totalQuantityReduced} items`);
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Optional: API key for public endpoints
PUBLIC_API_KEY=your-secure-api-key-here

# JWT secret for authenticated endpoints
JWT_SECRET=your-jwt-secret
```

## Security Considerations

1. **API Keys**: Use strong, random API keys for public endpoints
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **HTTPS**: Always use HTTPS in production
4. **Input Validation**: All inputs are validated and sanitized
5. **Client Isolation**: Products are isolated by client ID
6. **Authentication**: JWT tokens are required for write operations

## Support

For API support or questions, please contact your system administrator or refer to the main API documentation.
