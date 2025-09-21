import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { 
      email_clientId: {
        email: 'admin@company.com',
        clientId: null
      }
    },
    update: {},
    create: {
      email: 'admin@company.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  const managerUser = await prisma.user.upsert({
    where: { 
      email_clientId: {
        email: 'manager@company.com',
        clientId: null
      }
    },
    update: {},
    create: {
      email: 'manager@company.com',
      password: hashedPassword,
      name: 'Manager User',
      role: 'MANAGER',
    },
  })

  const staffUser = await prisma.user.upsert({
    where: { 
      email_clientId: {
        email: 'staff@company.com',
        clientId: null
      }
    },
    update: {},
    create: {
      email: 'staff@company.com',
      password: hashedPassword,
      name: 'Staff User',
      role: 'USER',
    },
  })

  console.log('✅ Users created:', { adminUser, managerUser, staffUser })

  // Create products
  const products = [
    {
      name: 'Wireless Bluetooth Headphones',
      sku: 'WBH-001',
      description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life',
      price: 199.99,
      category: 'Electronics',
      variations: [
        { id: 'color-black', name: 'Color', value: 'Black', priceAdjustment: 0 },
        { id: 'color-white', name: 'Color', value: 'White', priceAdjustment: 10 },
        { id: 'color-silver', name: 'Color', value: 'Silver', priceAdjustment: 15 },
      ],
      stockLevel: 25,
      minStock: 5,
      isActive: true,
    },
    {
      name: 'Smartphone Case',
      sku: 'SPC-002',
      description: 'Protective case for latest smartphones with shock absorption',
      price: 29.99,
      category: 'Accessories',
      variations: [
        { id: 'size-s', name: 'Size', value: 'Small', priceAdjustment: 0 },
        { id: 'size-m', name: 'Size', value: 'Medium', priceAdjustment: 5 },
        { id: 'size-l', name: 'Size', value: 'Large', priceAdjustment: 10 },
        { id: 'color-clear', name: 'Color', value: 'Clear', priceAdjustment: 0 },
        { id: 'color-black', name: 'Color', value: 'Black', priceAdjustment: 2 },
      ],
      stockLevel: 3,
      minStock: 10,
      isActive: true,
    },
    {
      name: 'Laptop Stand',
      sku: 'LS-003',
      description: 'Adjustable aluminum laptop stand for ergonomic computing',
      price: 79.99,
      category: 'Office',
      variations: [],
      stockLevel: 15,
      minStock: 8,
      isActive: true,
    },
    {
      name: 'USB-C Cable',
      sku: 'UCC-004',
      description: 'High-speed USB-C charging and data cable with 100W power delivery',
      price: 19.99,
      category: 'Cables',
      variations: [
        { id: 'length-1m', name: 'Length', value: '1m', priceAdjustment: 0 },
        { id: 'length-2m', name: 'Length', value: '2m', priceAdjustment: 5 },
        { id: 'length-3m', name: 'Length', value: '3m', priceAdjustment: 10 },
      ],
      stockLevel: 50,
      minStock: 20,
      isActive: true,
    },
    {
      name: 'Wireless Mouse',
      sku: 'WM-005',
      description: 'Ergonomic wireless mouse with precision tracking and long battery life',
      price: 49.99,
      category: 'Electronics',
      variations: [
        { id: 'color-black', name: 'Color', value: 'Black', priceAdjustment: 0 },
        { id: 'color-silver', name: 'Color', value: 'Silver', priceAdjustment: 5 },
        { id: 'color-pink', name: 'Color', value: 'Pink', priceAdjustment: 8 },
      ],
      stockLevel: 2,
      minStock: 5,
      isActive: true,
    },
    {
      name: 'Mechanical Keyboard',
      sku: 'MK-006',
      description: 'RGB backlit mechanical keyboard with Cherry MX switches',
      price: 129.99,
      category: 'Electronics',
      variations: [
        { id: 'switch-blue', name: 'Switch', value: 'Blue (Tactile)', priceAdjustment: 0 },
        { id: 'switch-red', name: 'Switch', value: 'Red (Linear)', priceAdjustment: 0 },
        { id: 'switch-brown', name: 'Switch', value: 'Brown (Tactile)', priceAdjustment: 5 },
      ],
      stockLevel: 8,
      minStock: 3,
      isActive: true,
    },
    {
      name: 'Monitor Stand',
      sku: 'MS-007',
      description: 'Height-adjustable monitor stand with cable management',
      price: 89.99,
      category: 'Office',
      variations: [
        { id: 'color-black', name: 'Color', value: 'Black', priceAdjustment: 0 },
        { id: 'color-white', name: 'Color', value: 'White', priceAdjustment: 10 },
      ],
      stockLevel: 12,
      minStock: 4,
      isActive: true,
    },
    {
      name: 'HDMI Cable',
      sku: 'HC-008',
      description: 'High-speed HDMI cable supporting 4K resolution',
      price: 24.99,
      category: 'Cables',
      variations: [
        { id: 'length-1m', name: 'Length', value: '1m', priceAdjustment: 0 },
        { id: 'length-2m', name: 'Length', value: '2m', priceAdjustment: 5 },
        { id: 'length-5m', name: 'Length', value: '5m', priceAdjustment: 15 },
      ],
      stockLevel: 30,
      minStock: 10,
      isActive: true,
    },
    {
      name: 'Desk Lamp',
      sku: 'DL-009',
      description: 'LED desk lamp with adjustable brightness and color temperature',
      price: 69.99,
      category: 'Office',
      variations: [
        { id: 'color-black', name: 'Color', value: 'Black', priceAdjustment: 0 },
        { id: 'color-white', name: 'Color', value: 'White', priceAdjustment: 5 },
        { id: 'color-wood', name: 'Color', value: 'Wood', priceAdjustment: 15 },
      ],
      stockLevel: 6,
      minStock: 3,
      isActive: true,
    },
    {
      name: 'Webcam',
      sku: 'WC-010',
      description: '4K webcam with built-in microphone and privacy shutter',
      price: 149.99,
      category: 'Electronics',
      variations: [],
      stockLevel: 4,
      minStock: 2,
      isActive: true,
    },
  ]

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData,
    })
    console.log(`✅ Product created: ${product.name}`)
  }

  // Create some inventory history records
  const allProducts = await prisma.product.findMany()
  const allUsers = await prisma.user.findMany()

  const inventoryHistoryData = [
    {
      productId: allProducts[0].id,
      quantity: 25,
      type: 'PURCHASE',
      reason: 'Initial stock',
      userId: adminUser.id,
    },
    {
      productId: allProducts[1].id,
      quantity: 15,
      type: 'PURCHASE',
      reason: 'Initial stock',
      userId: adminUser.id,
    },
    {
      productId: allProducts[1].id,
      quantity: -12,
      type: 'SALE',
      reason: 'Customer sales',
      userId: staffUser.id,
    },
    {
      productId: allProducts[2].id,
      quantity: 15,
      type: 'PURCHASE',
      reason: 'Initial stock',
      userId: adminUser.id,
    },
    {
      productId: allProducts[3].id,
      quantity: 50,
      type: 'PURCHASE',
      reason: 'Bulk order',
      userId: managerUser.id,
    },
    {
      productId: allProducts[4].id,
      quantity: 20,
      type: 'PURCHASE',
      reason: 'Initial stock',
      userId: adminUser.id,
    },
    {
      productId: allProducts[4].id,
      quantity: -18,
      type: 'SALE',
      reason: 'Customer sales',
      userId: staffUser.id,
    },
    {
      productId: allProducts[5].id,
      quantity: 10,
      type: 'PURCHASE',
      reason: 'Initial stock',
      userId: adminUser.id,
    },
    {
      productId: allProducts[5].id,
      quantity: -2,
      type: 'SALE',
      reason: 'Customer sales',
      userId: staffUser.id,
    },
    {
      productId: allProducts[6].id,
      quantity: 12,
      type: 'PURCHASE',
      reason: 'Initial stock',
      userId: adminUser.id,
    },
    {
      productId: allProducts[7].id,
      quantity: 30,
      type: 'PURCHASE',
      reason: 'Bulk order',
      userId: managerUser.id,
    },
    {
      productId: allProducts[8].id,
      quantity: 8,
      type: 'PURCHASE',
      reason: 'Initial stock',
      userId: adminUser.id,
    },
    {
      productId: allProducts[8].id,
      quantity: -2,
      type: 'SALE',
      reason: 'Customer sales',
      userId: staffUser.id,
    },
    {
      productId: allProducts[9].id,
      quantity: 5,
      type: 'PURCHASE',
      reason: 'Initial stock',
      userId: adminUser.id,
    },
    {
      productId: allProducts[9].id,
      quantity: -1,
      type: 'SALE',
      reason: 'Customer sales',
      userId: staffUser.id,
    },
  ]

  for (const historyData of inventoryHistoryData) {
    await prisma.inventoryHistory.create({
      data: historyData,
    })
  }

  console.log('✅ Inventory history created')

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Users: ${allUsers.length}`)
  console.log(`- Products: ${allProducts.length}`)
  console.log(`- Inventory History Records: ${inventoryHistoryData.length}`)
  console.log('\n🔑 Login Credentials:')
  console.log('Admin: admin@company.com / password123')
  console.log('Manager: manager@company.com / password123')
  console.log('Staff: staff@company.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })