#!/usr/bin/env tsx

/**
 * Script to compare production and local database schemas
 * Usage: PROD_DATABASE_URL="postgresql://..." tsx scripts/compare-schemas.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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

async function getTableSchema(client: PrismaClient, tableName: string): Promise<any[]> {
  const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = $1
    ORDER BY ordinal_position
  `
  return await (client as any).$queryRawUnsafe(query, tableName)
}

async function getTableConstraints(client: PrismaClient, tableName: string): Promise<any[]> {
  const query = `
    SELECT
      constraint_name,
      constraint_type
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = $1
  `
  return await (client as any).$queryRawUnsafe(query, tableName)
}

async function compareSchemas() {
  try {
    // Get database URLs
    const prodDbUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
    const localEnv = loadEnvFile(join(process.cwd(), '.env.local'))
    const localDbUrl = process.env.DATABASE_URL || localEnv.DATABASE_URL

    if (!prodDbUrl) {
      log('❌ Production DATABASE_URL not found', 'red')
      process.exit(1)
    }

    if (!localDbUrl) {
      log('❌ Local DATABASE_URL not found', 'red')
      process.exit(1)
    }

    log('🔍 Comparing Production and Local Database Schemas', 'green')
    log('')

    // Create Prisma clients
    const prodClient = new PrismaClient({
      datasources: { db: { url: prodDbUrl } },
    })

    const localClient = new PrismaClient({
      datasources: { db: { url: localDbUrl } },
    })

    await prodClient.$connect()
    await localClient.$connect()
    log('✅ Connected to both databases', 'green')
    log('')

    // Get all tables from both databases
    const prodTables = await (prodClient as any).$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '_prisma%'
      ORDER BY table_name
    `)

    const localTables = await (localClient as any).$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '_prisma%'
      ORDER BY table_name
    `)

    const prodTableNames = (prodTables as Array<{ table_name: string }>).map(t => t.table_name)
    const localTableNames = (localTables as Array<{ table_name: string }>).map(t => t.table_name)

    log(`📊 Production Tables: ${prodTableNames.length}`, 'blue')
    log(`📊 Local Tables: ${localTableNames.length}`, 'blue')
    log('')

    // Find tables that exist in one but not the other
    const onlyInProd = prodTableNames.filter(t => !localTableNames.includes(t))
    const onlyInLocal = localTableNames.filter(t => !prodTableNames.includes(t))
    const commonTables = prodTableNames.filter(t => localTableNames.includes(t))

    if (onlyInProd.length > 0) {
      log('⚠️  Tables only in Production:', 'yellow')
      onlyInProd.forEach(t => log(`  - ${t}`, 'yellow'))
      log('')
    }

    if (onlyInLocal.length > 0) {
      log('⚠️  Tables only in Local:', 'yellow')
      onlyInLocal.forEach(t => log(`  - ${t}`, 'yellow'))
      log('')
    }

    // Compare schemas of common tables
    log('🔍 Comparing schemas of common tables...', 'cyan')
    log('')

    let schemaDifferences = 0

    for (const tableName of commonTables) {
      const prodSchema = await getTableSchema(prodClient, tableName)
      const localSchema = await getTableSchema(localClient, tableName)

      const prodColumns = new Map(prodSchema.map((col: any) => [col.column_name, col]))
      const localColumns = new Map(localSchema.map((col: any) => [col.column_name, col]))

      // Check for column differences
      const allColumnNames = new Set([...prodColumns.keys(), ...localColumns.keys()])
      let tableHasDiff = false

      for (const colName of allColumnNames) {
        const prodCol = prodColumns.get(colName)
        const localCol = localColumns.get(colName)

        if (!prodCol) {
          log(`  ⚠️  ${tableName}.${colName}: Only in LOCAL`, 'yellow')
          tableHasDiff = true
        } else if (!localCol) {
          log(`  ⚠️  ${tableName}.${colName}: Only in PRODUCTION`, 'yellow')
          tableHasDiff = true
        } else {
          // Compare column properties
          const props = ['data_type', 'is_nullable', 'character_maximum_length']
          for (const prop of props) {
            if (prodCol[prop] !== localCol[prop]) {
              log(`  ⚠️  ${tableName}.${colName}.${prop}:`, 'yellow')
              log(`     PROD: ${prodCol[prop]}`, 'yellow')
              log(`     LOCAL: ${localCol[prop]}`, 'yellow')
              tableHasDiff = true
            }
          }
        }
      }

      if (tableHasDiff) {
        schemaDifferences++
        log('')
      }
    }

    // Check Prisma migrations status
    log('')
    log('🔍 Checking Prisma migrations status...', 'cyan')
    log('')

    const prodMigrations = await (prodClient as any).$queryRawUnsafe(`
      SELECT migration_name, finished_at, applied_steps_count
      FROM _prisma_migrations
      WHERE finished_at IS NOT NULL
      ORDER BY finished_at DESC
    `)

    const localMigrations = await (localClient as any).$queryRawUnsafe(`
      SELECT migration_name, finished_at, applied_steps_count
      FROM _prisma_migrations
      WHERE finished_at IS NOT NULL
      ORDER BY finished_at DESC
    `)

    const prodMigrationNames = (prodMigrations as any[]).map(m => m.migration_name)
    const localMigrationNames = (localMigrations as any[]).map(m => m.migration_name)

    log(`📦 Production Migrations: ${prodMigrationNames.length}`, 'blue')
    log(`📦 Local Migrations: ${localMigrationNames.length}`, 'blue')
    log('')

    const missingInLocal = prodMigrationNames.filter(m => !localMigrationNames.includes(m))
    const missingInProd = localMigrationNames.filter(m => !prodMigrationNames.includes(m))

    if (missingInLocal.length > 0) {
      log('⚠️  Migrations in PROD but not in LOCAL:', 'yellow')
      missingInLocal.forEach(m => log(`  - ${m}`, 'yellow'))
      log('')
    }

    if (missingInProd.length > 0) {
      log('⚠️  Migrations in LOCAL but not in PROD:', 'yellow')
      missingInProd.forEach(m => log(`  - ${m}`, 'yellow'))
      log('')
    }

    // Summary
    log('')
    log('📋 Summary:', 'cyan')
    log('')
    if (onlyInProd.length > 0 || onlyInLocal.length > 0 || schemaDifferences > 0) {
      log('⚠️  Schema differences found!', 'yellow')
      log(`  - Tables only in PROD: ${onlyInProd.length}`, 'yellow')
      log(`  - Tables only in LOCAL: ${onlyInLocal.length}`, 'yellow')
      log(`  - Tables with schema differences: ${schemaDifferences}`, 'yellow')
      log('')
      log('💡 Recommendation: Run `prisma db pull` to sync local schema with production', 'blue')
    } else {
      log('✅ No schema differences found!', 'green')
    }

    if (missingInLocal.length > 0 || missingInProd.length > 0) {
      log('⚠️  Migration differences found!', 'yellow')
      log('')
      log('💡 Recommendation: Ensure migrations are in sync', 'blue')
    } else {
      log('✅ Migrations are in sync!', 'green')
    }

    await prodClient.$disconnect()
    await localClient.$disconnect()

  } catch (error: any) {
    log('❌ Error: ' + error.message, 'red')
    console.error(error)
    process.exit(1)
  }
}

compareSchemas()

