import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { s3Client, S3_BUCKET_NAME } from '@/lib/aws'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { query } from '@/lib/pg'

/**
 * Database Backup API Route
 * Creates a daily backup of the PostgreSQL database and uploads it to S3
 * 
 * This endpoint should be called by Vercel Cron Jobs or can be triggered manually
 * 
 * Security: Protected with BACKUP_SECRET token (set in environment variables)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify backup secret token (security measure)
    const backupSecret = process.env.BACKUP_SECRET || process.env.CRON_SECRET
    
    if (backupSecret) {
      // Check authorization header
      const authHeader = request.headers.get('authorization')
      const authToken = authHeader?.replace('Bearer ', '') || authHeader
      
      // Check query parameter (for Vercel cron jobs)
      const url = new URL(request.url)
      const secretParam = url.searchParams.get('secret')
      
      // Check Vercel cron secret header
      const cronSecret = request.headers.get('x-vercel-cron-secret')
      
      // Verify any of the above matches the secret
      if (authToken !== backupSecret && secretParam !== backupSecret && cronSecret !== backupSecret) {
        return NextResponse.json(
          { error: 'Unauthorized - Invalid backup secret. Provide secret via Authorization header, query param, or x-vercel-cron-secret header' },
          { status: 401 }
        )
      }
    } else if (process.env.NODE_ENV === 'production') {
      // In production, require secret to be set
      return NextResponse.json(
        { error: 'BACKUP_SECRET or CRON_SECRET must be set in production' },
        { status: 500 }
      )
    }

    const startTime = Date.now()
    console.log('🔄 Starting database backup process...')

    // Check required environment variables
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured')
    }

    if (!S3_BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME environment variable is not set')
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const timeString = new Date().toTimeString().split(' ')[0].replace(/:/g, '-')
    const backupFileName = `db-backup-${timestamp}-${timeString}.sql`
    const s3Key = `backups/database/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${backupFileName}`

    console.log(`📦 Backup filename: ${backupFileName}`)
    console.log(`📤 S3 Key: ${s3Key}`)

    // Get all tables using Prisma
    const tablesResult = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '_prisma%'
        AND table_name NOT LIKE 'pg_%'
      ORDER BY table_name
    `
    
    const tables = tablesResult.map(row => row.table_name)
    
    if (tables.length === 0) {
      return NextResponse.json(
        { error: 'No tables found in database' },
        { status: 404 }
      )
    }

    console.log(`✅ Found ${tables.length} tables to backup`)

    // Start building SQL backup
    let sqlBackup = `-- Database Backup
-- Generated: ${new Date().toISOString()}
-- Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[1] || 'unknown'}
-- Tables: ${tables.length}

BEGIN;

`

    let totalRecords = 0

    // Backup each table
    for (const table of tables) {
      try {
        console.log(`  Backing up table: ${table}...`)
        
        // Get table data using raw query
        const result = await query<Record<string, any>>(`SELECT * FROM "${table}"`)
        const data = result.rows
        
        if (data.length === 0) {
          console.log(`    ⚠️  ${table} is empty, skipping`)
          sqlBackup += `-- Table: ${table} (empty)\n\n`
          continue
        }

        // Get column names
        const columns = Object.keys(data[0])
        const columnNames = columns.map(col => `"${col}"`).join(', ')

        // Add table header comment
        sqlBackup += `-- Table: ${table}\n`
        sqlBackup += `-- Records: ${data.length}\n\n`

        // Generate INSERT statements in batches
        const batchSize = 1000
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize)
          
          sqlBackup += `INSERT INTO "${table}" (${columnNames}) VALUES\n`
          
          const values = batch.map((row: any, idx: number) => {
            const rowValues = columns.map(col => {
              const value = row[col]
              if (value === null || value === undefined) {
                return 'NULL'
              }
              if (typeof value === 'string') {
                // Escape single quotes and handle special characters
                const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "''")
                return `'${escaped}'`
              }
              if (typeof value === 'boolean') {
                return value ? 'TRUE' : 'FALSE'
              }
              if (typeof value === 'number') {
                return String(value)
              }
              if (value instanceof Date) {
                return `'${value.toISOString()}'`
              }
              if (typeof value === 'object') {
                // JSON/JSONB - stringify and escape
                const jsonString = JSON.stringify(value).replace(/\\/g, '\\\\').replace(/'/g, "''")
                return `'${jsonString}'::jsonb`
              }
              // Vector type handling (pgvector)
              if (typeof value === 'object' && value !== null && 'type' in value) {
                // Handle vector type - convert to array format
                try {
                  const vectorArray = JSON.parse(JSON.stringify(value))
                  if (Array.isArray(vectorArray)) {
                    return `'[${vectorArray.join(',')}]'::vector`
                  }
                } catch (e) {
                  // Fallback to NULL for unsupported types
                  return 'NULL'
                }
              }
              return String(value)
            }).join(', ')
            
            return `  (${rowValues})`
          }).join(',\n')
          
          sqlBackup += values + ';\n\n'
        }
        
        totalRecords += data.length
        console.log(`    ✅ ${table}: ${data.length} records backed up`)
      } catch (error: any) {
        console.error(`    ❌ Error backing up ${table}:`, error.message)
        sqlBackup += `-- Error backing up ${table}: ${error.message}\n\n`
      }
    }

    sqlBackup += `COMMIT;

-- Backup Summary
-- Total Tables: ${tables.length}
-- Total Records: ${totalRecords}
-- Backup Complete: ${new Date().toISOString()}
`

    // Convert SQL backup to buffer
    const backupBuffer = Buffer.from(sqlBackup, 'utf-8')
    const backupSizeMB = (backupBuffer.length / 1024 / 1024).toFixed(2)

    console.log(`📊 Backup size: ${backupSizeMB} MB`)
    console.log(`📤 Uploading to S3...`)

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: backupBuffer,
      ContentType: 'application/sql',
      Metadata: {
        'backup-date': timestamp,
        'tables-count': String(tables.length),
        'records-count': String(totalRecords),
        'backup-size-mb': backupSizeMB,
      },
      // Set retention tags (optional - can configure lifecycle policies)
      StorageClass: 'STANDARD_IA', // Infrequent Access for cost optimization
    })

    await s3Client.send(uploadCommand)

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    const s3Url = `s3://${S3_BUCKET_NAME}/${s3Key}`

    console.log(`✅ Backup completed successfully!`)
    console.log(`   Duration: ${duration}s`)
    console.log(`   Location: ${s3Url}`)

    // Optional: Delete old backups (keep last 30 days)
    // You can implement this using S3 lifecycle policies or manually here

    return NextResponse.json({
      success: true,
      message: 'Database backup completed successfully',
      backup: {
        fileName: backupFileName,
        s3Key,
        s3Url,
        size: `${backupSizeMB} MB`,
        tables: tables.length,
        records: totalRecords,
        duration: `${duration}s`,
        timestamp: new Date().toISOString(),
      },
    }, { status: 200 })

  } catch (error: any) {
    console.error('❌ Database backup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create database backup',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Allow POST method for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
