#!/usr/bin/env tsx

/**
 * Deep copy script from production to local database
 * Handles all data types correctly with proper casting
 * 
 * Usage:
 *   PROD_DATABASE_URL="postgresql://..." tsx scripts/deep-copy-prod-to-local.ts
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
  if (process.env.PROD_DATABASE_URL) {
    return process.env.PROD_DATABASE_URL
  }

  const prodEnv = loadEnvFile(join(process.cwd(), '.env.production'))
  if (prodEnv.DATABASE_URL) {
    return prodEnv.DATABASE_URL
  }

  throw new Error('Production DATABASE_URL not found. Set PROD_DATABASE_URL or provide as argument.')
}

async function getLocalDbUrl(): Promise<string> {
  const localEnv = loadEnvFile(join(process.cwd(), '.env.local'))
  const env = loadEnvFile(join(process.cwd(), '.env'))
  const databaseUrl = localEnv.DATABASE_URL || env.DATABASE_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('Local DATABASE_URL not found in .env.local or .env')
  }

  if (!databaseUrl.includes('localhost')) {
    throw new Error('Local DATABASE_URL must point to localhost')
  }

  return databaseUrl
}

// Get column metadata including types
async function getColumnMetadata(client: PrismaClient, table: string): Promise<Record<string, { type: string; isArray: boolean; isEnum: boolean }>> {
  try {
    const result = await (client as any).$queryRawUnsafe(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, table)
    
    const metadata: Record<string, { type: string; isArray: boolean; isEnum: boolean }> = {}
    
    for (const row of result as Array<{ column_name: string; data_type: string; udt_name: string; column_default: string | null }>) {
      const isArray = row.data_type === 'ARRAY' || row.udt_name?.includes('[]')
      const isEnum = row.data_type === 'USER-DEFINED' && !row.udt_name?.includes('vector')
      const type = row.data_type === 'USER-DEFINED' ? row.udt_name : row.data_type
      
      metadata[row.column_name] = {
        type: type || 'text',
        isArray,
        isEnum,
      }
    }
    
    return metadata
  } catch (error) {
    return {}
  }
}

// Serialize value with proper type handling
function serializeValue(value: any, metadata: { type: string; isArray: boolean; isEnum: boolean }): { value: any; sqlType: string } {
  if (value === null || value === undefined) {
    return { value: null, sqlType: 'NULL' }
  }

  // Handle arrays
  if (metadata.isArray) {
    if (Array.isArray(value)) {
      const arrayStr = `{${value.map(v => {
        if (typeof v === 'string') {
          return `"${v.replace(/"/g, '\\"')}"`
        }
        return String(v)
      }).join(',')}}`
      return { value: arrayStr, sqlType: 'text[]' }
    }
    // If it's not an array but column is array type, wrap it
    return { value: `{"${String(value)}"}`, sqlType: 'text[]' }
  }

  // Handle JSON/JSONB
  if (metadata.type === 'jsonb' || metadata.type === 'json') {
    if (typeof value === 'string') {
      try {
        JSON.parse(value)
        return { value: value, sqlType: 'jsonb' }
      } catch {
        return { value: JSON.stringify(value), sqlType: 'jsonb' }
      }
    }
    return { value: JSON.stringify(value), sqlType: 'jsonb' }
  }

  // Handle enums
  if (metadata.isEnum) {
    return { value: String(value), sqlType: metadata.type }
  }

  // Handle booleans
  if (metadata.type === 'boolean') {
    return { value: value, sqlType: 'boolean' }
  }

  // Handle numbers
  if (['bigint', 'integer', 'smallint', 'numeric', 'real', 'double precision'].includes(metadata.type)) {
    return { value: value, sqlType: metadata.type }
  }

  // Handle dates/timestamps
  if (metadata.type === 'timestamp' || metadata.type === 'timestamp without time zone' || 
      metadata.type === 'timestamp with time zone' || metadata.type === 'date' ||
      metadata.type.includes('timestamp') || metadata.type.includes('date')) {
    // Convert Date objects to ISO string
    if (value instanceof Date) {
      return { value: value.toISOString(), sqlType: 'timestamp' }
    }
    // If it's already a string, use it
    if (typeof value === 'string') {
      return { value: value, sqlType: 'timestamp' }
    }
    // If it's a number (timestamp), convert to ISO string
    if (typeof value === 'number') {
      return { value: new Date(value).toISOString(), sqlType: 'timestamp' }
    }
    return { value: String(value), sqlType: 'timestamp' }
  }

  // Handle UUID/cuid
  if (metadata.type === 'uuid' || metadata.type === 'character varying') {
    return { value: String(value), sqlType: 'text' }
  }

  // Default to text
  return { value: String(value), sqlType: 'text' }
}

async function deepCopyData(prodClient: PrismaClient, localClient: PrismaClient) {
  log('📦 Starting deep copy from production...', 'green')
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

  log(`Found ${tables.length} tables`, 'green')
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

  const sortedTables = [
    ...tableOrder.filter(t => tables.includes(t)),
    ...tables.filter(t => !tableOrder.includes(t))
  ]

  log('📤 Copying data from production...', 'blue')
  let totalCopied = 0

  for (const table of sortedTables) {
    try {
      log(`  Copying ${table}...`, 'yellow')
      
      // Get column metadata
      const columnMetadata = await getColumnMetadata(prodClient, table)
      
      // Get all data from production
      const data = await (prodClient as any).$queryRawUnsafe(`SELECT * FROM "${table}"`)
      
      if (data.length === 0) {
        log(`    ⚠️  ${table} is empty, skipping`, 'yellow')
        continue
      }

      // Get column names
      const columns = Object.keys(data[0])
      
      // Build insert query with proper casting
      let insertedCount = 0
      const batchSize = 100

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        const values: any[] = []
        const valuePlaceholders: string[] = []
        let paramCounter = 1

        batch.forEach((row: any) => {
          const placeholders: string[] = []
          
          columns.forEach((col) => {
            const metadata = columnMetadata[col] || { type: 'text', isArray: false, isEnum: false }
            const { value, sqlType } = serializeValue(row[col], metadata)
            
            if (value === null) {
              placeholders.push('NULL')
            } else if (sqlType === 'jsonb') {
              placeholders.push(`$${paramCounter}::jsonb`)
              values.push(value)
              paramCounter++
            } else if (sqlType === 'text[]') {
              placeholders.push(`$${paramCounter}::text[]`)
              values.push(value)
              paramCounter++
            } else if (sqlType === 'timestamp') {
              placeholders.push(`$${paramCounter}::timestamp`)
              values.push(value)
              paramCounter++
            } else if (metadata.isEnum) {
              placeholders.push(`$${paramCounter}::"${sqlType}"`)
              values.push(value)
              paramCounter++
            } else {
              placeholders.push(`$${paramCounter}`)
              values.push(value)
              paramCounter++
            }
          })
          
          valuePlaceholders.push(`(${placeholders.join(', ')})`)
        })

        const columnNames = columns.map(col => `"${col}"`).join(', ')
        const query = `INSERT INTO "${table}" (${columnNames}) VALUES ${valuePlaceholders.join(', ')} ON CONFLICT DO NOTHING`
        
        try {
          await (localClient as any).$executeRawUnsafe(query, ...values)
          insertedCount += batch.length
        } catch (insertError: any) {
          // If batch fails, try individual inserts
          for (const row of batch) {
            try {
              const singleValues: any[] = []
              const singlePlaceholders: string[] = []
              let paramIdx = 1

              columns.forEach((col) => {
                const metadata = columnMetadata[col] || { type: 'text', isArray: false, isEnum: false }
                const { value, sqlType } = serializeValue(row[col], metadata)
                
                if (value === null) {
                  singlePlaceholders.push('NULL')
                } else if (sqlType === 'jsonb') {
                  singlePlaceholders.push(`$${paramIdx}::jsonb`)
                  singleValues.push(value)
                  paramIdx++
                } else if (sqlType === 'text[]') {
                  singlePlaceholders.push(`$${paramIdx}::text[]`)
                  singleValues.push(value)
                  paramIdx++
                } else if (sqlType === 'timestamp') {
                  singlePlaceholders.push(`$${paramIdx}::timestamp`)
                  singleValues.push(value)
                  paramIdx++
                } else if (metadata.isEnum) {
                  singlePlaceholders.push(`$${paramIdx}::"${sqlType}"`)
                  singleValues.push(value)
                  paramIdx++
                } else {
                  singlePlaceholders.push(`$${paramIdx}`)
                  singleValues.push(value)
                  paramIdx++
                }
              })

              const singleQuery = `INSERT INTO "${table}" (${columnNames}) VALUES (${singlePlaceholders.join(', ')}) ON CONFLICT DO NOTHING`
              await (localClient as any).$executeRawUnsafe(singleQuery, ...singleValues)
              insertedCount++
            } catch (singleError: any) {
              // Log but continue
              const errorMsg = singleError.message || String(singleError)
              if (!errorMsg.includes('duplicate key') && !errorMsg.includes('violates foreign key')) {
                log(`    ⚠️  Skipped row: ${errorMsg.substring(0, 150)}`, 'yellow')
              }
            }
          }
        }
      }
      
      if (insertedCount > 0) {
        log(`    ✓ ${table}: ${insertedCount}/${data.length} records`, 'green')
        totalCopied += insertedCount
      } else {
        log(`    ⚠️  ${table}: No records inserted`, 'yellow')
      }
    } catch (error: any) {
      log(`    ❌ Error copying ${table}: ${error.message}`, 'red')
    }
  }

  log('')
  log(`✅ Deep copy complete! Total records copied: ${totalCopied}`, 'green')
}

async function main() {
  try {
    log('📦 Deep Copy from Production to Local', 'green')
    log('')

    const prodDbUrl = await getProductionDbUrl()
    const localDbUrl = await getLocalDbUrl()

    log('Production DB: ' + prodDbUrl.substring(0, 50) + '...', 'blue')
    log('Local DB: ' + localDbUrl.substring(0, 50) + '...', 'blue')
    log('')
    log('⚠️  WARNING: This will overwrite your local database!', 'yellow')
    log('⚠️  Production database is read-only - no data will be modified.', 'yellow')
    const answer = await askQuestion('Continue? (y/N): ')
    if (answer.toLowerCase() !== 'y') {
      log('Cancelled', 'yellow')
      process.exit(0)
    }

    log('')

    const prodClient = new PrismaClient({
      datasources: { db: { url: prodDbUrl } },
    })

    const localClient = new PrismaClient({
      datasources: { db: { url: localDbUrl } },
    })

    log('🔌 Testing connections...', 'blue')
    await prodClient.$connect()
    log('  ✓ Production database connected (read-only)', 'green')
    await localClient.$connect()
    log('  ✓ Local database connected', 'green')
    log('')

    await deepCopyData(prodClient, localClient)

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

