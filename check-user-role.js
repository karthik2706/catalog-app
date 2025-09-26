require('dotenv').config({ path: '.env.local' });
// Using built-in fetch (Node.js 18+)

async function checkUserRole() {
  console.log('🔍 Checking current user role...\n');

  const catalogAppUrl = 'https://www.stockmind.in';
  
  try {
    // Login to get user info
    const loginResponse = await fetch(`${catalogAppUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'karthik@scan2ship.in', 
        password: 'admin123' 
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('User role:', loginData.user?.role);
    console.log('User email:', loginData.user?.email);
    console.log('Expected role: MASTER_ADMIN');
    
    if (loginData.user?.role === 'MASTER_ADMIN') {
      console.log('✅ User has MASTER_ADMIN role - delete button should be visible');
    } else {
      console.log('❌ User does NOT have MASTER_ADMIN role - delete button may be hidden');
    }

    // Test the clients API to see if it works
    const token = loginData.token;
    const clientsResponse = await fetch(`${catalogAppUrl}/api/admin/clients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (clientsResponse.ok) {
      console.log('✅ Clients API accessible');
    } else {
      console.log('❌ Clients API failed:', clientsResponse.status);
    }

  } catch (error) {
    console.error('❌ Error checking user role:', error);
  }
}

checkUserRole();
