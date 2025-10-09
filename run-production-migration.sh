#!/bin/bash

# Production Migration Script
# Run this to apply migrations to your production database

echo "🔧 Production Database Migration Script"
echo "========================================"
echo ""

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your production DATABASE_URL"
    echo ""
    echo "Usage:"
    echo "  ./run-production-migration.sh 'postgresql://user:pass@host:port/db'"
    echo ""
    echo "Or set it as environment variable first:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:port/db'"
    echo "  ./run-production-migration.sh"
    echo ""
    exit 1
fi

# Set DATABASE_URL
export DATABASE_URL="$1"

echo "📊 Checking database connection..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Failed to connect to database"
    echo "Please check your DATABASE_URL"
    exit 1
fi

echo "✅ Database connection successful"
echo ""

echo "🚀 Running migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎉 Your production database now has:"
    echo "   - product_media table"
    echo "   - guestPassword column"
    echo "   - guestAccessEnabled column"
    echo ""
    echo "👉 Refresh your production app - the error should be gone!"
else
    echo ""
    echo "❌ Migration failed"
    echo "Please check the error message above"
    exit 1
fi

# Clear the variable
unset DATABASE_URL

