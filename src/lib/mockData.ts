// Mock data for demo purposes when database is not available
export const mockProducts = [
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

export function getMockProducts(filters: any = {}) {
  let filteredProducts = [...mockProducts]

  // Apply search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm))
    )
  }

  // Apply category filter
  if (filters.category) {
    filteredProducts = filteredProducts.filter(product =>
      product.category === filters.category
    )
  }

  // Apply price filters
  if (filters.minPrice !== undefined) {
    filteredProducts = filteredProducts.filter(product =>
      product.price >= filters.minPrice
    )
  }

  if (filters.maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter(product =>
      product.price <= filters.maxPrice
    )
  }

  // Apply stock filters
  if (filters.inStock) {
    filteredProducts = filteredProducts.filter(product =>
      product.stockLevel > 0
    )
  }

  if (filters.lowStock) {
    filteredProducts = filteredProducts.filter(product =>
      product.stockLevel <= product.minStock
    )
  }

  // Apply sorting
  if (filters.sortBy) {
    filteredProducts.sort((a, b) => {
      let aValue = a[filters.sortBy as keyof typeof a]
      let bValue = b[filters.sortBy as keyof typeof b]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }

  // Apply pagination
  const page = filters.page || 1
  const limit = filters.limit || 10
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit

  return {
    products: filteredProducts.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: filteredProducts.length,
      pages: Math.ceil(filteredProducts.length / limit)
    }
  }
}
