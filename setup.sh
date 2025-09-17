#!/bin/bash

echo "🚀 Setting up Retail Catalog & Inventory Management System"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

echo "✅ Node.js and PostgreSQL are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/catalog_app"

# JWT Secret (generate a strong secret for production)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# NextAuth (if using NextAuth.js)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"
EOF
    echo "⚠️  Please update .env.local with your database credentials and JWT secret"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️  Setting up database schema..."
npx prisma db push

# Seed database
echo "🌱 Seeding database with sample data..."
npm run db:seed

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your database credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Login with admin@example.com / admin123"
echo ""
echo "Happy coding! 🚀"
