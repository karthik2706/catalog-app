-- Visual Search Migration: Add pgvector extension and normalized media tables
-- This migration is idempotent and safe to run multiple times

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create media table for normalized media storage
CREATE TABLE IF NOT EXISTS media (
    id BIGSERIAL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
    "s3Key" TEXT UNIQUE NOT NULL,
    width INTEGER,
    height INTEGER,
    "durationMs" INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create image_embeddings table for CLIP embeddings
CREATE TABLE IF NOT EXISTS image_embeddings (
    "mediaId" BIGINT PRIMARY KEY,
    embedding VECTOR(512) NOT NULL
);

-- Create video_frames table for extracted video frames
CREATE TABLE IF NOT EXISTS video_frames (
    id BIGSERIAL PRIMARY KEY,
    "mediaId" BIGINT NOT NULL,
    "tsMs" INTEGER NOT NULL,
    "frameS3Key" TEXT NOT NULL
);

-- Create frame_embeddings table for video frame embeddings
CREATE TABLE IF NOT EXISTS frame_embeddings (
    "frameId" BIGINT PRIMARY KEY,
    embedding VECTOR(512) NOT NULL
);

-- Add foreign key constraints with CASCADE deletes
ALTER TABLE media 
ADD CONSTRAINT media_productId_fkey 
FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE media 
ADD CONSTRAINT media_clientId_fkey 
FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE image_embeddings 
ADD CONSTRAINT image_embeddings_mediaId_fkey 
FOREIGN KEY ("mediaId") REFERENCES media(id) ON DELETE CASCADE;

ALTER TABLE video_frames 
ADD CONSTRAINT video_frames_mediaId_fkey 
FOREIGN KEY ("mediaId") REFERENCES media(id) ON DELETE CASCADE;

ALTER TABLE frame_embeddings 
ADD CONSTRAINT frame_embeddings_frameId_fkey 
FOREIGN KEY ("frameId") REFERENCES video_frames(id) ON DELETE CASCADE;

-- Create helpful btree indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_productId ON media("productId");
CREATE INDEX IF NOT EXISTS idx_media_clientId ON media("clientId");
CREATE INDEX IF NOT EXISTS idx_media_kind ON media(kind);
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
CREATE INDEX IF NOT EXISTS idx_video_frames_mediaId ON video_frames("mediaId");

-- Create vector indexes for similarity search
-- Try HNSW first (pgvector >= 0.5.0), fall back to IVFFLAT if not available
DO $$
BEGIN
    -- Check if HNSW is available (pgvector >= 0.5.0)
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector' 
        AND EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname = 'vector' AND p.proname = 'hnsw_handler'
        )
    ) THEN
        -- Create HNSW indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_image_embeddings_hnsw 
        ON image_embeddings USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
        
        CREATE INDEX IF NOT EXISTS idx_frame_embeddings_hnsw 
        ON frame_embeddings USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
        
        RAISE NOTICE 'Created HNSW indexes for vector similarity search';
    ELSE
        -- Fall back to IVFFLAT indexes
        CREATE INDEX IF NOT EXISTS idx_image_embeddings_ivfflat 
        ON image_embeddings USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
        
        CREATE INDEX IF NOT EXISTS idx_frame_embeddings_ivfflat 
        ON frame_embeddings USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
        
        RAISE NOTICE 'Created IVFFLAT indexes for vector similarity search (HNSW not available)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not create vector indexes: %', SQLERRM;
        -- Continue without indexes - they can be created later
END $$;

-- Add triggers to update updatedAt timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_media_updated_at 
    BEFORE UPDATE ON media 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TODO: Backfill existing data from Product.images/videos JSON into Media table
-- This will be implemented in a separate migration to avoid blocking this schema change
-- 
-- Backfill plan:
-- 1. Extract image URLs from Product.images JSON array
-- 2. Extract video URLs from Product.videos JSON array  
-- 3. Create Media records for each URL with appropriate metadata
-- 4. Update status to 'completed' for existing media
-- 5. Generate embeddings for existing media (separate worker process)
