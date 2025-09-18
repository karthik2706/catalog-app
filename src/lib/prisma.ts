import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Handle graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // In production, ensure proper cleanup
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

// Helper function to handle database operations with proper error handling
export async function withDatabase<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await operation(prisma)
  } catch (error) {
    console.error('Database operation failed:', error)
    throw error
  }
}