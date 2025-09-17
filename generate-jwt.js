const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate a secure JWT secret for production
function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

// Generate JWT token for super admin
function generateJWTToken(user, secret) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: Math.floor(Date.now() / 1000), // Issued at
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // Expires in 7 days
  };

  return jwt.sign(payload, secret);
}

// Generate production JWT secret
const jwtSecret = generateJWTSecret();

console.log('🔐 JWT Configuration for Production');
console.log('=====================================');
console.log('');
console.log('JWT_SECRET (add this to Vercel environment variables):');
console.log(jwtSecret);
console.log('');
console.log('NEXTAUTH_SECRET (add this to Vercel environment variables):');
console.log(crypto.randomBytes(32).toString('hex'));
console.log('');

// Super admin user data
const superAdmin = {
  id: 'cmfof3pzt0001y7q2xfzlqvfk',
  email: 'karthik@scan2ship.in',
  role: 'SUPER_ADMIN',
  name: 'Karthik Dintakurthi'
};

// Generate JWT token for super admin
const token = generateJWTToken(superAdmin, jwtSecret);

console.log('🎫 JWT Token for Super Admin:');
console.log('==============================');
console.log(token);
console.log('');
console.log('📋 Token Details:');
console.log('- User ID:', superAdmin.id);
console.log('- Email:', superAdmin.email);
console.log('- Role:', superAdmin.role);
console.log('- Expires:', new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString());
console.log('');

// Verify the token
try {
  const decoded = jwt.verify(token, jwtSecret);
  console.log('✅ Token verification successful!');
  console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
}

console.log('');
console.log('🚀 Next Steps:');
console.log('1. Add JWT_SECRET to Vercel environment variables');
console.log('2. Add NEXTAUTH_SECRET to Vercel environment variables');
console.log('3. Redeploy your application');
console.log('4. Use the JWT token for API authentication');
