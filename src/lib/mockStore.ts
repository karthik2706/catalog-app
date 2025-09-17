// In-memory store for mock data that persists across requests
import { Product } from '@/types'

// Initialize with sample data
let mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    sku: 'WBH-001',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 199.99,
    category: 'Electronics',
    variations: [
      { id: 'color-black', name: 'Color', value: 'Black', priceAdjustment: 0 },
      { id: 'color-white', name: 'Color', value: 'White', priceAdjustment: 10 },
    ],
    stockLevel: 25,
    minStock: 5,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    inventoryHistory: []
  },
  {
    id: '2',
    name: 'Smartphone Case',
    sku: 'SPC-002',
    description: 'Protective case for latest smartphones',
    price: 29.99,
    category: 'Accessories',
    variations: [
      { id: 'size-s', name: 'Size', value: 'Small', priceAdjustment: 0 },
      { id: 'size-m', name: 'Size', value: 'Medium', priceAdjustment: 5 },
      { id: 'size-l', name: 'Size', value: 'Large', priceAdjustment: 10 },
    ],
    stockLevel: 3,
    minStock: 10,
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    inventoryHistory: []
  },
  {
    id: '3',
    name: 'Laptop Stand',
    sku: 'LS-003',
    description: 'Adjustable aluminum laptop stand for ergonomic computing',
    price: 79.99,
    category: 'Office',
    variations: [],
    stockLevel: 15,
    minStock: 8,
    isActive: true,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    inventoryHistory: []
  },
  {
    id: '4',
    name: 'USB-C Cable',
    sku: 'UCC-004',
    description: 'High-speed USB-C charging and data cable',
    price: 19.99,
    category: 'Cables',
    variations: [
      { id: 'length-1m', name: 'Length', value: '1m', priceAdjustment: 0 },
      { id: 'length-2m', name: 'Length', value: '2m', priceAdjustment: 5 },
    ],
    stockLevel: 50,
    minStock: 20,
    isActive: true,
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
    inventoryHistory: []
  },
  {
    id: '5',
    name: 'Wireless Mouse',
    sku: 'WM-005',
    description: 'Ergonomic wireless mouse with precision tracking',
    price: 49.99,
    category: 'Electronics',
    variations: [
      { id: 'color-black', name: 'Color', value: 'Black', priceAdjustment: 0 },
      { id: 'color-silver', name: 'Color', value: 'Silver', priceAdjustment: 5 },
    ],
    stockLevel: 2,
    minStock: 5,
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    inventoryHistory: []
  },
]

export const mockStore = {
  getProducts: () => [...mockProducts],
  
  getProduct: (id: string) => mockProducts.find(p => p.id === id),
  
  updateProduct: (id: string, updates: Partial<Product>) => {
    const index = mockProducts.findIndex(p => p.id === id)
    if (index !== -1) {
      mockProducts[index] = {
        ...mockProducts[index],
        ...updates,
        updatedAt: new Date()
      }
      return mockProducts[index]
    }
    return null
  },
  
  deleteProduct: (id: string) => {
    const index = mockProducts.findIndex(p => p.id === id)
    if (index !== -1) {
      mockProducts[index].isActive = false
      return true
    }
    return false
  },
  
  addProduct: (product: Product) => {
    mockProducts.push(product)
    return product
  }
}
