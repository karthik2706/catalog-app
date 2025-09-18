#!/usr/bin/env tsx

/**
 * Create test users for Stock Mind
 * This script creates test users with different roles for testing the application
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🌱 Creating test users...');
  
  try {
    // Create a test client first
    const testClient = await prisma.client.upsert({
      where: { slug: 'test-company' },
      update: {},
      create: {
        id: 'test-client-1',
        name: 'Test Company',
        slug: 'test-company',
        email: 'admin@testcompany.com',
        isActive: true,
      },
    });
    
    console.log('✅ Test client created:', testClient.name);

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Super Admin (no clientId) - use findFirst and create if not exists
    let superAdmin = await prisma.user.findFirst({
      where: { 
        email: 'superadmin@stockmind.com',
        clientId: null,
      }
    });
    
    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          email: 'superadmin@stockmind.com',
          password: hashedPassword,
          name: 'Super Admin',
          role: 'SUPER_ADMIN',
          clientId: null,
        },
      });
    }

    // Admin user for test client
    const adminUser = await prisma.user.upsert({
      where: { 
        email_clientId: {
          email: 'admin@testcompany.com',
          clientId: testClient.id,
        }
      },
      update: {},
      create: {
        email: 'admin@testcompany.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        clientId: testClient.id,
      },
    });

    // Manager user
    const managerUser = await prisma.user.upsert({
      where: { 
        email_clientId: {
          email: 'manager@testcompany.com',
          clientId: testClient.id,
        }
      },
      update: {},
      create: {
        email: 'manager@testcompany.com',
        password: hashedPassword,
        name: 'Manager User',
        role: 'MANAGER',
        clientId: testClient.id,
      },
    });

    // Regular user
    const regularUser = await prisma.user.upsert({
      where: { 
        email_clientId: {
          email: 'user@testcompany.com',
          clientId: testClient.id,
        }
      },
      update: {},
      create: {
        email: 'user@testcompany.com',
        password: hashedPassword,
        name: 'Regular User',
        role: 'USER',
        clientId: testClient.id,
      },
    });

    console.log('✅ Test users created successfully!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('====================');
    console.log('Super Admin:');
    console.log('  Email: superadmin@stockmind.com');
    console.log('  Password: password123');
    console.log('  Role: SUPER_ADMIN (can access all clients)');
    console.log('');
    console.log('Test Company Users:');
    console.log('  Email: admin@testcompany.com');
    console.log('  Password: password123');
    console.log('  Role: ADMIN (client admin)');
    console.log('');
    console.log('  Email: manager@testcompany.com');
    console.log('  Password: password123');
    console.log('  Role: MANAGER');
    console.log('');
    console.log('  Email: user@testcompany.com');
    console.log('  Password: password123');
    console.log('  Role: USER');
    console.log('');
    console.log('🌐 Access the app at: http://localhost:3001');
    console.log('🏢 Test client slug: test-company');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createTestUsers().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { createTestUsers };
