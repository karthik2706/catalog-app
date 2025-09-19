#!/usr/bin/env node

/**
 * S3 CORS Configuration Fix
 * 
 * This script helps configure the S3 bucket with proper CORS settings
 * to allow direct uploads from web browsers.
 */

const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'quick-stock-media';

async function configureS3CORS() {
  console.log('🔧 Configuring S3 CORS settings...');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Region: ${process.env.AWS_REGION || 'us-east-2'}`);

  const corsConfiguration = {
    CORSRules: [
      {
        AllowedHeaders: [
          '*'
        ],
        AllowedMethods: [
          'GET',
          'PUT',
          'POST',
          'DELETE',
          'HEAD'
        ],
        AllowedOrigins: [
          'http://localhost:3000',
          'https://localhost:3000',
          'https://www.stockmind.in',
          'https://stockmind.in',
          'https://*.vercel.app',
          'https://*.netlify.app'
        ],
        ExposeHeaders: [
          'ETag',
          'x-amz-request-id',
          'x-amz-id-2'
        ],
        MaxAgeSeconds: 3600
      }
    ]
  };

  try {
    const command = new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfiguration
    });

    await s3Client.send(command);
    console.log('✅ CORS configuration applied successfully!');
    console.log('\n📋 CORS Rules Applied:');
    console.log('- Allowed Origins: localhost:3000, stockmind.in, *.vercel.app, *.netlify.app');
    console.log('- Allowed Methods: GET, PUT, POST, DELETE, HEAD');
    console.log('- Allowed Headers: * (all headers)');
    console.log('- Max Age: 3600 seconds (1 hour)');
    
  } catch (error) {
    console.error('❌ Error configuring CORS:', error.message);
    
    if (error.name === 'NoSuchBucket') {
      console.log('\n💡 The bucket does not exist. Please create it first.');
    } else if (error.name === 'AccessDenied') {
      console.log('\n💡 Access denied. Please check your AWS credentials and permissions.');
      console.log('Required permissions: s3:PutBucketCors');
    }
  }
}

async function main() {
  console.log('🚀 S3 CORS Configuration Tool\n');
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('❌ AWS credentials not found in .env.local');
    console.log('Please ensure you have:');
    console.log('- AWS_ACCESS_KEY_ID');
    console.log('- AWS_SECRET_ACCESS_KEY');
    console.log('- AWS_REGION');
    console.log('- S3_BUCKET_NAME');
    return;
  }

  await configureS3CORS();
  
  console.log('\n🔍 After running this script:');
  console.log('1. Try uploading a file again');
  console.log('2. Check browser developer tools for CORS errors');
  console.log('3. If still having issues, check S3 bucket permissions');
}

main().catch(console.error);
