-- WooCommerce live catalog sync integration

CREATE TYPE "WooWebhookDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "woo_commerce_connections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'WooCommerce store',
    "clientId" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "consumerKeyEnc" TEXT NOT NULL,
    "consumerSecretEnc" TEXT NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "deliveryToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastFullSyncAt" TIMESTAMP(3),
    "lastFullSyncError" TEXT,
    "backfillPage" INTEGER NOT NULL DEFAULT 1,
    "backfillComplete" BOOLEAN NOT NULL DEFAULT false,
    "registeredWebhookIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "woo_commerce_connections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "woo_commerce_connections_deliveryToken_key" ON "woo_commerce_connections"("deliveryToken");
CREATE INDEX "woo_commerce_connections_clientId_idx" ON "woo_commerce_connections"("clientId");

ALTER TABLE "woo_commerce_connections" ADD CONSTRAINT "woo_commerce_connections_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "woo_product_maps" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "wooResourceId" INTEGER NOT NULL,
    "wooParentResourceId" INTEGER,
    "productId" TEXT NOT NULL,
    "lastWooModifiedGmt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "woo_product_maps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "woo_product_maps_connectionId_wooResourceId_key" ON "woo_product_maps"("connectionId", "wooResourceId");
CREATE UNIQUE INDEX "woo_product_maps_productId_key" ON "woo_product_maps"("productId");
CREATE INDEX "woo_product_maps_connectionId_wooParentResourceId_idx" ON "woo_product_maps"("connectionId", "wooParentResourceId");

ALTER TABLE "woo_product_maps" ADD CONSTRAINT "woo_product_maps_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "woo_commerce_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "woo_product_maps" ADD CONSTRAINT "woo_product_maps_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "woo_category_maps" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "wooTermId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "woo_category_maps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "woo_category_maps_connectionId_wooTermId_key" ON "woo_category_maps"("connectionId", "wooTermId");

ALTER TABLE "woo_category_maps" ADD CONSTRAINT "woo_category_maps_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "woo_commerce_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "woo_category_maps" ADD CONSTRAINT "woo_category_maps_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "woo_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "resourceId" INTEGER,
    "payload" JSONB NOT NULL,
    "status" "WooWebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "woo_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "woo_webhook_deliveries_deliveryId_key" ON "woo_webhook_deliveries"("deliveryId");
CREATE INDEX "woo_webhook_deliveries_connectionId_status_idx" ON "woo_webhook_deliveries"("connectionId", "status");
CREATE INDEX "woo_webhook_deliveries_connectionId_createdAt_idx" ON "woo_webhook_deliveries"("connectionId", "createdAt");

ALTER TABLE "woo_webhook_deliveries" ADD CONSTRAINT "woo_webhook_deliveries_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "woo_commerce_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
