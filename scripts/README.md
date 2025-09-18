# Visual Search Scripts

This directory contains utility scripts for the Stock Mind visual search system.

## Scripts

### 1. `e2e_visual_search_check.ts`

End-to-end validation script that tests the complete visual search workflow.

**What it does:**
1. Creates a temporary test tenant and product
2. Downloads sample images from Unsplash
3. Uploads test image to S3 and creates Media record
4. Simulates embedding generation (calls embedding service)
5. Tests the `/api/search/by-image` endpoint with a similar query image
6. Asserts the test product appears in top 3 results
7. Cleans up all test data

**Usage:**
```bash
# Run full E2E test
npm run e2e:test

# Or directly
tsx scripts/e2e_visual_search_check.ts

# Cleanup only (if test was interrupted)
npm run e2e:cleanup
tsx scripts/e2e_visual_search_check.ts --cleanup-only
```

**Prerequisites:**
- Database running and accessible
- S3 bucket configured and accessible
- Embedding service running (optional, will skip if not available)
- Next.js API running (optional, will test if available)

**Environment Variables:**
```bash
DATABASE_URL="postgresql://..."
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-bucket-name"
EMBEDDING_SERVICE_URL="http://localhost:8000"
API_BASE_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret"
```

**Expected Output:**
```
🚀 Starting E2E Visual Search Test
=====================================
🏗️  Creating test tenant and product...
📥 Downloading test images...
☁️  Uploading image to S3 and creating Media record...
✅ Image uploaded to S3: clients/test-tenant-123/products/E2E-TEST-PRODUCT/media/image/test-456.jpg
✅ Media record created: 789
⚙️  Processing media through worker (simulating embedding generation)...
✅ Embedding generated: 512 dimensions
✅ Embedding stored in database
🔍 Testing visual search API...
✅ Search API responded: 1 results
✅ Test product found in search results!

🎉 E2E TEST PASSED!
✅ Visual search system is working correctly

🧹 Cleaning up test data...
✅ S3 object deleted
✅ Database records deleted
✅ Local files deleted
```

### 2. `backfill_media_from_products.ts`

Backfill script to migrate historical Product JSON data to the new Media table structure.

**What it does:**
1. Reads existing Product.images and Product.videos JSON arrays
2. Extracts S3 keys from URLs
3. Detects media type (image/video) from file extensions
4. Creates Media records with proper tenant isolation
5. Handles both single tenant and all tenants

**Usage:**
```bash
# Dry run for all tenants
npm run backfill:media -- --dry --all

# Process specific tenant
npm run backfill:media -- --tenant=client-slug

# Live run for all tenants
npm run backfill:media -- --all
```

**Expected Output:**
```
🚀 Starting media backfill process...
Mode: DRY RUN

🌍 Processing all tenants...
Found 3 active tenants

🏢 client-1:
   Products processed: 150
   Media created: 300
   Media updated: 0
   Errors: 0

🏢 client-2:
   Products processed: 75
   Media created: 120
   Media updated: 0
   Errors: 0

🎯 TOTALS:
   Products processed: 225
   Media created: 420
   Media updated: 0
   Errors: 0

✅ Backfill completed successfully!
```

## Troubleshooting

### E2E Test Issues

**"Embedding service not available"**
- This is expected if the embedding service isn't running
- The test will continue but skip embedding generation
- To test with embeddings, start the embedding service: `cd services/embedding_service && python app.py`

**"Search API failed"**
- Ensure the Next.js API is running: `npm run dev`
- Check that the API_BASE_URL environment variable is correct
- Verify JWT_SECRET is set correctly

**"S3 upload failed"**
- Check AWS credentials and S3_BUCKET_NAME
- Ensure the S3 bucket exists and is accessible
- Verify AWS_REGION is correct

**"Database connection failed"**
- Check DATABASE_URL is correct
- Ensure the database is running and accessible
- Run migrations if needed: `npm run db:migrate`

### Backfill Issues

**"Tenant not found"**
- Check that the tenant slug exists in the database
- Use `--all` to see all available tenants

**"Invalid S3 key"**
- The script only processes URLs that start with 'clients/'
- Other URLs are skipped (this is expected)

**"Database constraint error"**
- Check for duplicate S3 keys
- The script uses upsert, so it should handle duplicates gracefully

## Development

### Adding New Tests

To add new E2E tests:

1. Create a new test function in `e2e_visual_search_check.ts`
2. Add it to the main test flow
3. Ensure proper cleanup in the finally block
4. Update this README with usage instructions

### Modifying Backfill Logic

To modify the backfill process:

1. Update the `parseMediaFromProduct` function
2. Add new validation rules in `validateMediaData`
3. Update the command-line options if needed
4. Test with `--dry` mode first

## Performance Notes

- E2E test downloads images from Unsplash (requires internet)
- Backfill processes all products in memory (may use significant RAM for large datasets)
- Both scripts include progress logging and error handling
- Cleanup is automatic but can be run manually if needed
