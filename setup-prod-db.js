const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgres://ac0cc81d2b386e6ca5a481a53b906e2ab5d94a135398289a1f102e01b0e4ec2a:sk_jb-LaO668rGFCMk646Tkb@db.prisma.io:5432/postgres?sslmode=require'
    }
  }
});

async function setupDatabase() {
  try {
    console.log('🔗 Connecting to production database...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');

    console.log('📋 Setting up database schema...');
    
    // Create ENUM types first
    console.log('🔧 Creating ENUM types...');
    await prisma.$executeRaw`CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER');`;
    await prisma.$executeRaw`CREATE TYPE "Plan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');`;
    await prisma.$executeRaw`CREATE TYPE "InventoryType" AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'TRANSFER');`;
    
    // Create tables using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "currencies" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "symbol" TEXT NOT NULL,
        "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "countries" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "currencyId" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "clients" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "domain" TEXT,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "address" TEXT,
        "logo" TEXT,
        "countryId" TEXT,
        "currencyId" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "plan" "Plan" NOT NULL DEFAULT 'STARTER',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "client_settings" (
        "id" TEXT NOT NULL,
        "clientId" TEXT NOT NULL,
        "companyName" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "address" TEXT,
        "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
        "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
        "autoReorder" BOOLEAN NOT NULL DEFAULT false,
        "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
        "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "client_settings_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT,
        "role" "Role" NOT NULL DEFAULT 'ADMIN',
        "clientId" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "clientId" TEXT NOT NULL,
        "parentId" TEXT,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "sku" TEXT NOT NULL,
        "description" TEXT,
        "price" DECIMAL(10,2) NOT NULL,
        "category" TEXT NOT NULL,
        "categoryId" TEXT,
        "variations" JSONB,
        "stockLevel" INTEGER NOT NULL DEFAULT 0,
        "minStock" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "clientId" TEXT NOT NULL,
        "media" JSONB,
        "images" JSONB,
        "videos" JSONB,
        "thumbnailUrl" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "products_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "inventory_history" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "type" "InventoryType" NOT NULL,
        "reason" TEXT,
        "userId" TEXT,
        "clientId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "inventory_history_pkey" PRIMARY KEY ("id")
      );
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "product_categories" (
        "id" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "categoryId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
      );
    `;

    // Create indexes
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "currencies_name_key" ON "currencies"("name");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "currencies_code_key" ON "currencies"("code");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "countries_name_key" ON "countries"("name");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "countries_code_key" ON "countries"("code");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "clients_slug_key" ON "clients"("slug");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "client_settings_clientId_key" ON "client_settings"("clientId");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_clientId_key" ON "users"("email", "clientId");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_clientId_key" ON "products"("sku", "clientId");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_clientId_parentId_key" ON "categories"("name", "clientId", "parentId");`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "product_categories_productId_categoryId_key" ON "product_categories"("productId", "categoryId");`;

    console.log('✅ Database schema created successfully!');

    // Create default currencies
    console.log('💰 Creating default currencies...');
    await prisma.currency.upsert({
      where: { code: 'USD' },
      update: {},
      create: {
        id: 'cur_usd',
        name: 'US Dollar',
        code: 'USD',
        symbol: '$',
        decimalPlaces: 2,
        isActive: true
      }
    });

    await prisma.currency.upsert({
      where: { code: 'INR' },
      update: {},
      create: {
        id: 'cur_inr',
        name: 'Indian Rupee',
        code: 'INR',
        symbol: '₹',
        decimalPlaces: 2,
        isActive: true
      }
    });

    // Create default countries
    console.log('🌍 Creating default countries...');
    await prisma.country.upsert({
      where: { code: 'US' },
      update: {},
      create: {
        id: 'cty_us',
        name: 'United States',
        code: 'US',
        currencyId: 'cur_usd',
        isActive: true
      }
    });

    await prisma.country.upsert({
      where: { code: 'IN' },
      update: {},
      create: {
        id: 'cty_in',
        name: 'India',
        code: 'IN',
        currencyId: 'cur_inr',
        isActive: true
      }
    });

    console.log('✅ Default data created successfully!');

    // Create super admin user
    console.log('👤 Creating super admin user...');
    
    // Check if super admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'karthik@scan2ship.in',
        role: 'SUPER_ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Super admin already exists, updating password...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('Darling@2706', 12);
      
      // Update the existing super admin
      const updatedAdmin = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword,
          name: 'Karthik Dintakurthi',
          isActive: true
        }
      });
      
      console.log('✅ Super admin password updated successfully!');
      console.log('👤 User ID:', updatedAdmin.id);
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash('Darling@2706', 12);
      
      // Create the super admin user
      const superAdmin = await prisma.user.create({
        data: {
          email: 'karthik@scan2ship.in',
          password: hashedPassword,
          name: 'Karthik Dintakurthi',
          role: 'SUPER_ADMIN',
          isActive: true,
          clientId: null // Super admin is not tied to any specific client
        }
      });
      
      console.log('✅ Super admin created successfully!');
      console.log('👤 User ID:', superAdmin.id);
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('🔐 You can now login with:');
    console.log('   Email: karthik@scan2ship.in');
    console.log('   Password: Darling@2706');
    console.log('   Role: SUPER_ADMIN');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed.');
  }
}

setupDatabase();
