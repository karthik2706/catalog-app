#!/usr/bin/env tsx

/**
 * Script to check pending migrations in production
 * Usage: PROD_DATABASE_URL="postgresql://..." tsx scripts/check-migrations-prod.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'
import { readdirSync } from 'fs'

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function loadEnvFile(filePath: string): Record<string, string> {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const env: Record<string, string> = {}
    
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '')
          env[key.trim()] = value.trim()
        }
      }
    })
    
    return env
  } catch (error) {
    return {}
  }
}

async function checkMigrations() {
  try {
    // Get production DATABASE_URL
    const prodEnv = loadEnvFile(join(process.cwd(), '.env.production'))
    const prodDbUrl = process.env.PROD_DATABASE_URL || prodEnv.DATABASE_URL || process.env.DATABASE_URL

    if (!prodDbUrl) {
      log('❌ Production DATABASE_URL not found', 'red')
      log('Set PROD_DATABASE_URL or run: vercel env pull .env.production', 'yellow')
      process.exit(1)
    }

    log('🔍 Checking Production Database Migrations', 'green')
    log('')
    log(`Production DB: ${prodDbUrl.substring(0, 50)}...`, 'blue')
    log('')

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: prodDbUrl,
        },
      },
    })

    await prisma.$connect()
    log('✅ Connected to production database', 'green')
    log('')

    // Get applied migrations from production
    const appliedMigrations = await (prisma as any).$queryRawUnsafe(`
      SELECT migration_name, finished_at, applied_steps_count
      FROM _prisma_migrations
      ORDER BY finished_at DESC
    `)

    log(`📦 Applied Migrations in Production: ${appliedMigrations.length}`, 'blue')
    log('')
    
    if (appliedMigrations.length > 0) {
      appliedMigrations.forEach((migration: any) => {
        const status = migration.finished_at ? '✓' : '⚠️'
        const color = migration.finished_at ? 'green' : 'yellow'
        log(`  ${status} ${migration.migration_name}`, color)
        if (migration.finished_at) {
          log(`     Applied: ${new Date(migration.finished_at).toLocaleString()}`, 'green')
        } else {
          log(`     Status: Pending/Incomplete`, 'yellow')
        }
      })
    } else {
      log('  ⚠️  No migrations found in _prisma_migrations table', 'yellow')
    }

    log('')

    // Get local migrations
    const migrationsDir = join(process.cwd(), 'prisma', 'migrations')
    const localMigrations = readdirSync(migrationsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .sort()

    log(`📁 Local Migrations: ${localMigrations.length}`, 'blue')
    log('')
    
    localMigrations.forEach(migration => {
      log(`  - ${migration}`, 'blue')
    })

    log('')

    // Compare local vs production
    const appliedMigrationNames = appliedMigrations.map((m: any) => m.migration_name)
    const pendingMigrations = localMigrations.filter(m => !appliedMigrationNames.includes(m))

    if (pendingMigrations.length > 0) {
      log('⚠️  PENDING MIGRATIONS:', 'yellow')
      log('')
      pendingMigrations.forEach(migration => {
        log(`  - ${migration}`, 'yellow')
      })
      log('')
      log('To apply pending migrations:', 'blue')
      log('  PROD_DATABASE_URL="..." npx prisma migrate deploy', 'blue')
    } else {
      log('✅ All local migrations are applied in production', 'green')
    }

    // Check for migrations in production that don't exist locally
    const productionOnlyMigrations = appliedMigrationNames.filter((m: string) => !localMigrations.includes(m))
    if (productionOnlyMigrations.length > 0) {
      log('')
      log('⚠️  Migrations in production that don\'t exist locally:', 'yellow')
      productionOnlyMigrations.forEach((migration: string) => {
        log(`  - ${migration}`, 'yellow')
      })
    }

    await prisma.$disconnect()
  } catch (error: any) {
    log('❌ Error: ' + error.message, 'red')
    console.error(error)
    process.exit(1)
  }
}

checkMigrations()

