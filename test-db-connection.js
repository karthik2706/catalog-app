const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const clientCount = await prisma.client.count();
    console.log('✅ Client count query successful:', clientCount);
    
    // Test tenant query
    const client = await prisma.client.findUnique({
      where: { slug: 'test-company' }
    });
    console.log('✅ Tenant query successful:', client ? 'Found' : 'Not found');
    
    if (client) {
      console.log('Client details:', {
        id: client.id,
        slug: client.slug,
        isActive: client.isActive
      });
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
