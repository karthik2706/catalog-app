#!/usr/bin/env tsx

/**
 * Script to deep clean local database - removes all data
 * Usage: tsx scripts/deep-clean-local.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as readline from 'readline'

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

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function deepCleanDatabase() {
  // Get local DATABASE_URL
  const localEnv = loadEnvFile(join(process.cwd(), '.env.local'))
  const env = loadEnvFile(join(process.cwd(), '.env'))
  const databaseUrl = localEnv.DATABASE_URL || env.DATABASE_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    log('❌ DATABASE_URL not found in .env.local or .env', 'red')
    process.exit(1)
  }

  if (!databaseUrl.includes('localhost')) {
    log('❌ ERROR: This script only works with local database!', 'red')
    log(`   Detected database: ${databaseUrl.substring(0, 50)}...`, 'red')
    process.exit(1)
  }

  log('🗑️  Deep Cleaning Local Database', 'green')
  log('')
  log(`Local DB: ${databaseUrl.substring(0, 50)}...`, 'blue')
  log('')
  log('⚠️  WARNING: This will DELETE ALL DATA from local database!', 'yellow')
  const answer = await askQuestion('Are you sure? Type "DELETE ALL" to confirm: ')
  
  if (answer !== 'DELETE ALL') {
    log('Cancelled', 'yellow')
    process.exit(0)
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

  try {
    await prisma.$connect()
    log('✅ Connected to local database', 'green')
    log('')

    // Get all tables
    const tablesResult = await (prisma as any).$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '_prisma%'
      ORDER BY table_name
    `)
    
    const tables = (tablesResult as Array<{ table_name: string }>).map(row => row.table_name)
    
    if (tables.length === 0) {
      log('⚠️  No tables found', 'yellow')
      return
    }

    log(`Found ${tables.length} tables to clean`, 'blue')
    log('')

    // Disable foreign key checks temporarily (PostgreSQL doesn't support this, but we'll truncate in order)
    // Order tables to respect foreign key dependencies (reverse order for deletion)
    const tableOrder = [
      'frame_embeddings',
      'image_embeddings',
      'video_frames',
      'product_media',
      'product_categories',
      'inventory_history',
      'api_keys',
      'media',
      'products',
      'categories',
      'client_settings',
      'users',
      'clients',
      'currencies',
      'countries',
      'performance_metrics',
    ]

    // Sort tables in reverse dependency order
    const sortedTables = [
      ...tableOrder.filter(t => tables.includes(t)).reverse(),
      ...tables.filter(t => !tableOrder.includes(t)).reverse()
    ]

    log('🗑️  Truncating tables...', 'blue')
    
    for (const table of sortedTables) {
      try {
        await (prisma as any).$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
        log(`  ✓ ${table}`, 'green')
      } catch (error: any) {
        log(`  ⚠️  ${table}: ${error.message}`, 'yellow')
      }
    }

    log('')
    log('✅ Deep clean complete!', 'green')
    log('')

    // Verify all tables are empty
    log('🔍 Verifying tables are empty...', 'blue')
    let allEmpty = true
    for (const table of tables) {
      const count = await (prisma as any).$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`)
      const rowCount = (count[0] as any).count
      if (rowCount > 0) {
        log(`  ⚠️  ${table}: ${rowCount} rows remaining`, 'yellow')
        allEmpty = false
      } else {
        log(`  ✓ ${table}: empty`, 'green')
      }
    }

    if (allEmpty) {
      log('')
      log('✅ All tables are empty!', 'green')
    } else {
      log('')
      log('⚠️  Some tables still have data', 'yellow')
    }

  } catch (error: any) {
    log('❌ Error: ' + error.message, 'red')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

deepCleanDatabase()

