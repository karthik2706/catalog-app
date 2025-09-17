#!/bin/bash

# Vercel Deployment Script for Catalog App
# This script helps prepare and deploy the application to Vercel

echo "🚀 Starting Vercel deployment process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel:"
    vercel login
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Build the application locally to check for errors
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Set up your database (Vercel Postgres or external)"
echo "   2. Add environment variables in Vercel dashboard"
echo "   3. Test the /api/migrate endpoint to verify database connection"
echo "   4. Set up AWS S3 if using media uploads"
