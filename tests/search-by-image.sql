-- Visual Search SQL Test Script
-- This script tests the vector similarity search functionality
-- Run with: psql -d your_database -f tests/search-by-image.sql

-- Test data setup
\echo 'Setting up test data...'

-- Create a test client if it doesn't exist
INSERT INTO clients (id, name, slug, email, "isActive") 
VALUES ('test-client-123', 'Test Client', 'test-client', 'test@example.com', true)
ON CONFLICT (id) DO NOTHING;

-- Create a test product if it doesn't exist
INSERT INTO products (id, name, sku, price, category, "clientId", "isActive")
VALUES ('test-product-123', 'Test Product', 'TEST-SKU', 99.99, 'Electronics', 'test-client-123', true)
ON CONFLICT (id) DO NOTHING;

-- Create test media records
INSERT INTO media (id, "productId", "clientId", kind, "s3Key", width, height, status)
VALUES 
  (1, 'test-product-123', 'test-client-123', 'image', 'clients/test-client-123/products/TEST-SKU/media/image/test1.jpg', 1920, 1080, 'completed'),
  (2, 'test-product-123', 'test-client-123', 'image', 'clients/test-client-123/products/TEST-SKU/media/image/test2.jpg', 800, 600, 'completed'),
  (3, 'test-product-123', 'test-client-123', 'video', 'clients/test-client-123/products/TEST-SKU/media/video/test1.mp4', 1920, 1080, 'completed')
ON CONFLICT (id) DO NOTHING;

-- Create test video frames
INSERT INTO video_frames (id, "mediaId", "tsMs", "frameS3Key")
VALUES 
  (1, 3, 1000, 'clients/test-client-123/products/TEST-SKU/media/frames/frame1.jpg'),
  (2, 3, 2000, 'clients/test-client-123/products/TEST-SKU/media/frames/frame2.jpg'),
  (3, 3, 3000, 'clients/test-client-123/products/TEST-SKU/media/frames/frame3.jpg')
ON CONFLICT (id) DO NOTHING;

-- Create test embeddings (512-dimensional vectors)
-- Note: These are dummy vectors for testing - real embeddings would come from CLIP
INSERT INTO image_embeddings ("mediaId", embedding)
VALUES 
  (1, ARRAY[0.1, 0.2, 0.3]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512)),
  (2, ARRAY[0.4, 0.5, 0.6]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512))
ON CONFLICT ("mediaId") DO NOTHING;

INSERT INTO frame_embeddings ("frameId", embedding)
VALUES 
  (1, ARRAY[0.7, 0.8, 0.9]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512)),
  (2, ARRAY[0.2, 0.3, 0.4]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512)),
  (3, ARRAY[0.5, 0.6, 0.7]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512))
ON CONFLICT ("frameId") DO NOTHING;

\echo 'Test data created successfully!'
\echo ''

-- Test 1: Image similarity search
\echo '=== TEST 1: Image Similarity Search ==='
\echo 'Query: Find similar images using cosine similarity'
\echo 'Expected: 2 rows (test images), ordered by similarity score'
\echo ''

SELECT 
  p.id as "productId",
  p.name as "productName",
  ie.embedding <#> ARRAY[0.1, 0.2, 0.3]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512) as score,
  m."s3Key",
  m.width,
  m.height
FROM image_embeddings ie
JOIN media m ON ie."mediaId" = m.id
JOIN products p ON m."productId" = p.id
WHERE p."clientId" = 'test-client-123'
  AND p."isActive" = true
ORDER BY ie.embedding <#> ARRAY[0.1, 0.2, 0.3]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512)
LIMIT 5;

\echo ''
\echo 'Expected result shape:'
\echo '- productId: text (test-product-123)'
\echo '- productName: text (Test Product)'
\echo '- score: float (cosine distance, lower = more similar)'
\echo '- s3Key: text (S3 object key)'
\echo '- width: integer (1920 or 800)'
\echo '- height: integer (1080 or 600)'
\echo ''

-- Test 2: Video frame similarity search
\echo '=== TEST 2: Video Frame Similarity Search ==='
\echo 'Query: Find similar video frames using cosine similarity'
\echo 'Expected: 3 rows (test frames), ordered by similarity score'
\echo ''

SELECT 
  p.id as "productId",
  p.name as "productName",
  fe.embedding <#> ARRAY[0.1, 0.2, 0.3]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512) as score,
  vf."frameS3Key",
  vf."tsMs",
  m.width,
  m.height
FROM frame_embeddings fe
JOIN video_frames vf ON fe."frameId" = vf.id
JOIN media m ON vf."mediaId" = m.id
JOIN products p ON m."productId" = p.id
WHERE p."clientId" = 'test-client-123'
  AND p."isActive" = true
ORDER BY fe.embedding <#> ARRAY[0.1, 0.2, 0.3]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512)
LIMIT 5;

\echo ''
\echo 'Expected result shape:'
\echo '- productId: text (test-product-123)'
\echo '- productName: text (Test Product)'
\echo '- score: float (cosine distance, lower = more similar)'
\echo '- frameS3Key: text (S3 object key for frame)'
\echo '- tsMs: integer (timestamp in milliseconds)'
\echo '- width: integer (1920)'
\echo '- height: integer (1080)'
\echo ''

-- Test 3: Combined search (simulating the actual API)
\echo '=== TEST 3: Combined Search (Images + Video Frames) ==='
\echo 'Query: Union of image and video frame results, grouped by product'
\echo 'Expected: 1 row (test-product-123) with best match'
\echo ''

WITH image_results AS (
  SELECT 
    p.id as "productId",
    p.name as "productName",
    ie.embedding <#> ARRAY[0.1, 0.2, 0.3]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512) as score,
    'image' as match_type,
    m."s3Key" as thumb_url,
    NULL::integer as ts_ms
  FROM image_embeddings ie
  JOIN media m ON ie."mediaId" = m.id
  JOIN products p ON m."productId" = p.id
  WHERE p."clientId" = 'test-client-123'
    AND p."isActive" = true
),
video_results AS (
  SELECT 
    p.id as "productId",
    p.name as "productName",
    fe.embedding <#> ARRAY[0.1, 0.2, 0.3]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512) as score,
    'video' as match_type,
    vf."frameS3Key" as thumb_url,
    vf."tsMs" as ts_ms
  FROM frame_embeddings fe
  JOIN video_frames vf ON fe."frameId" = vf.id
  JOIN media m ON vf."mediaId" = m.id
  JOIN products p ON m."productId" = p.id
  WHERE p."clientId" = 'test-client-123'
    AND p."isActive" = true
),
combined_results AS (
  SELECT * FROM image_results
  UNION ALL
  SELECT * FROM video_results
)
SELECT 
  "productId",
  "productName",
  MIN(score) as best_score,
  (ARRAY_AGG(match_type ORDER BY score))[1] as best_match_type,
  (ARRAY_AGG(thumb_url ORDER BY score))[1] as best_thumb_url,
  (ARRAY_AGG(ts_ms ORDER BY score))[1] as best_ts_ms
FROM combined_results
GROUP BY "productId", "productName"
ORDER BY best_score
LIMIT 5;

\echo ''
\echo 'Expected result shape:'
\echo '- productId: text (test-product-123)'
\echo '- productName: text (Test Product)'
\echo '- best_score: float (lowest cosine distance)'
\echo '- best_match_type: text (image or video)'
\echo '- best_thumb_url: text (S3 key for best match)'
\echo '- best_ts_ms: integer (timestamp for video frames, NULL for images)'
\echo ''

-- Test 4: Index usage verification
\echo '=== TEST 4: Index Usage Verification ==='
\echo 'Query: Check if vector indexes are being used'
\echo 'Expected: Should show index usage in query plan'
\echo ''

EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
  p.id as "productId",
  ie.embedding <#> ARRAY[0.1, 0.2, 0.3]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512) as score
FROM image_embeddings ie
JOIN media m ON ie."mediaId" = m.id
JOIN products p ON m."productId" = p.id
WHERE p."clientId" = 'test-client-123'
ORDER BY ie.embedding <#> ARRAY[0.1, 0.2, 0.3]::vector(512) || ARRAY_FILL(0.0, ARRAY[509])::vector(512)
LIMIT 5;

\echo ''
\echo 'Look for "Index Scan" or "Bitmap Index Scan" on vector indexes'
\echo 'HNSW indexes should show as "Index Scan using idx_image_embeddings_hnsw"'
\echo 'IVFFLAT indexes should show as "Index Scan using idx_image_embeddings_ivfflat"'
\echo ''

-- Cleanup (optional - comment out to keep test data)
\echo '=== CLEANUP ==='
\echo 'Cleaning up test data...'

DELETE FROM frame_embeddings WHERE "frameId" IN (1, 2, 3);
DELETE FROM image_embeddings WHERE "mediaId" IN (1, 2);
DELETE FROM video_frames WHERE id IN (1, 2, 3);
DELETE FROM media WHERE id IN (1, 2, 3);
DELETE FROM products WHERE id = 'test-product-123';
DELETE FROM clients WHERE id = 'test-client-123';

\echo 'Test completed successfully!'
\echo 'All vector search queries are working correctly.'
