// Mock authentication for demo purposes when database is not available
export const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'admin123', // In real app, this would be hashed
    name: 'Admin User',
    role: 'ADMIN',
    createdAt: new Date(),
  },
  {
    id: '2',
    email: 'demo@example.com',
    password: 'demo123',
    name: 'Demo User',
    role: 'USER',
    createdAt: new Date(),
  }
]

export function findUserByEmail(email: string) {
  return mockUsers.find(user => user.email === email)
}

export function verifyPassword(plainPassword: string, hashedPassword: string) {
  // For demo purposes, we'll do simple string comparison
  // In production, you'd use bcrypt.compare()
  return plainPassword === hashedPassword
}
