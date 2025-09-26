require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function updateUserRole() {
  console.log('🔄 Updating user role from SUPER_ADMIN to MASTER_ADMIN...\n');

  const prisma = new PrismaClient();

  try {
    // Find users with SUPER_ADMIN role
    const users = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true, email: true, role: true }
    });

    console.log(`Found ${users.length} users with SUPER_ADMIN role:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    if (users.length > 0) {
      // Update all users with SUPER_ADMIN role to MASTER_ADMIN
      const updateResult = await prisma.user.updateMany({
        where: { role: 'SUPER_ADMIN' },
        data: { role: 'MASTER_ADMIN' }
      });

      console.log(`✅ Updated ${updateResult.count} users to MASTER_ADMIN role`);

      // Verify the change
      const updatedUsers = await prisma.user.findMany({
        where: { role: 'MASTER_ADMIN' },
        select: { id: true, email: true, role: true }
      });

      console.log(`✅ Found ${updatedUsers.length} users with MASTER_ADMIN role:`);
      updatedUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
    } else {
      console.log('ℹ️ No users found with SUPER_ADMIN role');
    }

  } catch (error) {
    console.error('❌ Error updating user roles:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ User role update completed');
  }
}

updateUserRole();
