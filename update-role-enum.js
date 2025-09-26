require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function updateRoleEnum() {
  console.log('🔄 Updating Role enum from SUPER_ADMIN to MASTER_ADMIN...\n');

  const prisma = new PrismaClient();

  try {
    // Update the enum value directly in the database
    await prisma.$executeRaw`ALTER TYPE "public"."Role" RENAME VALUE 'SUPER_ADMIN' TO 'MASTER_ADMIN';`;
    console.log('✅ Successfully updated Role enum');

    // Verify the change by checking a user with the old role
    const users = await prisma.user.findMany({
      where: { role: 'MASTER_ADMIN' },
      select: { id: true, email: true, role: true }
    });

    console.log(`✅ Found ${users.length} users with MASTER_ADMIN role:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Error updating Role enum:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database update completed');
  }
}

updateRoleEnum();
