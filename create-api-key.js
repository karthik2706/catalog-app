#!/usr/bin/env node

/**
 * Create API key for the catalog client
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

async function createApiKey() {
  console.log('🔑 Creating API key for catalog client...\n');

  try {
    const prisma = new PrismaClient();

    // Generate a secure API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    
    // Create API key for the yoshita client
    const apiKeyRecord = await prisma.ApiKey.create({
      data: {
        key: apiKey,
        name: 'Scan2Ship Integration Key',
        clientId: 'cmg1a4yaa0000y7ndiwcbp1iq', // Yoshita client ID
        isActive: true,
        permissions: ['inventory:read', 'inventory:write', 'products:read']
      }
    });

    console.log('✅ Created API key:');
    console.log(`Key: ${apiKey}`);
    console.log(`ID: ${apiKeyRecord.id}`);
    console.log(`Client ID: ${apiKeyRecord.clientId}`);
    console.log(`Active: ${apiKeyRecord.isActive}`);

    // Update the scan2ship mapping with the real API key
    console.log('\n🔧 Updating scan2ship mapping with real API key...');
    
    // We need to update this in scan2ship database
    console.log('Please run this command in scan2ship:');
    console.log(`UPDATE cross_app_mappings SET "catalogApiKey" = '${apiKey}' WHERE "catalogClientId" = 'cmg1a4yaa0000y7ndiwcbp1iq';`);

    await prisma.$disconnect();
    console.log('\n✅ API key creation completed');

  } catch (error) {
    console.error('❌ Error creating API key:', error);
  }
}

// Run the script
createApiKey();