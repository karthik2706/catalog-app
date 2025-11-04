#!/bin/bash

# Script to copy production database to local database
# Usage: ./scripts/copy-prod-to-local.sh [production-database-url]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📦 Copying Production Database to Local${NC}"
echo ""

# Check if production DATABASE_URL is provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}⚠️  Production DATABASE_URL not provided${NC}"
  echo ""
  echo "Options:"
  echo "  1. Get from Vercel: vercel env pull .env.production"
  echo "  2. Provide as argument: ./scripts/copy-prod-to-local.sh 'postgresql://...'"
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
    echo "  ./scripts/copy-prod-to-local.sh 'postgresql://user:pass@host:port/db'"
    echo ""
    echo "Or set environment variable:"
    echo "  export PROD_DATABASE_URL='postgresql://user:pass@host:port/db'"
    exit 1
  fi
else
  PROD_DB_URL="$1"
fi

# Get local DATABASE_URL
if [ -f .env.local ]; then
  source .env.local
  LOCAL_DB_URL="$DATABASE_URL"
  echo -e "${GREEN}✓ Found local DATABASE_URL in .env.local${NC}"
elif [ -f .env ]; then
  source .env
  LOCAL_DB_URL="$DATABASE_URL"
  echo -e "${GREEN}✓ Found local DATABASE_URL in .env${NC}"
else
  echo -e "${RED}❌ Error: Local DATABASE_URL not found in .env.local or .env${NC}"
  exit 1
fi

if [ -z "$LOCAL_DB_URL" ]; then
  echo -e "${RED}❌ Error: Local DATABASE_URL is not set${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will overwrite your local database!${NC}"
echo "Production DB: ${PROD_DB_URL:0:50}..."
echo "Local DB: ${LOCAL_DB_URL:0:50}..."
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Cancelled${NC}"
  exit 0
fi

echo ""
echo -e "${GREEN}📤 Exporting from production database...${NC}"

# Create temporary dump file
DUMP_FILE=$(mktemp /tmp/prod-dump-XXXXXX.sql)

# Export from production (data only, no schema)
pg_dump "$PROD_DB_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --file="$DUMP_FILE" \
  2>&1 | grep -v "WARNING" || true

if [ ! -s "$DUMP_FILE" ]; then
  echo -e "${RED}❌ Error: Failed to export from production database${NC}"
  rm -f "$DUMP_FILE"
  exit 1
fi

echo -e "${GREEN}✓ Export complete${NC}"
echo ""

echo -e "${GREEN}📥 Importing to local database...${NC}"

# Import to local database
# First, truncate tables to clear existing data
echo -e "${YELLOW}🗑️  Clearing local database...${NC}"
psql "$LOCAL_DB_URL" -c "TRUNCATE TABLE api_keys, inventory_history, product_variants, product_images, products, categories, users, client_settings, clients, currencies, countries CASCADE;" 2>&1 | grep -v "WARNING" || true

echo -e "${GREEN}📥 Importing data...${NC}"
psql "$LOCAL_DB_URL" -f "$DUMP_FILE" 2>&1 | grep -v "WARNING" || true

# Clean up
rm -f "$DUMP_FILE"

echo ""
echo -e "${GREEN}✅ Database copy complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run: npm run db:generate"
echo "  2. Verify: npm run db:studio"
echo ""

