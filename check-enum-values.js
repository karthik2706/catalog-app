require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function checkEnumValues() {
  console.log('🔍 Checking current Role enum values...\n');

  const prisma = new PrismaClient();

  try {
    // Check current enum values
    const enumValues = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"Role")) as role_value;
    `;
    
    console.log('Current Role enum values:');
    enumValues.forEach((row, index) => {
      console.log(`${index + 1}. ${row.role_value}`);
    });

    // Check users with different roles
    const users = await prisma.$queryRaw`
      SELECT id, email, role FROM "users" ORDER BY role;
    `;
    
    console.log(`\nFound ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ Error checking enum values:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Enum check completed');
  }
}

checkEnumValues();
