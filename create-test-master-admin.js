require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestMasterAdmin() {
  console.log('👤 Creating test master admin user...\n');

  try {
    const email = 'test-master@catalog.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️ User already exists, updating role...');
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          role: 'MASTER_ADMIN',
          password: hashedPassword
        },
        select: { id: true, email: true, role: true, clientId: true }
      });
      console.log('✅ Updated user:', updatedUser);
    } else {
      console.log('🔧 Creating new master admin user...');
      const newUser = await prisma.user.create({
        data: {
          email,
          name: 'Test Master Admin',
          password: hashedPassword,
          role: 'MASTER_ADMIN',
          clientId: null, // Master admin doesn't belong to a specific client
          isActive: true
        },
        select: { id: true, email: true, role: true, clientId: true }
      });
      console.log('✅ Created user:', newUser);
    }

    console.log('\n📊 Test credentials:');
    console.log('Email: test-master@catalog.com');
    console.log('Password: admin123');
    console.log('Role: MASTER_ADMIN');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Test user creation completed');
  }
}

createTestMasterAdmin();
