import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding SaaS platform...')

  // Create super admin user
  const superAdminPassword = await bcrypt.hash('admin123', 10)
  let superAdmin = await prisma.user.findFirst({
    where: { 
      email: 'admin@platform.com',
      clientId: null,
    }
  })

  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        email: 'admin@platform.com',
        password: superAdminPassword,
        name: 'Platform Administrator',
        role: 'SUPER_ADMIN',
        clientId: null,
        isActive: true,
      },
    })
  }

  console.log('✅ Super admin created:', superAdmin.email)

  // Create sample clients
  const clients = [
    {
      name: 'TechCorp Solutions',
      slug: 'techcorp',
      email: 'admin@techcorp.com',
      phone: '+1 (555) 123-4567',
      address: '123 Tech Street, Silicon Valley, CA 94000',
      plan: 'PROFESSIONAL' as const,
    },
    {
      name: 'RetailMax Store',
      slug: 'retailmax',
      email: 'admin@retailmax.com',
      phone: '+1 (555) 987-6543',
      address: '456 Commerce Ave, New York, NY 10001',
      plan: 'STARTER' as const,
    },
    {
      name: 'Enterprise Corp',
      slug: 'enterprise',
      email: 'admin@enterprise.com',
      phone: '+1 (555) 456-7890',
      address: '789 Business Blvd, Chicago, IL 60601',
      plan: 'ENTERPRISE' as const,
    },
  ]

  for (const clientData of clients) {
    const client = await prisma.client.upsert({
      where: { slug: clientData.slug },
      update: {},
      create: clientData,
    })

    // Create client settings
    await prisma.clientSettings.upsert({
      where: { clientId: client.id },
      update: {},
      create: {
        clientId: client.id,
        companyName: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        timezone: 'America/New_York',
        lowStockThreshold: 10,
        autoReorder: false,
        emailNotifications: true,
        smsNotifications: false,
      },
    })

    // Create admin user for each client
    const clientAdminPassword = await bcrypt.hash('password123', 10)
    await prisma.user.upsert({
      where: { 
        email_clientId: {
          email: clientData.email,
          clientId: client.id,
        }
      },
      update: {},
      create: {
        email: clientData.email,
        password: clientAdminPassword,
        name: `${client.name} Admin`,
        role: 'ADMIN',
        clientId: client.id,
        isActive: true,
      },
    })

    // Create sample categories for each client
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and components' },
      { name: 'Office Supplies', description: 'Office and stationery items' },
      { name: 'Accessories', description: 'Various accessories and add-ons' },
      { name: 'Cables', description: 'Cables and connectors' },
    ]

    for (const categoryData of categories) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          name: categoryData.name,
          clientId: client.id,
          parentId: null,
        }
      })

      if (!existingCategory) {
        await prisma.category.create({
          data: {
            name: categoryData.name,
            description: categoryData.description,
            clientId: client.id,
            isActive: true,
          },
        })
      }
    }

    // Create sample products for each client
    const products = [
      {
        name: 'Wireless Mouse',
        sku: 'WM-001',
        description: 'Ergonomic wireless mouse with USB receiver',
        price: 29.99,
        category: 'Electronics',
        stockLevel: 50,
        minStock: 10,
      },
      {
        name: 'Mechanical Keyboard',
        sku: 'KB-002',
        description: 'RGB mechanical keyboard with blue switches',
        price: 89.99,
        category: 'Electronics',
        stockLevel: 25,
        minStock: 5,
      },
      {
        name: 'USB-C Cable',
        sku: 'UC-003',
        description: 'High-speed USB-C to USB-C cable, 6ft',
        price: 19.99,
        category: 'Cables',
        stockLevel: 100,
        minStock: 20,
      },
      {
        name: 'Notebook Set',
        sku: 'NB-004',
        description: 'Set of 3 spiral notebooks, college ruled',
        price: 12.99,
        category: 'Office Supplies',
        stockLevel: 75,
        minStock: 15,
      },
    ]

    for (const productData of products) {
      await prisma.product.upsert({
        where: {
          sku_clientId: {
            sku: productData.sku,
            clientId: client.id,
          }
        },
        update: {},
        create: {
          ...productData,
          clientId: client.id,
          isActive: true,
        },
      })
    }

    console.log(`✅ Client created: ${client.name} (${client.slug})`)
  }

  console.log('🎉 SaaS platform seeding completed!')
  console.log('\n📋 Login Credentials:')
  console.log('Super Admin: admin@platform.com / admin123')
  console.log('TechCorp: admin@techcorp.com / password123')
  console.log('RetailMax: admin@retailmax.com / password123')
  console.log('Enterprise: admin@enterprise.com / password123')
  console.log('\n🌐 Access URLs:')
  console.log('Super Admin: http://localhost:3000/admin')
  console.log('TechCorp: http://techcorp.localhost:3000')
  console.log('RetailMax: http://retailmax.localhost:3000')
  console.log('Enterprise: http://enterprise.localhost:3000')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
