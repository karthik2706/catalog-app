require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUserRoleFinal() {
  console.log('🔧 Updating user role from SUPER_ADMIN to MASTER_ADMIN...\n');

  try {
    // Find the user with SUPER_ADMIN role
    const user = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true, email: true, role: true }
    });

    if (user) {
      console.log('Found user with SUPER_ADMIN role:', user);
      
      // Update the role to MASTER_ADMIN
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'MASTER_ADMIN' },
        select: { id: true, email: true, role: true }
      });
      
      console.log('✅ Updated user role to MASTER_ADMIN:', updatedUser);
    } else {
      console.log('❌ No user found with SUPER_ADMIN role');
    }

    // Check all users and their roles
    console.log('\n📊 All users and their roles:');
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, role: true, clientId: true }
    });
    
    allUsers.forEach((u, index) => {
      console.log(`${index + 1}. ${u.email} - Role: ${u.role} - ClientId: ${u.clientId}`);
    });

  } catch (error) {
    console.error('❌ Error updating user role:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ User role update completed');
  }
}

updateUserRoleFinal();
