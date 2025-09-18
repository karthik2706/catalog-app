-- Add vector indexes for better performance
-- This migration adds HNSW index for pgvector if version >= 0.7, otherwise IVFFLAT

-- Check pgvector version and create appropriate index
DO $$
DECLARE
    pgvector_version text;
BEGIN
    -- Get pgvector version
    SELECT extversion INTO pgvector_version FROM pg_extension WHERE extname = 'vector';
    
    IF pgvector_version IS NULL THEN
        RAISE EXCEPTION 'pgvector extension not found. Please install pgvector first.';
    END IF;
    
    -- Check if version is >= 0.7.0 (HNSW support)
    IF pgvector_version >= '0.7.0' THEN
        -- Create HNSW index for better performance
        CREATE INDEX IF NOT EXISTS image_embeddings_embedding_hnsw
            ON image_embeddings USING hnsw (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 200);
        
        RAISE NOTICE 'Created HNSW index for image_embeddings.embedding';
    ELSE
        -- Create IVFFLAT index for older versions
        CREATE INDEX IF NOT EXISTS image_embeddings_embedding_ivf
            ON image_embeddings USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 200);
        
        RAISE NOTICE 'Created IVFFLAT index for image_embeddings.embedding (pgvector version: %)', pgvector_version;
    END IF;
    
    RAISE NOTICE 'pgvector version: %', pgvector_version;
END $$;

-- Add comment for documentation
COMMENT ON INDEX image_embeddings_embedding_hnsw IS 'HNSW index for cosine similarity search on image embeddings';
COMMENT ON INDEX image_embeddings_embedding_ivf IS 'IVFFLAT index for cosine similarity search on image embeddings (fallback for pgvector < 0.7)';
