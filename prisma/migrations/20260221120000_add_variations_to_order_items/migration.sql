-- AlterTable
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variations" JSONB;
