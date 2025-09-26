require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function testDirectDeletion() {
  console.log('🧪 Testing direct client deletion...\n');

  const prisma = new PrismaClient();
  const clientId = 'cmg1a4yaa0000y7ndiwcbp1iq'; // Yoshita Fashion Jewellery

  try {
    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, slug: true }
    });

    if (!client) {
      console.log('❌ Client not found');
      return;
    }

    console.log('✅ Client found:', client);

    // Try to delete the client directly
    console.log('🗑️ Attempting to delete client...');
    const deletedClient = await prisma.client.delete({
      where: { id: clientId }
    });

    console.log('✅ Client deleted successfully:', deletedClient);

  } catch (error) {
    console.error('❌ Error deleting client:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Test completed');
  }
}

testDirectDeletion();
