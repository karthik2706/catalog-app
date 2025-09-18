# Stock Mind Visual Search Runbook

This runbook provides comprehensive guidance for operating and maintaining the Stock Mind visual search system.

## Table of Contents

1. [System Overview](#system-overview)
2. [End-to-End Flow](#end-to-end-flow)
3. [Environment Setup](#environment-setup)
4. [Required Environment Variables](#required-environment-variables)
5. [S3→SQS Integration](#s3sqs-integration)
6. [Scaling the Worker](#scaling-the-worker)
7. [Database Maintenance](#database-maintenance)
8. [Performance Tuning](#performance-tuning)
9. [Common Errors and Fixes](#common-errors-and-fixes)
10. [Monitoring and Alerting](#monitoring-and-alerting)
11. [Troubleshooting Guide](#troubleshooting-guide)

## System Overview

The Stock Mind visual search system consists of:

- **Next.js 15 API**: Handles image uploads and search requests
- **PostgreSQL + pgvector**: Stores product data and vector embeddings
- **FastAPI Embedding Service**: Generates CLIP ViT-B/32 embeddings
- **AWS S3**: Stores media files with presigned URLs
- **SQS Queue**: Triggers embedding generation for new uploads
- **Worker Process**: Processes media files and generates embeddings

## End-to-End Flow

### 1. Image Upload Flow
```
User uploads image → Next.js API → S3 (presigned) → Media row created → SQS message → Worker processes → Embedding generated → Database updated
```

### 2. Search Flow
```
User uploads search image → Next.js API → Embedding service → Vector similarity search → Results returned
```

### 3. Video Processing Flow
```
Video uploaded → S3 → Media row created → Worker extracts frames → Frame embeddings generated → Database updated
```

## Environment Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+ with pgvector extension
- AWS CLI configured
- Docker (for embedding service)

### Local Development Setup

1. **Clone and install dependencies**
```bash
git clone <repository>
cd catalog-app
npm install
```

2. **Set up environment variables**
```bash
cp env.example .env.local
# Edit .env.local with your values
```

3. **Set up database**
```bash
npm run db:generate
npm run db:push
# Or for production: npm run db:migrate
```

4. **Start embedding service**
```bash
cd services/embedding_service
pip install -r requirements.txt
python app.py
```

5. **Start Next.js application**
```bash
npm run dev
```

## Required Environment Variables

### Database Configuration
```bash
DATABASE_URL="postgresql://username:password@hostname:port/database_name"
DIRECT_URL="postgresql://username:password@hostname:port/database_name"  # For migrations
```

### AWS Configuration
```bash
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="your-s3-bucket-name"
```

### JWT Authentication
```bash
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXTAUTH_URL="https://your-stock-mind-app.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret-key"
```

### Embedding Service
```bash
EMBEDDING_SERVICE_URL="http://localhost:8000"  # Local development
# Production: "https://your-embedding-service.com"
```

### SQS Configuration (Production)
```bash
SQS_QUEUE_URL="https://sqs.us-east-1.amazonaws.com/123456789012/stock-mind-media-queue"
AWS_SQS_REGION="us-east-1"
```

## S3→SQS Integration

### Manual Setup (AWS Console)

1. **Create SQS Queue**
   - Queue name: `stock-mind-media-queue`
   - Visibility timeout: 300 seconds
   - Message retention: 14 days

2. **Configure S3 Event Notification**
   - Bucket: Your S3 bucket
   - Event types: `s3:ObjectCreated:*`
   - Destination: SQS queue

3. **Set up IAM Policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "s3.amazonaws.com"
      },
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:123456789012:stock-mind-media-queue",
      "Condition": {
        "ArnEquals": {
          "aws:SourceArn": "arn:aws:s3:::your-bucket-name"
        }
      }
    }
  ]
}
```

### Using Terraform (Recommended)

See the `infra/terraform/` directory for automated infrastructure setup.

## Scaling the Worker

### Horizontal Scaling

1. **Multiple Worker Instances**
```bash
# Start multiple workers
python worker.py --worker-id=1 &
python worker.py --worker-id=2 &
python worker.py --worker-id=3 &
```

2. **Docker Compose Scaling**
```yaml
version: '3.8'
services:
  worker:
    build: ./worker
    environment:
      - SQS_QUEUE_URL=${SQS_QUEUE_URL}
      - DATABASE_URL=${DATABASE_URL}
    deploy:
      replicas: 3
```

3. **Kubernetes Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: embedding-worker
spec:
  replicas: 5
  selector:
    matchLabels:
      app: embedding-worker
  template:
    spec:
      containers:
      - name: worker
        image: stock-mind/embedding-worker:latest
        env:
        - name: SQS_QUEUE_URL
          valueFrom:
            secretKeyRef:
              name: worker-secrets
              key: sqs-queue-url
```

### Vertical Scaling

1. **Increase Worker Resources**
   - CPU: 2-4 cores per worker
   - Memory: 4-8GB per worker
   - GPU: Optional, for faster processing

2. **Optimize Batch Processing**
```python
# Process multiple items in batch
BATCH_SIZE = 10
POLL_INTERVAL = 5  # seconds
```

## Database Maintenance

### Regular Maintenance Tasks

1. **VACUUM and ANALYZE**
```sql
-- Run weekly
VACUUM ANALYZE;

-- For large tables, run during maintenance window
VACUUM FULL media;
VACUUM FULL image_embeddings;
VACUUM FULL frame_embeddings;
```

2. **Index Maintenance**
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Rebuild indexes if needed
REINDEX INDEX CONCURRENTLY idx_image_embeddings_hnsw;
REINDEX INDEX CONCURRENTLY idx_frame_embeddings_hnsw;
```

3. **Vector Index Maintenance**
```sql
-- Check vector index statistics
SELECT 
  schemaname, 
  tablename, 
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE indexname LIKE '%hnsw%' OR indexname LIKE '%ivfflat%';

-- Update vector index parameters
ALTER INDEX idx_image_embeddings_hnsw SET (m = 32, ef_construction = 128);
```

### Monitoring Queries

1. **Check Processing Status**
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM media 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

2. **Find Stuck Items**
```sql
SELECT 
  id, 
  s3_key, 
  status, 
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
FROM media 
WHERE status = 'processing' 
  AND updated_at < NOW() - INTERVAL '1 hour'
ORDER BY updated_at;
```

## Performance Tuning

### HNSW Index Tuning

1. **Construction Parameters**
```sql
-- For better recall, higher memory usage
CREATE INDEX idx_image_embeddings_hnsw 
ON image_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 32, ef_construction = 128);

-- For faster construction, lower memory usage
CREATE INDEX idx_image_embeddings_hnsw 
ON image_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

2. **Search Parameters**
```sql
-- Set search parameters for better performance
SET hnsw.ef_search = 100;  -- Higher = better recall, slower search
SET hnsw.ef_search = 50;   -- Lower = faster search, lower recall
```

### IVFFLAT Index Tuning

1. **Lists Parameter**
```sql
-- For 1M vectors, use 1000-2000 lists
CREATE INDEX idx_image_embeddings_ivfflat 
ON image_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 1000);

-- For 10M vectors, use 10000-20000 lists
CREATE INDEX idx_image_embeddings_ivfflat 
ON image_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10000);
```

### Query Optimization

1. **Use LIMIT for better performance**
```sql
-- Always use LIMIT with vector searches
SELECT * FROM image_embeddings 
ORDER BY embedding <#> query_vector 
LIMIT 10;
```

2. **Filter before vector search when possible**
```sql
-- Filter by clientId first, then search
SELECT * FROM image_embeddings ie
JOIN media m ON ie.media_id = m.id
WHERE m.client_id = 'client-123'
ORDER BY ie.embedding <#> query_vector
LIMIT 10;
```

## Common Errors and Fixes

### Database Errors

1. **"extension 'vector' does not exist"**
```bash
# Install pgvector extension
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

2. **"operator does not exist: vector <#> vector"**
```bash
# Check pgvector version
psql -d your_database -c "SELECT extversion FROM pg_extension WHERE extname = 'vector';"
# Should be >= 0.5.0 for HNSW support
```

3. **"relation 'image_embeddings' does not exist"**
```bash
# Run migrations
npm run db:migrate
# Or manually
psql -d your_database -f prisma/migrations/20250101000000_init_visual_search/steps.sql
```

### Embedding Service Errors

1. **"Model not loaded"**
```bash
# Check service logs
docker logs embedding-service
# Restart service
docker restart embedding-service
```

2. **"CUDA out of memory"**
```bash
# Use CPU mode
export CUDA_VISIBLE_DEVICES=""
python app.py
```

3. **"Connection refused"**
```bash
# Check if service is running
curl http://localhost:8000/health
# Start service
cd services/embedding_service
python app.py
```

### S3/SQS Errors

1. **"Access Denied" on S3**
```bash
# Check AWS credentials
aws sts get-caller-identity
# Update IAM policy for S3 access
```

2. **"Queue does not exist"**
```bash
# Check SQS queue
aws sqs list-queues
# Create queue if missing
aws sqs create-queue --queue-name stock-mind-media-queue
```

3. **"Invalid message format"**
```bash
# Check SQS message format
aws sqs receive-message --queue-url $SQS_QUEUE_URL
# Should contain bucket and key fields
```

### Application Errors

1. **"Tenant not found"**
```bash
# Check tenant slug in request headers
curl -H "x-tenant-slug: your-tenant" /api/search/by-image
# Verify tenant exists in database
psql -d your_database -c "SELECT * FROM clients WHERE slug = 'your-tenant';"
```

2. **"File too large"**
```bash
# Check file size limits
# Default: 10MB for search, 50MB for upload
# Update in API route if needed
```

3. **"Invalid embedding dimension"**
```bash
# Check embedding service response
curl -X POST -F "file=@test.jpg" http://localhost:8000/embed-image
# Should return 512-dimensional vector
```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Database Metrics**
   - Vector index size and usage
   - Query performance (avg response time)
   - Connection pool utilization
   - Storage usage

2. **Application Metrics**
   - API response times
   - Error rates by endpoint
   - Upload success rate
   - Search success rate

3. **Worker Metrics**
   - Queue depth
   - Processing time per item
   - Error rate
   - Memory usage

4. **Embedding Service Metrics**
   - Model loading time
   - Inference latency
   - GPU/CPU utilization
   - Memory usage

### Recommended Alerts

1. **High Error Rate**
   - Alert when error rate > 5% for 5 minutes
   - Check logs for root cause

2. **Queue Backup**
   - Alert when queue depth > 1000 messages
   - Scale workers or check for processing issues

3. **High Response Time**
   - Alert when p95 response time > 2 seconds
   - Check database performance and indexes

4. **Storage Full**
   - Alert when database storage > 80%
   - Plan for cleanup or scaling

## Troubleshooting Guide

### Step-by-Step Debugging

1. **Check Service Health**
```bash
# Check all services
curl http://localhost:3000/api/search/by-image  # Next.js
curl http://localhost:8000/health              # Embedding service
psql -d your_database -c "SELECT 1;"           # Database
```

2. **Check Logs**
```bash
# Application logs
tail -f logs/app.log

# Database logs
tail -f /var/log/postgresql/postgresql.log

# Embedding service logs
docker logs -f embedding-service
```

3. **Test Individual Components**
```bash
# Test database connection
npm run db:verify-visual-search

# Test embedding service
./tests/embedding_smoke.sh

# Test vector search
psql -d your_database -f tests/search-by-image.sql
```

4. **Check Resource Usage**
```bash
# CPU and memory
top
htop

# Disk usage
df -h
du -sh /var/lib/postgresql/data/

# Network connections
netstat -tulpn | grep :5432
netstat -tulpn | grep :8000
```

### Emergency Procedures

1. **Service Outage**
   - Check all service health endpoints
   - Restart services in order: Database → Embedding Service → Next.js
   - Check logs for errors
   - Verify environment variables

2. **Database Issues**
   - Check connection limits
   - Restart PostgreSQL if needed
   - Check for long-running queries
   - Verify pgvector extension

3. **High Load**
   - Scale workers horizontally
   - Check queue depth
   - Optimize database queries
   - Consider read replicas

4. **Data Corruption**
   - Stop all writes
   - Restore from backup
   - Rebuild vector indexes
   - Verify data integrity

### Recovery Procedures

1. **Rebuild Vector Indexes**
```sql
-- Drop and recreate indexes
DROP INDEX IF EXISTS idx_image_embeddings_hnsw;
DROP INDEX IF EXISTS idx_frame_embeddings_hnsw;

-- Recreate with optimal parameters
CREATE INDEX idx_image_embeddings_hnsw 
ON image_embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

2. **Reprocess Failed Media**
```sql
-- Reset failed items to pending
UPDATE media 
SET status = 'pending', error = NULL 
WHERE status = 'failed' 
  AND updated_at < NOW() - INTERVAL '1 hour';
```

3. **Clean Up Orphaned Data**
```sql
-- Remove orphaned embeddings
DELETE FROM image_embeddings 
WHERE media_id NOT IN (SELECT id FROM media);

DELETE FROM frame_embeddings 
WHERE frame_id NOT IN (SELECT id FROM video_frames);
```

---

## Quick Reference

### Common Commands
```bash
# Start all services
npm run dev & cd services/embedding_service && python app.py &

# Check database
npm run db:verify-visual-search

# Test embedding service
./tests/embedding_smoke.sh

# Test vector search
psql -d your_database -f tests/search-by-image.sql

# Check logs
docker logs -f embedding-service
tail -f logs/app.log
```

### Important URLs
- Next.js App: http://localhost:3000
- Embedding Service: http://localhost:8000
- Database: postgresql://localhost:5432/your_database
- SQS Queue: https://sqs.us-east-1.amazonaws.com/123456789012/stock-mind-media-queue

### Emergency Contacts
- Database Admin: [contact]
- DevOps Team: [contact]
- On-call Engineer: [contact]

---

*This runbook should be updated as the system evolves. Please keep it current with any changes to the architecture or procedures.*
