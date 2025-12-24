-- CreateTable
CREATE TABLE "shopify_integrations" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "autoSync" BOOLEAN NOT NULL DEFAULT true,
    "syncInventory" BOOLEAN NOT NULL DEFAULT true,
    "webhookSecret" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopify_integrations_clientId_key" ON "shopify_integrations"("clientId");

-- AddForeignKey
ALTER TABLE "shopify_integrations" ADD CONSTRAINT "shopify_integrations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add Shopify fields to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shopifyProductId" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "shopifyVariantId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_shopifyProductId_idx" ON "products"("shopifyProductId");

