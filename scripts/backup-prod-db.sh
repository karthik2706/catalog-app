#!/bin/bash

# Script to backup production database locally
# Usage: ./scripts/backup-prod-db.sh [production-database-url]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}💾 Creating Production Database Backup${NC}"
echo ""

# Check if production DATABASE_URL is provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}⚠️  Production DATABASE_URL not provided${NC}"
  echo ""
  echo "Options:"
  echo "  1. Get from Vercel: vercel env pull .env.production"
  echo "  2. Provide as argument: ./scripts/backup-prod-db.sh 'postgresql://...'"
  echo "  3. Export as env var: export PROD_DATABASE_URL='postgresql://...'"
  echo ""
  
  # Try to get from Vercel
  if command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Trying to get production DATABASE_URL from Vercel...${NC}"
    if vercel env pull .env.production --yes 2>/dev/null; then
      if [ -f .env.production ]; then
        source .env.production
        PROD_DB_URL="$DATABASE_URL"
        rm .env.production
        echo -e "${GREEN}✓ Got DATABASE_URL from Vercel${NC}"
      fi
    fi
  fi
  
  # Try to get from environment variable
  if [ -z "$PROD_DB_URL" ] && [ -n "$PROD_DATABASE_URL" ]; then
    PROD_DB_URL="$PROD_DATABASE_URL"
    echo -e "${GREEN}✓ Using PROD_DATABASE_URL environment variable${NC}"
  fi
  
  # Still not found
  if [ -z "$PROD_DB_URL" ]; then
    echo -e "${RED}❌ Error: Production DATABASE_URL is required${NC}"
    echo ""
    echo "Usage:"
    echo "  ./scripts/backup-prod-db.sh 'postgresql://user:pass@host:port/db'"
    echo ""
    echo "Or set environment variable:"
    echo "  export PROD_DATABASE_URL='postgresql://user:pass@host:port/db'"
    exit 1
  fi
else
  PROD_DB_URL="$1"
fi

# Create backup directory
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/prod_backup_${TIMESTAMP}.sql"

echo -e "${GREEN}📤 Creating backup from production database...${NC}"
echo "Backup file: $BACKUP_FILE"
echo ""

# Create backup (schema + data)
pg_dump "$PROD_DB_URL" \
  --no-owner \
  --no-privileges \
  --file="$BACKUP_FILE" \
  2>&1 | grep -v "WARNING" || true

if [ ! -s "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Error: Failed to create backup${NC}"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# Get file size
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo ""
echo -e "${GREEN}✅ Backup created successfully!${NC}"
echo "  File: $BACKUP_FILE"
echo "  Size: $FILE_SIZE"
echo ""
echo "To restore from backup:"
echo "  psql [local-database-url] < $BACKUP_FILE"
echo ""

