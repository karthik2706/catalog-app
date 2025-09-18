#!/usr/bin/env tsx

/**
 * Test login functionality
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin() {
  console.log('🔐 Testing login functionality...');
  
  try {
    // Get a user from the database
    const user = await prisma.user.findFirst({
      where: { email: 'admin@testcompany.com' },
      include: { client: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: user.clientId,
      client: user.client?.name
    });
    
    // Test password comparison
    const password = 'password123';
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('🔑 Password comparison:', isPasswordValid);
    
    if (isPasswordValid) {
      console.log('✅ Password is correct');
    } else {
      console.log('❌ Password is incorrect');
    }
    
  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
