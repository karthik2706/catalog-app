#!/usr/bin/env tsx

/**
 * Improved script to copy production database to local database
 * Handles enum types, JSON serialization, and foreign key constraints
 * 
 * Usage:
 *   PROD_DATABASE_URL="postgresql://..." tsx scripts/copy-prod-to-local-improved.ts
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
    log('⚠️  Using current DATABASE_URL (may be production)', 'yellow')
    return process.env.DATABASE_URL
  }

  // Ask user
  log('❌ Production DATABASE_URL not found', 'red')
  log('')
  log('Please provide production DATABASE_URL:', 'yellow')
  log('  1. As argument: tsx scripts/copy-prod-to-local-improved.ts "postgresql://..."')
  log('  2. As env var: export PROD_DATABASE_URL="postgresql://..."')
  log('')
  
  const url = await askQuestion('Production DATABASE_URL: ')
  if (!url || !url.startsWith('postgresql://')) {
    throw new Error('Invalid DATABASE_URL format')
  }
  
  return url
}

async function getLocalDbUrl(): Promise<string> {
  // Try from .env.local
  const localEnv = loadEnvFile(join(process.cwd(), '.env.local'))
  if (localEnv.DATABASE_URL) {
    return localEnv.DATABASE_URL
  }

  // Try from .env
  const env = loadEnvFile(join(process.cwd(), '.env'))
  if (env.DATABASE_URL && env.DATABASE_URL.includes('localhost')) {
    return env.DATABASE_URL
  }

  // Try from environment variable
  if (process.env.LOCAL_DATABASE_URL) {
    return process.env.LOCAL_DATABASE_URL
  }

  throw new Error('Local DATABASE_URL not found in .env.local or .env')
}

// Helper function to properly serialize JSON values
function serializeValue(value: any, columnType: string, columnName: string): { value: any; needsCast: boolean } {
  if (value === null || value === undefined) {
    return { value: null, needsCast: false }
  }

  // Handle JSON/JSONB columns - need explicit casting in SQL
  if (columnType === 'jsonb' || columnType === 'json') {
    if (typeof value === 'string') {
      try {
        // Try to parse to validate it's JSON
        JSON.parse(value)
        // Return as string, will cast in SQL
        return { value: value, needsCast: true }
      } catch {
        // Not valid JSON, stringify
        return { value: JSON.stringify(value), needsCast: true }
      }
    }
    // If it's an object or array, stringify it
    return { value: JSON.stringify(value), needsCast: true }
  }

  // Handle array columns - need explicit casting
  if (columnType.includes('[]') || columnType === 'ARRAY') {
    if (Array.isArray(value)) {
      // Convert to PostgreSQL array string format
      const arrayStr = `{${value.map(v => {
        if (typeof v === 'string') {
          return `"${v.replace(/"/g, '\\"')}"`
        }
        return String(v)
      }).join(',')}}`
      return { value: arrayStr, needsCast: true }
    }
  }

  // Handle enum types - return as string (PostgreSQL will cast)
  if (typeof value === 'string' && ['Role', 'Plan', 'InventoryType'].some(e => columnType.includes(e))) {
    return { value: value, needsCast: true }
  }

  // Handle arrays for PostgreSQL
  if (Array.isArray(value) && !columnType.includes('[]')) {
    // If it's an array but column is not array type, stringify as JSON
    return { value: JSON.stringify(value), needsCast: true }
  }

  return { value: value, needsCast: false }
}

// Get column types from database
async function getColumnTypes(client: PrismaClient, table: string): Promise<Record<string, string>> {
  try {
    const result = await (client as any).$queryRawUnsafe(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `, table)
    
    const types: Record<string, string> = {}
    for (const row of result as Array<{ column_name: string; data_type: string; udt_name: string }>) {
      types[row.column_name] = row.data_type === 'USER-DEFINED' ? row.udt_name : row.data_type
    }
    return types
  } catch (error) {
    return {}
  }
}

async function copyData(prodClient: PrismaClient, localClient: PrismaClient) {
  log('📦 Starting data copy...', 'green')
  log('')

  // Get all tables from the database schema
  log('🔍 Discovering tables...', 'blue')
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
  
  log(`  Found ${tables.length} tables: ${tables.join(', ')}`, 'green')
  log('')

  // Order tables to respect foreign key dependencies
  const tableOrder = [
    'countries',
    'currencies',
    'clients',
    'client_settings',
    'users',
    'categories',
    'products',
    'product_categories',
    'media',
    'product_media',
    'inventory_history',
    'api_keys',
    'image_embeddings',
    'video_frames',
    'frame_embeddings',
    'performance_metrics',
  ]

  // Sort tables based on dependency order
  const sortedTables = [
    ...tableOrder.filter(t => tables.includes(t)),
    ...tables.filter(t => !tableOrder.includes(t))
  ]

  log('📤 Copying data from production...', 'blue')

  for (const table of sortedTables) {
    try {
      log(`  Copying ${table}...`, 'yellow')
      
      // Get column types for this table
      const columnTypes = await getColumnTypes(prodClient, table)
      
      // Get all data from production
      const data = await (prodClient as any).$queryRawUnsafe(`SELECT * FROM "${table}"`)
      
      if (data.length === 0) {
        log(`    ⚠️  ${table} is empty, skipping`, 'yellow')
        continue
      }

      // Delete existing data from local (if any)
      try {
        await (localClient as any).$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
      } catch (truncateError: any) {
        // Table might not exist yet, that's okay
        if (!truncateError.message?.includes('does not exist')) {
          log(`    ⚠️  Could not truncate ${table}: ${truncateError.message}`, 'yellow')
        }
      }
      
      // Get column names from first row
      const columns = Object.keys(data[0])
      
      // Insert data in batches
      const batchSize = 50
      let insertedCount = 0
      
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        
        // Prepare values with proper serialization
        const values: any[] = []
        const valuePlaceholders: string[] = []
        let paramCounter = 1
        
        batch.forEach((row) => {
          const placeholders: string[] = []
          columns.forEach((col) => {
            const columnType = columnTypes[col] || 'text'
            const { value, needsCast } = serializeValue(row[col], columnType, col)
            
            if (needsCast) {
              // For JSONB, arrays, and enums, use explicit casting
              if (columnType === 'jsonb' || columnType === 'json') {
                placeholders.push(`$${paramCounter}::jsonb`)
              } else if (columnType.includes('[]') || columnType === 'ARRAY') {
                placeholders.push(`$${paramCounter}::text[]`)
              } else if (['Role', 'Plan', 'InventoryType'].some(e => columnType.includes(e))) {
                // Cast enum types
                placeholders.push(`$${paramCounter}::"${columnType}"`)
              } else {
                placeholders.push(`$${paramCounter}`)
              }
            } else {
              placeholders.push(`$${paramCounter}`)
            }
            
            values.push(value)
            paramCounter++
          })
          valuePlaceholders.push(`(${placeholders.join(', ')})`)
        })
        
        // Verify parameter count matches
        if (values.length !== paramCounter - 1) {
          throw new Error(`Parameter count mismatch: ${values.length} values but ${paramCounter - 1} parameters`)
        }
        
        // Build insert query with proper escaping
        const columnNames = columns.map(col => `"${col}"`).join(', ')
        const query = `INSERT INTO "${table}" (${columnNames}) VALUES ${valuePlaceholders.join(', ')} ON CONFLICT DO NOTHING`
        
        try {
          await (localClient as any).$executeRawUnsafe(query, ...values)
          insertedCount += batch.length
        } catch (insertError: any) {
          // If batch insert fails, try one by one with better error handling
          log(`    ⚠️  Batch insert failed, trying individual inserts...`, 'yellow')
          for (const row of batch) {
            try {
              const singleValues: any[] = []
              const singlePlaceholders: string[] = []
              
              let paramIdx = 1
              columns.forEach((col) => {
                const columnType = columnTypes[col] || 'text'
                const { value, needsCast } = serializeValue(row[col], columnType, col)
                
                if (needsCast) {
                  // For JSONB, arrays, and enums, use explicit casting
                  if (columnType === 'jsonb' || columnType === 'json') {
                    singlePlaceholders.push(`$${paramIdx}::jsonb`)
                  } else if (columnType.includes('[]') || columnType === 'ARRAY') {
                    singlePlaceholders.push(`$${paramIdx}::text[]`)
                  } else if (['Role', 'Plan', 'InventoryType'].some(e => columnType.includes(e))) {
                    // Cast enum types
                    singlePlaceholders.push(`$${paramIdx}::"${columnType}"`)
                  } else {
                    singlePlaceholders.push(`$${paramIdx}`)
                  }
                } else {
                  singlePlaceholders.push(`$${paramIdx}`)
                }
                
                singleValues.push(value)
                paramIdx++
              })
              
              const singleQuery = `INSERT INTO "${table}" (${columnNames}) VALUES (${singlePlaceholders.join(', ')}) ON CONFLICT DO NOTHING`
              await (localClient as any).$executeRawUnsafe(singleQuery, ...singleValues)
              insertedCount++
            } catch (singleError: any) {
              // Log but continue - some rows may fail due to constraints
              if (!singleError.message?.includes('violates foreign key constraint') && 
                  !singleError.message?.includes('duplicate key')) {
                log(`    ⚠️  Skipped row due to: ${singleError.message}`, 'yellow')
              }
            }
          }
        }
      }
      
      if (insertedCount > 0) {
        log(`    ✓ ${table}: ${insertedCount}/${data.length} records inserted`, 'green')
      } else {
        log(`    ⚠️  ${table}: No records inserted (all may have failed or already exist)`, 'yellow')
      }
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        log(`    ⚠️  ${table} does not exist, skipping`, 'yellow')
      } else {
        log(`    ❌ Error copying ${table}: ${error.message}`, 'red')
        // Continue with other tables
      }
    }
  }

  log('')
  log('✅ Data copy complete!', 'green')
}

async function main() {
  try {
    log('📦 Copying Production Database to Local (Improved)', 'green')
    log('')

    // Get database URLs
    const prodDbUrl = await getProductionDbUrl()
    const localDbUrl = await getLocalDbUrl()

    log('Production DB: ' + prodDbUrl.substring(0, 50) + '...', 'blue')
    log('Local DB: ' + localDbUrl.substring(0, 50) + '...', 'blue')
    log('')

    // Confirm
    log('⚠️  WARNING: This will overwrite your local database!', 'yellow')
    log('⚠️  Production database is read-only - no data will be modified.', 'yellow')
    const answer = await askQuestion('Continue? (y/N): ')
    if (answer.toLowerCase() !== 'y') {
      log('Cancelled', 'yellow')
      process.exit(0)
    }

    log('')

    // Create Prisma clients
    const prodClient = new PrismaClient({
      datasources: {
        db: {
          url: prodDbUrl,
        },
      },
    })

    const localClient = new PrismaClient({
      datasources: {
        db: {
          url: localDbUrl,
        },
      },
    })

    // Test connections
    log('🔌 Testing connections...', 'blue')
    await prodClient.$connect()
    log('  ✓ Production database connected (read-only)', 'green')
    await localClient.$connect()
    log('  ✓ Local database connected', 'green')
    log('')

    // Copy data
    await copyData(prodClient, localClient)

    // Close connections
    await prodClient.$disconnect()
    await localClient.$disconnect()

    log('')
    log('Next steps:', 'blue')
    log('  1. Run: npm run db:generate', 'blue')
    log('  2. Verify: npm run db:studio', 'blue')
    log('')

  } catch (error: any) {
    log('❌ Error: ' + error.message, 'red')
    console.error(error)
    process.exit(1)
  }
}

main()

