const { PrismaClient } = require('@prisma/client');

async function createApiKey() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating API key...');
    
    // First, check if the client exists
    let client = await prisma.client.findFirst({
      where: { slug: 'scan2ship' }
    });
    
    if (!client) {
      console.log('Creating client...');
      client = await prisma.client.create({
        data: {
          name: 'Scan2Ship',
          slug: 'scan2ship',
          isActive: true
        }
      });
      console.log('Client created:', client.id);
    } else {
      console.log('Client found:', client.id);
    }
    
    // Check if API key exists
    let apiKey = await prisma.apiKey.findFirst({
      where: { key: 'cat_sk_d2d906dd5b9c28e4d7bbe8e58f140603de86de5f096bfdfaf6192064210a29ae' }
    });
    
    if (!apiKey) {
      console.log('Creating API key...');
      apiKey = await prisma.apiKey.create({
        data: {
          key: 'cat_sk_d2d906dd5b9c28e4d7bbe8e58f140603de86de5f096bfdfaf6192064210a29ae',
          clientId: client.id,
          isActive: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        }
      });
      console.log('API key created:', apiKey.id);
    } else {
      console.log('API key already exists:', apiKey.id);
    }
    
    console.log('✅ Setup complete');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createApiKey();
