require('dotenv').config({ path: '.env.local' });
// Using built-in fetch (Node.js 18+)

async function testCategoriesDebug() {
  console.log('🔍 Testing categories API debug...\n');

  try {
    // Step 1: Login to get a token
    console.log('📡 Step 1: Logging in...');
    const loginResponse = await fetch('https://www.stockmind.in/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'karthik@scan2ship.in', password: 'admin123' })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      const errorData = await loginResponse.json();
      console.log('Error details:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('User data:', JSON.stringify(loginData.user, null, 2));
    console.log('Token data:', loginData.token ? 'Present' : 'Missing');
    
    const token = loginData.token;
    if (!token) {
      console.log('❌ No token in response');
      return;
    }

    // Step 2: Test categories API
    console.log('\n📡 Step 2: Testing categories API...');
    const categoriesResponse = await fetch('https://www.stockmind.in/api/categories', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Categories Response Status:', categoriesResponse.status);
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json();
      console.log('✅ Categories API successful');
      console.log('Categories count:', categoriesData.length);
    } else {
      const errorData = await categoriesResponse.json();
      console.log('❌ Categories API failed:', errorData);
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testCategoriesDebug();
