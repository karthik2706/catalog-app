import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set')
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create Prisma client with better error handling
let prisma: PrismaClient

try {
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  // Verify Prisma client is properly initialized
  if (!prisma) {
    throw new Error('Failed to initialize Prisma client')
  }

  // Test the connection
  prisma.$connect().catch((error) => {
    console.error('Failed to connect to database:', error)
  })

} catch (error: any) {
  console.error('Error initializing Prisma client:', error)
  throw new Error(`Failed to initialize Prisma client: ${error?.message || 'Unknown error'}`)
}

export { prisma }

// Handle graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
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