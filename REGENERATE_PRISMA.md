# Prisma Client Regeneration Required

After adding the `ShopifyIntegration` model to the Prisma schema, you need to regenerate the Prisma client.

## Steps to Fix the Prisma Error

1. **Regenerate Prisma Client:**
   ```bash
   npm run db:generate
   ```
   or
   ```bash
   npx prisma generate
   ```

2. **Push Schema Changes to Database (if not already done):**
   ```bash
   npm run db:push
   ```
   or create a migration:
   ```bash
   npm run db:migrate
   ```

3. **Restart the Development Server:**
   ```bash
   npm run dev
   ```

## What Changed

We added a new `ShopifyIntegration` model to the schema which requires:
- Prisma client regeneration to include the new model types
- Database migration to create the new table

The error you're seeing is because the Prisma client doesn't know about the new `ShopifyIntegration` model yet.

