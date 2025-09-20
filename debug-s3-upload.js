#!/usr/bin/env node

/**
 * Debug S3 Upload Issues
 * 
 * This script helps debug S3 upload issues by testing pre-signed URL generation
 * and checking S3 permissions.
 */

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'quick-stock-media';

async function testS3Permissions() {
  console.log('🔍 Testing S3 Permissions...');
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Region: ${process.env.AWS_REGION || 'us-east-2'}`);

  try {
    // Test 1: Check if we can list objects
    console.log('\n1. Testing bucket access...');
    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 1
    });
    
    const listResult = await s3Client.send(listCommand);
    console.log('✅ Bucket access successful');

    // Test 2: Generate a test pre-signed URL
    console.log('\n2. Testing pre-signed URL generation...');
    const testKey = `test-uploads/debug-test-${Date.now()}.txt`;
    
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey,
      ContentType: 'text/plain',
      Metadata: {
        'test-upload': 'true',
        'timestamp': new Date().toISOString()
      }
    });

    const signedUrl = await getSignedUrl(s3Client, putCommand, { 
      expiresIn: 3600 // 1 hour
    });
    
    console.log('✅ Pre-signed URL generated successfully');
    console.log(`URL: ${signedUrl.substring(0, 100)}...`);

    // Test 3: Test the pre-signed URL with a small file
    console.log('\n3. Testing pre-signed URL with actual upload...');
    const testContent = 'This is a test upload for debugging S3 permissions.';
    
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: testContent,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    if (uploadResponse.ok) {
      console.log('✅ Upload test successful!');
      
      // Clean up test file
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: testKey
      });
      await s3Client.send(deleteCommand);
      console.log('✅ Test file cleaned up');
    } else {
      console.log('❌ Upload test failed:', uploadResponse.status, uploadResponse.statusText);
      const errorText = await uploadResponse.text();
      console.log('Error details:', errorText);
    }

  } catch (error) {
    console.error('❌ S3 test failed:', error.message);
    
    if (error.name === 'NoSuchBucket') {
      console.log('💡 The bucket does not exist. Please create it first.');
    } else if (error.name === 'AccessDenied') {
      console.log('💡 Access denied. Please check your AWS credentials and permissions.');
      console.log('Required permissions: s3:PutObject, s3:GetObject, s3:DeleteObject');
    } else if (error.name === 'InvalidAccessKeyId') {
      console.log('💡 Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
    }
  }
}

async function testPresignedUrlWithVideo() {
  console.log('\n🎥 Testing pre-signed URL generation for video upload...');
  
  try {
    const testKey = `clients/cmfohvqxb0001jp04hqvisj49/products/temp-sku/media/video/test-${Date.now()}.mp4`;
    
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: testKey,
      ContentType: 'video/mp4',
      Metadata: {
        'original-name': 'test-video.mp4',
        'client-id': 'cmfohvqxb0001jp04hqvisj49',
        'product-sku': 'temp-sku',
        'file-type': 'video',
      },
    });

    const signedUrl = await getSignedUrl(s3Client, putCommand, { 
      expiresIn: 3600 // 1 hour
    });
    
    console.log('✅ Video pre-signed URL generated successfully');
    console.log(`Key: ${testKey}`);
    console.log(`URL: ${signedUrl.substring(0, 100)}...`);
    
    // Test with a small video-like content
    const testVideoContent = Buffer.from('fake video content for testing');
    
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: testVideoContent,
      headers: {
        'Content-Type': 'video/mp4',
      },
    });

    if (uploadResponse.ok) {
      console.log('✅ Video upload test successful!');
      
      // Clean up test file
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: testKey
      });
      await s3Client.send(deleteCommand);
      console.log('✅ Test video file cleaned up');
    } else {
      console.log('❌ Video upload test failed:', uploadResponse.status, uploadResponse.statusText);
      const errorText = await uploadResponse.text();
      console.log('Error details:', errorText);
    }

  } catch (error) {
    console.error('❌ Video upload test failed:', error.message);
  }
}

async function checkCORSConfiguration() {
  console.log('\n🌐 Checking CORS configuration...');
  
  try {
    const { GetBucketCorsCommand } = require('@aws-sdk/client-s3');
    const corsCommand = new GetBucketCorsCommand({
      Bucket: BUCKET_NAME
    });
    
    const corsResult = await s3Client.send(corsCommand);
    console.log('✅ CORS configuration found:');
    console.log(JSON.stringify(corsResult.CORSRules, null, 2));
    
  } catch (error) {
    if (error.name === 'NoSuchCORSConfiguration') {
      console.log('❌ No CORS configuration found on bucket');
      console.log('💡 This might be the cause of your upload issues');
    } else {
      console.error('❌ Error checking CORS:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 S3 Upload Debug Tool\n');
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('❌ AWS credentials not found in .env.local');
    console.log('Please ensure you have:');
    console.log('- AWS_ACCESS_KEY_ID');
    console.log('- AWS_SECRET_ACCESS_KEY');
    console.log('- AWS_REGION');
    console.log('- S3_BUCKET_NAME');
    return;
  }

  await testS3Permissions();
  await testPresignedUrlWithVideo();
  await checkCORSConfiguration();
  
  console.log('\n📋 Debug Summary:');
  console.log('1. Check if S3 permissions are working');
  console.log('2. Verify pre-signed URL generation');
  console.log('3. Test actual upload functionality');
  console.log('4. Check CORS configuration');
}

main().catch(console.error);
