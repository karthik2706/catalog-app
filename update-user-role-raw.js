require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function updateUserRoleRaw() {
  console.log('🔄 Updating user role from SUPER_ADMIN to MASTER_ADMIN using raw SQL...\n');

  const prisma = new PrismaClient();

  try {
    // Update user roles using raw SQL
    const result = await prisma.$executeRaw`UPDATE "users" SET role = 'MASTER_ADMIN' WHERE role = 'SUPER_ADMIN';`;
    console.log(`✅ Updated ${result} users to MASTER_ADMIN role`);

    // Verify the change using raw SQL
    const users = await prisma.$queryRaw`SELECT id, email, role FROM "users" WHERE role = 'MASTER_ADMIN';`;
    console.log(`✅ Found ${users.length} users with MASTER_ADMIN role:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Error updating user roles:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ User role update completed');
  }
}

updateUserRoleRaw();
