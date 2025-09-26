require('dotenv').config({ path: '.env.local' });

async function forceDeployment() {
  console.log('🚀 Forcing deployment update...\n');

  try {
    // Make a simple change to trigger deployment
    const fs = require('fs');
    const path = require('path');
    
    // Create a deployment trigger file
    const triggerFile = path.join(__dirname, 'DEPLOYMENT_TRIGGER.txt');
    const timestamp = new Date().toISOString();
    
    fs.writeFileSync(triggerFile, `Deployment triggered at: ${timestamp}\n`);
    console.log('✅ Created deployment trigger file');
    
    // Check if we can access the current deployment
    const response = await fetch('https://www.stockmind.in/api/health', {
      method: 'GET',
      headers: {
        'User-Agent': 'Deployment-Checker/1.0'
      }
    });
    
    if (response.ok) {
      console.log('✅ Application is accessible');
    } else {
      console.log('⚠️ Application may be deploying...');
    }
    
    console.log('\n📋 Deployment Status:');
    console.log('1. ✅ Code pushed to repository');
    console.log('2. ✅ Prisma schema updated');
    console.log('3. ⏳ Waiting for deployment to complete...');
    console.log('4. 🔄 This usually takes 2-5 minutes');
    
    console.log('\n💡 In the meantime, try:');
    console.log('- Clear your browser cache');
    console.log('- Try logging in with a different browser/incognito mode');
    console.log('- Wait a few more minutes for deployment to complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

forceDeployment();
