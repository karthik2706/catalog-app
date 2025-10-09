import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
}

function getUserFromRequest(request: NextRequest): { userId: string; role: string } | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return {
        userId: decoded.userId,
        role: decoded.role
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

// POST /api/admin/migrate - Run database migration (Master Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    // Only allow MASTER_ADMIN to run migrations
    if (!user || user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Master Admin access required' },
        { status: 403 }
      )
    }

    // Check if product_media table exists
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_media'
      );
    `
    
    const result = await prisma.$queryRawUnsafe(checkQuery) as any[]
    const tableExists = result[0]?.exists

    if (tableExists) {
      return NextResponse.json({
        success: true,
        message: 'Migration already applied - product_media table exists',
        alreadyMigrated: true
      })
    }

    // Run the migration SQL
    const migrationSQL = `
      -- AlterTable
      ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "guestAccessEnabled" BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "guestPassword" TEXT;

      -- CreateTable
      CREATE TABLE IF NOT EXISTS "product_media" (
          "id" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "mediaId" TEXT NOT NULL,
          "isPrimary" BOOLEAN NOT NULL DEFAULT false,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "product_media_pkey" PRIMARY KEY ("id")
      );

      -- CreateIndex
      CREATE UNIQUE INDEX IF NOT EXISTS "product_media_productId_mediaId_key" ON "product_media"("productId", "mediaId");

      -- AddForeignKey
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'product_media_mediaId_fkey'
        ) THEN
          ALTER TABLE "product_media" ADD CONSTRAINT "product_media_mediaId_fkey" 
          FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'product_media_productId_fkey'
        ) THEN
          ALTER TABLE "product_media" ADD CONSTRAINT "product_media_productId_fkey" 
          FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `

    // Execute migration
    await prisma.$executeRawUnsafe(migrationSQL)

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      applied: [
        'Created product_media table',
        'Added guestAccessEnabled column to clients',
        'Added guestPassword column to clients'
      ]
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// GET /api/admin/migrate - Check migration status
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user || user.role !== 'MASTER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Master Admin access required' },
        { status: 403 }
      )
    }

    // Check if product_media table exists
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_media'
      );
    `
    
    const result = await prisma.$queryRawUnsafe(checkQuery) as any[]
    const tableExists = result[0]?.exists

    // Check if guest columns exist
    const columnCheck = `
      SELECT 
        EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'clients' AND column_name = 'guestPassword'
        ) as guest_password_exists,
        EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'clients' AND column_name = 'guestAccessEnabled'
        ) as guest_access_exists;
    `
    
    const columnResult = await prisma.$queryRawUnsafe(columnCheck) as any[]

    return NextResponse.json({
      migrationStatus: {
        productMediaTableExists: tableExists,
        guestPasswordColumnExists: columnResult[0]?.guest_password_exists || false,
        guestAccessEnabledColumnExists: columnResult[0]?.guest_access_exists || false,
        allMigrationsApplied: tableExists && 
                             columnResult[0]?.guest_password_exists && 
                             columnResult[0]?.guest_access_exists
      }
    })
  } catch (error: any) {
    console.error('Migration check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check migration status', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

