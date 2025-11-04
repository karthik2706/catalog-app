import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL is available
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('⚠️ DATABASE_URL environment variable is not set')
  // Don't throw here - let Prisma handle it, but log the warning
}

// Create Prisma client with better error handling
// Use singleton pattern for both dev and production (Next.js serverless functions)
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Verify Prisma client is properly initialized
if (!prisma) {
  console.error('❌ Failed to initialize Prisma client')
  throw new Error('Failed to initialize Prisma client')
}

// Store in global to prevent multiple instances
// This works in both development and production (Next.js serverless functions cache the module)
// In production, this helps prevent connection pool exhaustion by reusing the same client instance
globalForPrisma.prisma = prisma

// Test the connection asynchronously (don't block initialization)
// This ensures we can catch connection errors early
prisma.$connect().catch((error) => {
  console.error('❌ Failed to connect to database:', error)
  console.error('Database URL:', databaseUrl ? `${databaseUrl.substring(0, 20)}...` : 'NOT SET')
})

export { prisma }

// Handle graceful shutdown
if (process.env.NODE_ENV === 'production') {
  // In production, ensure proper cleanup
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

// Helper function to check if Prisma client is healthy
export async function checkPrismaHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Prisma health check failed:', error)
    return false
  }
}

// Helper function to handle database operations with proper error handling
export async function withDatabase<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    // Check if Prisma is healthy before operation
    const isHealthy = await checkPrismaHealth()
    if (!isHealthy) {
      throw new Error('Database connection is not healthy')
    }
    
    return await operation(prisma)
  } catch (error) {
    console.error('Database operation failed:', error)
    throw error
  }
}