# Guest E-Commerce Flow Implementation

This document outlines the complete e-commerce flow implementation for guest users, including Product Listing Page (PLP), Product Detail Page (PDP), Cart, Checkout, and Order Management.

## Overview

A complete end-to-end e-commerce application has been implemented for guest users, allowing customers to browse products, add items to cart, place orders, and enabling admins to manage orders.

## Features Implemented

### 1. Product Listing Page (PLP)
- **Location**: `/guest/[slug]/catalog`
- Displays products in a grid layout
- Search functionality
- Category filtering
- Pagination
- Product cards are clickable and navigate to PDP
- Cart icon in header with item count badge

### 2. Product Detail Page (PDP)
- **Location**: `/guest/[slug]/products/[id]`
- Full product details
- Image gallery with modal view
- Quantity selector
- Add to cart functionality
- Stock level display
- Related product information

### 3. Shopping Cart
- **Location**: `/guest/[slug]/cart`
- View all cart items
- Update quantities
- Remove items
- Order summary with subtotal, tax, and shipping
- Navigate to checkout

### 4. Checkout
- **Location**: `/guest/[slug]/checkout`
- Customer information form (name, email, phone)
- Shipping address form
- Order summary
- Form validation
- Order placement (no real payment processing)

### 5. Order Confirmation
- **Location**: `/guest/[slug]/orders/[id]`
- Order details display
- Order number
- Customer information
- Shipping address
- Order items list
- Order summary

### 6. Order Management (Admin)
- **Location**: `/orders` (list view)
- **Location**: `/orders/[id]` (detail view)
- View all orders
- Filter by status
- Search orders
- Update order status
- View order details
- Client filtering (for multi-tenant)

## Database Schema

### New Models Added

#### Order Model
```prisma
model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique
  clientId        String
  status          OrderStatus @default(PENDING)
  customerName    String
  customerEmail   String
  customerPhone   String
  shippingAddress Json
  billingAddress  Json?
  notes           String?
  subtotal        Decimal     @db.Decimal(10, 2)
  tax             Decimal     @default(0) @db.Decimal(10, 2)
  shipping        Decimal     @default(0) @db.Decimal(10, 2)
  total           Decimal     @db.Decimal(10, 2)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  client          Client      @relation("ClientOrders", ...)
  items           OrderItem[]
}
```

#### OrderItem Model
```prisma
model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  productId   String
  productName String
  productSku  String
  price       Decimal  @db.Decimal(10, 2)
  quantity    Int
  subtotal    Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  order       Order    @relation(...)
  product     Product? @relation(...)
}
```

#### OrderStatus Enum
```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

## File Structure

### New Files Created

#### Pages
- `src/app/guest/[slug]/products/[id]/page.tsx` - PDP server component
- `src/app/guest/[slug]/products/[id]/GuestProductDetailClient.tsx` - PDP client component
- `src/app/guest/[slug]/cart/page.tsx` - Cart page
- `src/app/guest/[slug]/cart/GuestCartClient.tsx` - Cart client component
- `src/app/guest/[slug]/checkout/page.tsx` - Checkout page
- `src/app/guest/[slug]/checkout/GuestCheckoutClient.tsx` - Checkout client component
- `src/app/guest/[slug]/orders/[id]/page.tsx` - Order confirmation page
- `src/app/guest/[slug]/orders/[id]/GuestOrderConfirmationClient.tsx` - Order confirmation client
- `src/app/orders/page.tsx` - Orders list (admin)
- `src/app/orders/[id]/page.tsx` - Order detail (admin)

#### API Routes
- `src/app/api/guest/orders/route.ts` - Create order (POST)
- `src/app/api/guest/orders/[id]/route.ts` - Get order details (GET)
- `src/app/api/guest/products/[id]/route.ts` - Get product details (GET)
- `src/app/api/orders/route.ts` - List orders (GET) - admin
- `src/app/api/orders/[id]/route.ts` - Get/Update order (GET, PATCH) - admin

#### Context & Types
- `src/contexts/GuestCartContext.tsx` - Cart state management
- `src/types/cart.ts` - Cart type definitions

#### Components
- `src/components/ImageModal.tsx` - Reusable image modal component
- `src/app/guest/[slug]/layout.tsx` - Guest layout with cart provider

### Modified Files

- `prisma/schema.prisma` - Added Order and OrderItem models
- `src/app/guest/[slug]/catalog/GuestCatalogClient.tsx` - Added cart integration and product links to PDP

## Setup Instructions

### 1. Database Migration

Run the Prisma migration to create the Order and OrderItem tables:

```bash
npx prisma migrate dev --name add_orders_and_order_items
```

Or if you need to generate the migration file first:

```bash
npx prisma migrate dev --name add_orders_and_order_items --create-only
# Review the migration file in prisma/migrations/
# Then run: npx prisma migrate dev
```

### 2. Generate Prisma Client

After migration, regenerate the Prisma client:

```bash
npx prisma generate
```

### 3. Environment Variables

Ensure your `.env.local` has the required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens

## Usage

### Guest Flow

1. **Browse Products**: Navigate to `/guest/[slug]/catalog`
2. **View Product**: Click on any product card to go to `/guest/[slug]/products/[id]`
3. **Add to Cart**: Click "Add to Cart" on PDP
4. **View Cart**: Click cart icon in header or navigate to `/guest/[slug]/cart`
5. **Checkout**: Click "Proceed to Checkout" from cart
6. **Place Order**: Fill in customer and shipping details, then click "Place Order"
7. **Order Confirmation**: View order confirmation at `/guest/[slug]/orders/[id]`

### Admin Flow

1. **View Orders**: Navigate to `/orders`
2. **Filter Orders**: Use status filter dropdown
3. **Search Orders**: Use search bar to find specific orders
4. **View Order Details**: Click "View Details" on any order
5. **Update Status**: Use status update buttons in order detail page

## Cart Functionality

The cart uses React Context (`GuestCartProvider`) to manage state across the guest pages. Cart data is persisted in localStorage with a key specific to each client slug: `guest_cart_[slug]`.

### Cart Context API

```typescript
const {
  items,              // CartItem[]
  addItem,            // (item: Omit<CartItem, 'id'>) => void
  removeItem,         // (productId: string) => void
  updateQuantity,     // (productId: string, quantity: number) => void
  clearCart,          // () => void
  getTotal,           // () => number
  getItemCount,       // () => number
  getItemQuantity,    // (productId: string) => number
} = useGuestCart()
```

## Order Status Flow

1. **PENDING** - Order just placed
2. **CONFIRMED** - Order confirmed by admin
3. **PROCESSING** - Order is being prepared
4. **SHIPPED** - Order has been shipped
5. **DELIVERED** - Order has been delivered
6. **CANCELLED** - Order was cancelled

## Order Notification System

**Note**: A notification system for admins when orders are placed is not yet implemented. This should be added in the future. Suggested implementation:

1. Email notifications to admin users
2. In-app notifications
3. Webhook support for external integrations

You can add notification logic in `src/app/api/guest/orders/route.ts` after order creation.

## Pricing & Calculations

- **Subtotal**: Sum of all item prices × quantities
- **Tax**: 10% of subtotal (configurable)
- **Shipping**: $10 for orders under $100, free for orders $100+
- **Total**: Subtotal + Tax + Shipping

These calculations are handled client-side and should be validated server-side in production.

## Security Considerations

1. **Guest Authentication**: Uses JWT tokens stored in HTTP-only cookies
2. **Client Isolation**: All queries filter by `clientId` for multi-tenancy
3. **Order Validation**: Order creation validates product existence and client matching
4. **Admin Authorization**: Order updates require ADMIN, MANAGER, or MASTER_ADMIN role

## Future Enhancements

1. **Payment Integration**: Add real payment processing
2. **Email Notifications**: Send order confirmation emails and admin notifications
3. **Order Tracking**: Add tracking numbers and shipment tracking
4. **Invoice Generation**: Generate and download invoices
5. **Order History**: Allow customers to view their order history
6. **Wishlist**: Add wishlist functionality
7. **Product Reviews**: Add product review and rating system
8. **Shipping Calculator**: Real-time shipping cost calculation
9. **Inventory Deduction**: Automatically deduct inventory on order confirmation
10. **Order Cancellation**: Allow customers to cancel orders (with restrictions)

## Testing

To test the flow:

1. Navigate to a guest catalog page: `/guest/[your-client-slug]/catalog`
2. Click on a product to view details
3. Add items to cart
4. Proceed to checkout
5. Fill in customer details and place order
6. View order confirmation
7. As admin, navigate to `/orders` to view and manage orders

## Notes

- Cart data is stored in localStorage and is client-specific
- Orders are stored in the database and persist across sessions
- Product prices and details are captured at time of order (snapshot)
- Order numbers are auto-generated with format: `ORD-{timestamp}-{random}`
- All prices are stored as Decimal(10,2) in the database

