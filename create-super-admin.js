const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgres://ac0cc81d2b386e6ca5a481a53b906e2ab5d94a135398289a1f102e01b0e4ec2a:sk_jb-LaO668rGFCMk646Tkb@db.prisma.io:5432/postgres?sslmode=require'
    }
  }
});

async function createSuperAdmin() {
  try {
    console.log('🔗 Connecting to production database...');
    await prisma.$connect();
    console.log('✅ Connected successfully!');

    // Check if super admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'karthik@scan2ship.in',
        role: 'SUPER_ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Super admin already exists with email: karthik@scan2ship.in');
      console.log('🔄 Updating password...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('Darling@2706', 12);
      
      // Update the existing super admin
      const updatedAdmin = await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: hashedPassword,
          name: 'Karthik Dintakurthi',
          isActive: true
        }
      });
      
      console.log('✅ Super admin password updated successfully!');
      console.log('👤 User ID:', updatedAdmin.id);
      console.log('📧 Email:', updatedAdmin.email);
      console.log('🔑 Role:', updatedAdmin.role);
    } else {
      console.log('👤 Creating new super admin user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('Darling@2706', 12);
      
      // Create the super admin user
      const superAdmin = await prisma.user.create({
        data: {
          email: 'karthik@scan2ship.in',
          password: hashedPassword,
          name: 'Karthik Dintakurthi',
          role: 'SUPER_ADMIN',
          isActive: true,
          clientId: null // Super admin is not tied to any specific client
        }
      });
      
      console.log('✅ Super admin created successfully!');
      console.log('👤 User ID:', superAdmin.id);
      console.log('📧 Email:', superAdmin.email);
      console.log('🔑 Role:', superAdmin.role);
      console.log('📅 Created at:', superAdmin.createdAt);
    }

    // Verify the user was created/updated
    const verifyUser = await prisma.user.findFirst({
      where: {
        email: 'karthik@scan2ship.in',
        role: 'SUPER_ADMIN'
      }
    });

    if (verifyUser) {
      console.log('\n🎉 Super admin setup completed successfully!');
      console.log('🔐 You can now login with:');
      console.log('   Email: karthik@scan2ship.in');
      console.log('   Password: Darling@2706');
    }

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed.');
  }
}

createSuperAdmin();
