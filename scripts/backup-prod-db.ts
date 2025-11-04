#!/usr/bin/env tsx

/**
 * Script to backup production database locally
 * Uses Prisma to avoid pg_dump version mismatch issues
 * 
 * Usage:
 *   PROD_DATABASE_URL="postgresql://..." tsx scripts/backup-prod-db.ts
 */

import { PrismaClient } from '@prisma/client'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { readFileSync } from 'fs'

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

async function getProductionDbUrl(): Promise<string> {
  // Try from command line argument
  const args = process.argv.slice(2)
  if (args[0] && args[0].startsWith('postgresql://')) {
    return args[0]
  }

  // Try from environment variable
  if (process.env.PROD_DATABASE_URL) {
    return process.env.PROD_DATABASE_URL
  }

  // Try from .env.production
  const prodEnv = loadEnvFile(join(process.cwd(), '.env.production'))
  if (prodEnv.DATABASE_URL) {
    return prodEnv.DATABASE_URL
  }

  // Try from current DATABASE_URL if it's a production URL
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')) {
    return process.env.DATABASE_URL
  }

  throw new Error('Production DATABASE_URL not found. Set PROD_DATABASE_URL or provide as argument.')
}

async function backupDatabase(prodClient: PrismaClient) {
  log('📦 Starting database backup...', 'green')
  log('')

  // Create backup directory
  const backupDir = join(process.cwd(), 'backups')
  mkdirSync(backupDir, { recursive: true })

  // Generate backup filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                   new Date().toTimeString().split(' ')[0].replace(/:/g, '-')
  const backupFile = join(backupDir, `prod_backup_${timestamp}.sql`)

  log('📤 Creating backup from production database...', 'blue')
  log(`Backup file: ${backupFile}`)
  log('')

  // Get all tables
  const tablesResult = await (prodClient as any).$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '_prisma%'
    ORDER BY table_name
  `)
  
  const tables = (tablesResult as Array<{ table_name: string }>).map(row => row.table_name)
  
  if (tables.length === 0) {
    log('⚠️  No tables found in production database', 'yellow')
    return
  }

  log(`  Found ${tables.length} tables`, 'green')
  log('')

  // Start building SQL backup
  let sql = `-- Production Database Backup
-- Generated: ${new Date().toISOString()}
-- Tables: ${tables.length}

BEGIN;

`

  // Backup data for each table
  for (const table of tables) {
    try {
      log(`  Backing up ${table}...`, 'yellow')
      
      // Get all data from table
      const data = await (prodClient as any).$queryRawUnsafe(`SELECT * FROM "${table}"`)
      
      if (data.length === 0) {
        log(`    ⚠️  ${table} is empty, skipping`, 'yellow')
        continue
      }

      // Get column names
      const columns = Object.keys(data[0])
      const columnNames = columns.map(col => `"${col}"`).join(', ')

      // Generate INSERT statements
      sql += `-- Table: ${table}\n`
      sql += `-- Records: ${data.length}\n\n`

      // Insert data in batches (1000 rows per batch)
      const batchSize = 1000
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        
        sql += `INSERT INTO "${table}" (${columnNames}) VALUES\n`
        
        const values = batch.map((row: any, idx: number) => {
          const rowValues = columns.map(col => {
            const value = row[col]
            if (value === null || value === undefined) {
              return 'NULL'
            }
            if (typeof value === 'string') {
              // Escape single quotes
              return `'${value.replace(/'/g, "''")}'`
            }
            if (typeof value === 'boolean') {
              return value ? 'TRUE' : 'FALSE'
            }
            if (typeof value === 'object') {
              // JSON/JSONB - stringify and escape
              return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
            }
            return String(value)
          }).join(', ')
          
          return `  (${rowValues})`
        }).join(',\n')
        
        sql += values + ';\n\n'
      }
      
      log(`    ✓ ${table}: ${data.length} records`, 'green')
    } catch (error: any) {
      log(`    ❌ Error backing up ${table}: ${error.message}`, 'red')
      sql += `-- Error backing up ${table}: ${error.message}\n\n`
    }
  }

  sql += `COMMIT;

-- Backup complete
`

  // Write backup file
  writeFileSync(backupFile, sql, 'utf-8')

  // Get file size
  const fs = require('fs')
  const stats = fs.statSync(backupFile)
  const fileSize = (stats.size / 1024 / 1024).toFixed(2) + ' MB'

  log('')
  log('✅ Backup created successfully!', 'green')
  log(`  File: ${backupFile}`, 'green')
  log(`  Size: ${fileSize}`, 'green')
  log('')
  log('To restore from backup:', 'blue')
  log(`  psql [local-database-url] < ${backupFile}`, 'blue')
  log('')
}

async function main() {
  try {
    log('💾 Creating Production Database Backup', 'green')
    log('')

    // Get production database URL
    const prodDbUrl = await getProductionDbUrl()

    log('Production DB: ' + prodDbUrl.substring(0, 50) + '...', 'blue')
    log('⚠️  Production database is read-only - no data will be modified.', 'yellow')
    log('')

    // Create Prisma client
    const prodClient = new PrismaClient({
      datasources: {
        db: {
          url: prodDbUrl,
        },
      },
    })

    // Test connection
    log('🔌 Testing connection...', 'blue')
    await prodClient.$connect()
    log('  ✓ Production database connected (read-only)', 'green')
    log('')

    // Create backup
    await backupDatabase(prodClient)

    // Close connection
    await prodClient.$disconnect()

  } catch (error: any) {
    log('❌ Error: ' + error.message, 'red')
    console.error(error)
    process.exit(1)
  }
}

main()

