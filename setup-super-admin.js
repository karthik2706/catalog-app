const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setupSuperAdmin() {
  console.log('🔧 Setting up Super Admin User in Catalog App...\n');

  const prisma = new PrismaClient();

  try {
    // Check if super admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: 'karthik@scan2ship.in',
        role: 'SUPER_ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('✅ Super admin user already exists');
      return;
    }

    // Create or find super admin client
    let superAdminClient = await prisma.client.findFirst({
      where: {
        slug: 'super-admin-client'
      }
    });

    if (!superAdminClient) {
      superAdminClient = await prisma.client.create({
        data: {
          id: 'super-admin-client-' + Date.now(),
          name: 'Super Admin Client',
          slug: 'super-admin-client',
          email: 'superadmin@catalog.in',
          phone: '+1234567890',
          address: 'Admin Address',
          isActive: true,
          plan: 'ENTERPRISE'
        }
      });
      console.log('✅ Super admin client created');
    }

    // Create super admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        id: 'super-admin-' + Date.now(),
        email: 'karthik@scan2ship.in',
        password: hashedPassword,
        name: 'Karthik Super Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        clientId: superAdminClient.id
      }
    });

    console.log('✅ Super admin user created successfully');
    console.log('📧 Email: karthik@scan2ship.in');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: SUPER_ADMIN');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupSuperAdmin();
