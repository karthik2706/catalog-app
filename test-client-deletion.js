require('dotenv').config({ path: '.env.local' });
// Using built-in fetch (Node.js 18+)

async function testClientDeletion() {
  console.log('🧪 Testing client deletion functionality...\n');

  const catalogAppUrl = 'https://www.stockmind.in';
  
  // Step 1: Login to get authentication token
  console.log('📡 Step 1: Logging in to catalog app...');
  try {
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
      const errorData = await loginResponse.json();
      console.log('Error details:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('Full login response:', JSON.stringify(loginData, null, 2));
    console.log('User role:', loginData.user?.role);
    console.log('Expected role: MASTER_ADMIN');
    console.log('User email:', loginData.user?.email);
    console.log('Session token:', loginData.session?.token ? 'Present' : 'Missing');

    const token = loginData.token;
    if (!token) {
      console.log('❌ No session token received');
      console.log('Available keys in response:', Object.keys(loginData));
      return;
    }
    console.log('✅ Token extracted successfully');

    // Step 2: List all clients to see what's available
    console.log('\n📡 Step 2: Listing all clients...');
    try {
      const clientsResponse = await fetch(`${catalogAppUrl}/api/admin/clients`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        console.log('✅ Clients retrieved successfully');
        console.log('Clients response:', JSON.stringify(clientsData, null, 2));
        const clients = clientsData.clients || clientsData;
        console.log(`Found ${Array.isArray(clients) ? clients.length : 'unknown'} clients:`);
        if (Array.isArray(clients)) {
          clients.forEach((client, index) => {
            console.log(`${index + 1}. ${client.name} (${client.slug})`);
            console.log(`   ID: ${client.id}`);
            console.log(`   Email: ${client.email}`);
            console.log(`   Plan: ${client.plan}`);
            console.log(`   Active: ${client.isActive}`);
            console.log('');
          });
        } else {
          console.log('❌ Clients data is not an array:', typeof clientsData);
        }

        // Step 3: Test deleting a client (if there are any)
        if (Array.isArray(clients) && clients.length > 0) {
          const testClient = clients.find(c => c.slug === 'mantra-fashion-jewellery') || clients[0];
          console.log(`\n📡 Step 3: Testing deletion of client: ${testClient.name}`);
          console.log(`Client ID: ${testClient.id}`);
          
          const deleteResponse = await fetch(`${catalogAppUrl}/api/admin/clients/${testClient.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('Delete response status:', deleteResponse.status);
          const deleteData = await deleteResponse.json();
          console.log('Delete response:', deleteData);

          if (deleteResponse.ok) {
            console.log('✅ Client deleted successfully');
          } else {
            console.log('❌ Client deletion failed');
            console.log('Error:', deleteData.error);
          }
        } else {
          console.log('ℹ️ No clients available for deletion test');
        }
      } else {
        console.log('❌ Failed to retrieve clients:', clientsResponse.status);
        const errorData = await clientsResponse.json();
        console.log('Error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Error during client listing:', error);
    }

  } catch (error) {
    console.error('❌ Error during login:', error);
  }
}

testClientDeletion();
