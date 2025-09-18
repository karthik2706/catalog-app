# Image Search Analysis - Poor Similarity Results

## System Overview

This document describes an image search system that uses CLIP embeddings for visual similarity search, but is producing incorrect similarity scores and rankings.

## Architecture

### 1. CLIP Embedding Service (Python Flask - Port 8000)
```python
#!/usr/bin/env python3
import os
import logging
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from io import BytesIO
from PIL import Image
import torch
from sentence_transformers import SentenceTransformer
import cgi

class MockEmbeddingHandler(BaseHTTPRequestHandler):
    model = None
    device = None

    def load_model(self):
        """Load CLIP model if not already loaded"""
        if self.model is None:
            try:
                logger.info(f"Loading CLIP model on {self.device}...")
                self.model = SentenceTransformer('clip-ViT-B-32')
                logger.info("CLIP model loaded successfully.")
            except Exception as e:
                logger.error(f"Error loading CLIP model: {e}")
                self.model = None

    def do_POST(self):
        if self.path == '/embed-image':
            if self.model is None:
                self.load_model()
                if self.model is None:
                    self._set_headers(503)
                    self.wfile.write(json.dumps({"error": "Model not loaded"}).encode('utf-8'))
                    return

            ctype, pdict = cgi.parse_header(self.headers['Content-Type'])
            if ctype == 'multipart/form-data':
                pdict['boundary'] = bytes(pdict['boundary'], "utf-8")
                content_length = int(self.headers['Content-Length'])
                
                # Read the form data
                form_data = cgi.parse_multipart(self.rfile, pdict)
                
                if 'file' not in form_data:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "No file provided"}).encode('utf-8'))
                    return

                file_item = form_data['file'][0]
                
                try:
                    # Open the image using PIL
                    image = Image.open(BytesIO(file_item)).convert("RGB")
                    
                    # Generate embedding
                    embedding = self.model.encode(image, convert_to_tensor=True)
                    
                    # Move to CPU and convert to list
                    embedding_list = embedding.cpu().tolist()

                    self._set_headers(200)
                    response = {
                        "embedding": embedding_list,
                        "model": "CLIP-ViT-B/32",
                        "device": str(self.device)
                    }
                    self.wfile.write(json.dumps(response).encode('utf-8'))
                except Exception as e:
                    logger.error(f"Error processing image for embedding: {e}")
                    self._set_headers(500)
                    self.wfile.write(json.dumps({"error": f"Failed to process image: {e}"}).encode('utf-8'))
```

### 2. Database Schema (PostgreSQL with pgvector)
```sql
-- Products table
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    "clientId" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true
);

-- Media table
CREATE TABLE media (
    id BIGSERIAL PRIMARY KEY,
    "productId" TEXT REFERENCES products(id),
    "clientId" TEXT NOT NULL,
    kind TEXT NOT NULL, -- 'image' or 'video'
    "s3Key" TEXT NOT NULL,
    status TEXT DEFAULT 'completed'
);

-- Image embeddings table with pgvector
CREATE TABLE image_embeddings (
    "mediaId" BIGINT PRIMARY KEY REFERENCES media(id),
    embedding VECTOR(512) -- 512-dimensional CLIP embeddings
);

-- Insert embedding using raw SQL
INSERT INTO image_embeddings ("mediaId", embedding)
VALUES (media_id, '[0.1,0.2,0.3...]'::vector);
```

### 3. Search Logic (TypeScript)
```typescript
// Search function using negative cosine similarity
export async function searchSimilarImages(
  embedding: number[],
  clientId: string,
  limit: number = 24
): Promise<ImageMatch[]> {
  const embeddingArray = `[${embedding.join(',')}]`;
  
  const sql = `
    SELECT 
      p.id as "productId",
      p.name as "productName",
      ie.embedding <#> $1::vector as score,  -- <#> = negative cosine similarity
      m."s3Key",
      m.width,
      m.height
    FROM image_embeddings ie
    JOIN media m ON ie."mediaId" = m.id
    JOIN products p ON m."productId" = p.id
    WHERE p."clientId" = $2
      AND p."isActive" = true
    ORDER BY ie.embedding <#> $1::vector  -- Lower score = better similarity
    LIMIT $3
  `;

  try {
    const result = await query<ImageMatch>(sql, [embeddingArray, clientId, limit]);
    
    // Filter out very poor matches (score > 0.1 means very different)
    const filteredResults = result.rows.filter(match => match.score < 0.1);
    
    // If we have good matches, return them; otherwise return the best available
    return filteredResults.length > 0 ? filteredResults : result.rows.slice(0, 3);
  } catch (error) {
    console.error('Error searching similar images:', error);
    throw new Error('Failed to search similar images');
  }
}
```

### 4. Similarity Score Calculation (React Component)
```typescript
// In SearchByImageModal.tsx
const similarity = Math.round(((1 + result.score) / 2) * 100);

// Where:
// result.score = negative cosine similarity from pgvector <#> operator
// Perfect match: score = -1.0 → similarity = 0%
// No similarity: score = 0.0 → similarity = 50%  
// Opposite: score = 1.0 → similarity = 100%
```

## Current Issues

### Problem 1: Wrong Similarity Scores
- **Expected**: Exact same image should get ~100% similarity
- **Actual**: Exact same image gets only 49-51% similarity
- **Test**: Uploading same image as stored in database

### Problem 2: Incorrect Ranking
- **Expected**: Same image should rank #1
- **Actual**: Different images rank higher than identical image
- **Example**: Mechanical Keyboard (same image) ranks 3rd instead of 1st

### Problem 3: Inconsistent Embeddings
- **Issue**: CLIP generates different embeddings for same image
- **Test**: Same image uploaded twice generates different 512-dim vectors
- **Expected**: Identical images should generate identical embeddings

## Test Results

### Database Query Results (Direct)
```sql
-- Direct database query shows correct similarity
SELECT p.name, ie.embedding <#> '[uploaded_embedding]'::vector as score
FROM products p JOIN image_embeddings ie ON p.id = ie."mediaId"
ORDER BY score;

-- Results:
-- Mechanical Keyboard: -0.9999995827674866  (should be ~100% similarity)
-- Notebook Set:       0.0008270750986412168 (should be ~50% similarity)  
-- Wireless Mouse:     0.021756215021014214  (should be ~51% similarity)
```

### API Search Results (Through Application)
```json
{
  "results": [
    {
      "productName": "Wireless Mouse",
      "score": "-0.026",
      "similarity": 49
    },
    {
      "productName": "Notebook Set", 
      "score": "0.0147",
      "similarity": 51
    },
    {
      "productName": "Mechanical Keyboard",
      "score": "0.0169", 
      "similarity": 51
    }
  ]
}
```

## Key Questions for Analysis

1. **Is the similarity formula correct?** 
   - Current: `((1 + score) / 2) * 100`
   - For negative cosine similarity where -1.0 = perfect match
   - This seems wrong! Perfect match should be 100%, not 0%

2. **Why are identical images getting different CLIP embeddings?**
   - Same image uploaded twice generates different 512-dim vectors
   - Shouldn't identical images always generate identical embeddings?

3. **Is the pgvector `<#>` operator working correctly?**
   - Returns negative cosine similarity where -1.0 = perfect match
   - But our similarity calculation seems inverted

4. **Should we use a different similarity metric?**
   - Maybe cosine similarity instead of negative cosine similarity?
   - Or a different formula for converting scores to percentages?

5. **Is the CLIP model the right choice?**
   - CLIP is designed for semantic similarity, not exact image matching
   - Maybe we need a different model for visual similarity?

## Test Data

- **Uploaded Image**: 97KB WebP file (gold necklace)
- **Database Images**: 3 products with different images
- **Expected**: Same image should get 100% similarity, different images should get lower scores
- **Actual**: All images get 49-51% similarity regardless of visual similarity

## Files Involved

1. **Python Embedding Service**: `real-embedding-service.py`
2. **Search Logic**: `src/lib/search.ts`
3. **API Endpoint**: `src/app/api/search/by-image/route.ts`
4. **React Component**: `src/components/SearchByImageModal.tsx`
5. **Database**: PostgreSQL with pgvector extension

## Environment

- **CLIP Model**: `clip-ViT-B-32` from sentence-transformers
- **Vector Database**: PostgreSQL with pgvector extension
- **Embedding Dimension**: 512
- **Similarity Operator**: `<#>` (negative cosine similarity)
- **Framework**: Next.js 15.5.3 with TypeScript

---

**Goal**: Identify why the image search is producing incorrect similarity scores and rankings, particularly why identical images are not getting 100% similarity scores.
