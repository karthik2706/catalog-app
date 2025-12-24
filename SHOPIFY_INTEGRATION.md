# Shopify Integration - Implementation Summary

## Overview
A complete Shopify integration has been implemented for Stock Mind, allowing clients to sync their product catalog and inventory with Shopify stores.

## Features Implemented

### 1. Database Schema Updates
- **New Model**: `ShopifyIntegration` - Stores Shopify credentials and sync settings per client
- **Product Model Updates**: Added `shopifyProductId` and `shopifyVariantId` fields to track Shopify product mappings
- **Indexes**: Added index on `shopifyProductId` for faster lookups

### 2. Shopify API Client Library (`src/lib/shopify.ts`)
- Complete Shopify Admin API client implementation
- Methods for:
  - Product creation and updates
  - Inventory level management
  - Location management
  - Webhook management
  - Order retrieval
  - Connection testing

### 3. Configuration UI (`src/app/settings/shopify/page.tsx`)
- Full-featured configuration page accessible at `/settings/shopify`
- Features:
  - Shop domain and access token configuration
  - Webhook secret (optional) for signature verification
  - Auto-sync toggle (sync products automatically on create/update)
  - Inventory sync toggle (update inventory from Shopify orders)
  - Connection testing
  - Manual sync triggers (sync selected or all products)
  - Sync status display
  - Error handling and display

### 4. API Endpoints

#### Configuration Endpoints
- `GET /api/shopify/config` - Get Shopify integration configuration
- `POST /api/shopify/config` - Create or update Shopify configuration
- `DELETE /api/shopify/config` - Delete Shopify integration

#### Sync Endpoints
- `POST /api/shopify/sync` - Manual sync trigger
  - Supports `syncAll: true` to sync all products
  - Supports `productIds: []` to sync specific products

#### Webhook Endpoints
- `POST /api/shopify/webhooks/orders/create` - Handle order creation
- `POST /api/shopify/webhooks/orders/updated` - Handle order updates (cancellations)
- `POST /api/shopify/webhooks/orders/fulfilled` - Handle order fulfillment
- `POST /api/shopify/webhooks/orders/paid` - Handle order payment

### 5. Automatic Product Sync
- Products are automatically synced to Shopify when:
  - Created via `POST /api/products`
  - Updated via `PUT /api/products/[id]`
- Sync happens asynchronously (non-blocking)
- Only syncs if:
  - Shopify integration is active
  - Auto-sync is enabled
  - Product is active

### 6. Inventory Sync from Shopify
- When orders are placed in Shopify, webhooks update inventory in Stock Mind
- Order cancellations restore inventory
- Inventory history records are created for tracking

### 7. Webhook Management
- Webhooks are automatically created when integration is configured
- Webhooks are cleaned up when integration is deleted
- Webhook signature verification supported (optional)

## Setup Instructions

### 1. Database Migration
Run the Prisma migration to add the new schema:
```bash
npm run db:migrate
# or
npm run db:push
```

### 2. Configure Shopify Integration
1. Navigate to Settings → Shopify Integration
2. Enter your Shopify shop domain (e.g., `mystore.myshopify.com`)
3. Enter your Shopify Admin API access token
4. (Optional) Enter webhook secret for signature verification
5. Configure sync options:
   - Auto-sync: Automatically sync products on create/update
   - Sync inventory: Update inventory from Shopify orders
6. Click "Save Configuration"
7. Test connection to verify credentials

### 3. Create Shopify Access Token
To get a Shopify Admin API access token:
1. Go to your Shopify admin panel
2. Navigate to Apps → Develop apps
3. Create a new app or use an existing one
4. Configure Admin API scopes:
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory`
   - `read_orders`
   - `read_locations`
5. Install the app and copy the Admin API access token

### 4. Manual Sync
- Use "Sync All" button to sync all active products
- Use "Sync Selected" to sync specific products (requires product selection UI)

## How It Works

### Product Sync Flow (Stock Mind → Shopify)
1. Product is created/updated in Stock Mind
2. If auto-sync is enabled, sync function is triggered
3. Product data is transformed to Shopify format
4. Product images are included with signed S3 URLs
5. Product is created/updated in Shopify
6. Shopify product and variant IDs are stored in Stock Mind
7. Inventory level is updated in Shopify

### Inventory Sync Flow (Shopify → Stock Mind)
1. Order is placed in Shopify
2. Shopify sends webhook to Stock Mind
3. Webhook handler processes order line items
4. Finds products by Shopify variant ID
5. Reduces inventory in Stock Mind
6. Creates inventory history record

### Order Cancellation Flow
1. Order is cancelled in Shopify
2. Shopify sends order update webhook
3. Webhook handler detects cancellation
4. Restores inventory in Stock Mind
5. Creates inventory history record with RETURN type

## Security Considerations

1. **Access Tokens**: Currently stored in plain text. In production, consider encrypting:
   ```typescript
   // Example encryption (implement as needed)
   import crypto from 'crypto'
   const encrypted = encrypt(accessToken, process.env.ENCRYPTION_KEY)
   ```

2. **Webhook Verification**: Optional webhook secret for signature verification
   - Implemented but optional
   - Recommended for production

3. **Client Isolation**: All operations are scoped by `clientId`
   - Webhooks include `clientId` in query params
   - Products are filtered by client

## Error Handling

- Sync errors are logged but don't fail product operations
- Sync status is tracked in `ShopifyIntegration` model
- Last sync error is stored for debugging
- UI displays sync status and errors

## Future Enhancements

1. **Encryption**: Encrypt access tokens in database
2. **Retry Logic**: Automatic retry for failed syncs
3. **Batch Sync**: Optimize bulk sync operations
4. **Sync Queue**: Queue-based sync for better performance
5. **Product Variants**: Support for multiple variants per product
6. **Image Optimization**: Optimize images before syncing
7. **Two-way Sync**: Sync changes from Shopify back to Stock Mind
8. **Sync History**: Detailed sync history and logs
9. **Webhook Management UI**: View and manage webhooks from UI
10. **Multi-location Support**: Support for multiple Shopify locations

## API Reference

### Shopify Client Methods
```typescript
// Test connection
await shopifyClient.testConnection()

// Create/update product
await shopifyClient.createOrUpdateProduct(productData)

// Update product
await shopifyClient.updateProduct(shopifyProductId, productData)

// Find product by SKU
await shopifyClient.findProductBySku(sku)

// Update inventory
await shopifyClient.updateInventoryLevel(inventoryItemId, locationId, quantity)

// Get locations
await shopifyClient.getLocations()

// Create webhook
await shopifyClient.createWebhook(topic, address, format)
```

## Troubleshooting

### Connection Test Fails
- Verify shop domain format (should be `mystore.myshopify.com`)
- Verify access token is valid and has required scopes
- Check network connectivity

### Products Not Syncing
- Check if auto-sync is enabled
- Verify integration is active
- Check sync status in UI
- Review error logs

### Inventory Not Updating
- Verify `syncInventory` is enabled
- Check webhook configuration in Shopify
- Verify webhook secret if using signature verification
- Check webhook logs

### Webhook Errors
- Verify webhook URL is accessible
- Check webhook secret if configured
- Review webhook payload format
- Check clientId in webhook URL

## Files Created/Modified

### New Files
- `src/lib/shopify.ts` - Shopify API client
- `src/lib/shopify-sync.ts` - Auto-sync helper
- `src/app/api/shopify/config/route.ts` - Configuration API
- `src/app/api/shopify/sync/route.ts` - Sync API
- `src/app/api/shopify/webhooks/orders/create/route.ts` - Order create webhook
- `src/app/api/shopify/webhooks/orders/updated/route.ts` - Order update webhook
- `src/app/api/shopify/webhooks/orders/fulfilled/route.ts` - Order fulfillment webhook
- `src/app/api/shopify/webhooks/orders/paid/route.ts` - Order paid webhook
- `src/app/settings/shopify/page.tsx` - Configuration UI

### Modified Files
- `prisma/schema.prisma` - Added ShopifyIntegration model and product fields
- `src/app/api/products/route.ts` - Added auto-sync on product create
- `src/app/api/products/[id]/route.ts` - Added auto-sync on product update
- `src/app/settings/page.tsx` - Added Shopify integration tab

## Testing

### Manual Testing Steps
1. Configure Shopify integration with test store
2. Create a product in Stock Mind
3. Verify product appears in Shopify
4. Place an order in Shopify
5. Verify inventory updates in Stock Mind
6. Cancel order in Shopify
7. Verify inventory is restored

### Test Data
- Use Shopify development store for testing
- Create test products with various configurations
- Test with different inventory levels
- Test webhook delivery

---

**Status**: ✅ Complete and ready for use
**Last Updated**: 2025-01-XX

