# Run Database Migration for Shopify Integration

The database table `shopify_integrations` needs to be created. You have two options:

## Option 1: Use Prisma Migrate (Recommended)

```bash
npm run db:migrate
```

When prompted, name the migration: `add_shopify_integration`

## Option 2: Use Prisma DB Push (Faster, for development)

```bash
npm run db:push
```

This will:
1. Create the `shopify_integrations` table
2. Add `shopifyProductId` and `shopifyVariantId` columns to the `products` table
3. Create the necessary indexes
4. Set up the foreign key relationship

## Option 3: Run the SQL Migration Directly

If the above don't work, you can run the SQL directly:

```bash
psql $DATABASE_URL -f prisma/migrations/20250124000000_add_shopify_integration/migration.sql
```

## After Running the Migration

1. **Regenerate Prisma Client:**
   ```bash
   npm run db:generate
   ```

2. **Restart your dev server:**
   ```bash
   npm run dev
   ```

3. **Try saving the Shopify configuration again**

The error should be resolved once the table is created!

