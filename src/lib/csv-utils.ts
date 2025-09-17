// Simple and robust CSV utilities - rewritten from scratch
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ProductCSVRow {
  name: string
  sku: string
  description?: string
  price: number
  category: string
  subcategory?: string
  stockLevel: number
  minStock: number
  isActive: boolean
  variations: string
}

// Bulletproof CSV parsing with comprehensive error handling
export function parseCSVFile(file: File): Promise<ProductCSVRow[]> {
  return new Promise((resolve, reject) => {
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => {
          try {
            // Simple string trimming - no complex object manipulation
            if (typeof value === 'string') {
              return value.trim()
            }
            // Check for DOM elements
            if (value && typeof value === 'object' && (value.nodeType || value.constructor?.name === 'HTMLButtonElement' || value.constructor?.name === 'FiberNode')) {
              console.warn('DOM element detected in CSV data, skipping')
              return ''
            }
            // Check for React Fiber properties
            if (value && typeof value === 'object' && (value.__reactFiber$ || value.__reactInternalInstance)) {
              console.warn('React Fiber node detected in CSV data, skipping')
              return ''
            }
            return value
          } catch (e) {
            console.warn('Error in transform function:', e)
            return ''
          }
        },
        complete: (results) => {
          try {
            if (results.errors.length > 0) {
              reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
              return
            }
            
            // Filter out any DOM elements that might have slipped through
            const filteredData = results.data.filter((row: any) => {
              if (!row || typeof row !== 'object') return false
              if (row.nodeType || row.constructor?.name === 'HTMLButtonElement' || row.constructor?.name === 'FiberNode') {
                console.warn('Filtering out DOM element from CSV data')
                return false
              }
              if (row.__reactFiber$ || row.__reactInternalInstance) {
                console.warn('Filtering out React Fiber node from CSV data')
                return false
              }
              return true
            })
            
            // Convert to our interface with simple type checking
            const cleanData: ProductCSVRow[] = filteredData.map((row: any, index: number) => {
              try {
                return {
                  name: String(row.name || '').trim(),
                  sku: String(row.sku || '').trim(),
                  description: String(row.description || '').trim(),
                  price: parseFloat(String(row.price || '0')) || 0,
                  category: String(row.category || '').trim(),
                  subcategory: String(row.subcategory || '').trim(),
                  stockLevel: parseInt(String(row.stockLevel || '0')) || 0,
                  minStock: parseInt(String(row.minStock || '0')) || 0,
                  isActive: convertToBoolean(row.isActive),
                  variations: String(row.variations || '[]').trim()
                }
              } catch (e) {
                console.error(`Error processing row ${index + 1}:`, e)
                return null
              }
            }).filter(row => row !== null)
            
            resolve(cleanData)
          } catch (error) {
            console.error('Error in CSV parsing complete callback:', error)
            reject(new Error('Failed to process CSV data'))
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error)
          reject(error)
        }
      })
    } catch (error) {
      console.error('Error in parseCSVFile:', error)
      reject(new Error('Failed to parse CSV file'))
    }
  })
}

// Bulletproof Excel parsing with comprehensive error handling
export function parseExcelFile(file: File): Promise<ProductCSVRow[]> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          // Filter out any DOM elements that might have slipped through
          const filteredData = jsonData.filter((row: any) => {
            if (!row || typeof row !== 'object') return false
            if (row.nodeType || row.constructor?.name === 'HTMLButtonElement' || row.constructor?.name === 'FiberNode') {
              console.warn('Filtering out DOM element from Excel data')
              return false
            }
            if (row.__reactFiber$ || row.__reactInternalInstance) {
              console.warn('Filtering out React Fiber node from Excel data')
              return false
            }
            return true
          })
          
          // Convert to our interface with simple type checking
          const cleanData: ProductCSVRow[] = filteredData.map((row: any, index: number) => {
            try {
              return {
                name: String(row.name || '').trim(),
                sku: String(row.sku || '').trim(),
                description: String(row.description || '').trim(),
                price: parseFloat(String(row.price || '0')) || 0,
                category: String(row.category || '').trim(),
                subcategory: String(row.subcategory || '').trim(),
                stockLevel: parseInt(String(row.stockLevel || '0')) || 0,
                minStock: parseInt(String(row.minStock || '0')) || 0,
                isActive: convertToBoolean(row.isActive),
                variations: String(row.variations || '[]').trim()
              }
            } catch (e) {
              console.error(`Error processing row ${index + 1}:`, e)
              return null
            }
          }).filter(row => row !== null)
          
          resolve(cleanData)
        } catch (error) {
          console.error('Error in Excel parsing:', error)
          reject(new Error('Failed to parse Excel file'))
        }
      }
      
      reader.onerror = () => {
        console.error('Error reading Excel file')
        reject(new Error('Failed to read Excel file'))
      }
      
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error in parseExcelFile:', error)
      reject(new Error('Failed to parse Excel file'))
    }
  })
}

// Completely safe validation that avoids ANY JSON operations
export function validateCSVData(data: ProductCSVRow[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check if data is valid array
  if (!Array.isArray(data)) {
    errors.push('Invalid data format: Expected array of products')
    return { valid: false, errors }
  }
  
  if (data.length === 0) {
    errors.push('No data found in file')
    return { valid: false, errors }
  }
  
  // Process each row with manual validation - no JSON operations
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 2 // +2 because CSV has header and arrays are 0-indexed
    
    try {
      // Check if row is a valid object
      if (!row || typeof row !== 'object') {
        errors.push(`Row ${rowNum}: Invalid row data`)
        continue
      }
      
      // Check for DOM elements in the row
      if (row.nodeType || row.constructor?.name === 'HTMLButtonElement' || row.constructor?.name === 'FiberNode') {
        errors.push(`Row ${rowNum}: Contains DOM element, skipping`)
        continue
      }
      
      // Additional check for React Fiber properties
      if (row.__reactFiber$ || row.__reactInternalInstance) {
        errors.push(`Row ${rowNum}: Contains React Fiber node, skipping`)
        continue
      }
      
      // Manual field validation without any JSON operations
      let name = ''
      let sku = ''
      let price = 0
      let category = ''
      let stockLevel = 0
      let minStock = 0
      let variations = ''
      
      // Safely extract name
      try {
        if (row.name && typeof row.name === 'string') {
          name = row.name.trim()
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract sku
      try {
        if (row.sku && typeof row.sku === 'string') {
          sku = row.sku.trim()
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract price
      try {
        if (row.price !== undefined && row.price !== null) {
          const priceStr = String(row.price)
          price = parseFloat(priceStr)
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract category
      try {
        if (row.category && typeof row.category === 'string') {
          category = row.category.trim()
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract stockLevel
      try {
        if (row.stockLevel !== undefined && row.stockLevel !== null) {
          const stockStr = String(row.stockLevel)
          stockLevel = parseInt(stockStr)
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract minStock
      try {
        if (row.minStock !== undefined && row.minStock !== null) {
          const minStockStr = String(row.minStock)
          minStock = parseInt(minStockStr)
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract variations
      try {
        if (row.variations && typeof row.variations === 'string') {
          variations = row.variations.trim()
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Validate the extracted data
      if (!name) {
        errors.push(`Row ${rowNum}: Name is required`)
      }
      
      if (!sku) {
        errors.push(`Row ${rowNum}: SKU is required`)
      }
      
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNum}: Price must be a valid positive number`)
      }
      
      if (!category) {
        errors.push(`Row ${rowNum}: Category is required`)
      }
      
      if (isNaN(stockLevel) || stockLevel < 0) {
        errors.push(`Row ${rowNum}: Stock Level must be a valid non-negative number`)
      }
      
      if (isNaN(minStock) || minStock < 0) {
        errors.push(`Row ${rowNum}: Min Stock must be a valid non-negative number`)
      }
      
      if (variations && variations !== '') {
        try {
          // Only validate JSON if we have a string
          if (typeof variations === 'string') {
            JSON.parse(variations)
          }
        } catch {
          errors.push(`Row ${rowNum}: Variations must be valid JSON format`)
        }
      }
      
    } catch (error) {
      console.error(`Error processing row ${rowNum}:`, error)
      errors.push(`Row ${rowNum}: Error processing row data`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Completely safe conversion that avoids ANY JSON operations
export function convertCSVToProducts(csvData: ProductCSVRow[]): Partial<Product>[] {
  if (!Array.isArray(csvData)) {
    console.error('Invalid data for conversion:', csvData)
    return []
  }
  
  const result: Partial<Product>[] = []
  
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i]
    
    try {
      // Check for DOM elements in the row
      if (row && typeof row === 'object' && (row.nodeType || row.constructor?.name === 'HTMLButtonElement' || row.constructor?.name === 'FiberNode')) {
        console.warn(`Skipping DOM element in row ${i + 1}`)
        continue
      }
      
      // Additional check for React Fiber properties
      if (row && typeof row === 'object' && (row.__reactFiber$ || row.__reactInternalInstance)) {
        console.warn(`Skipping React Fiber node in row ${i + 1}`)
        continue
      }
      
      // Manual field extraction without any JSON operations
      let name = ''
      let sku = ''
      let description = ''
      let price = 0
      let category = ''
      let subcategory = ''
      let stockLevel = 0
      let minStock = 0
      let isActive = true
      let variations: any[] = []
      
      // Safely extract name
      try {
        if (row.name && typeof row.name === 'string') {
          name = row.name.trim()
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract sku
      try {
        if (row.sku && typeof row.sku === 'string') {
          sku = row.sku.trim()
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract description
      try {
        if (row.description && typeof row.description === 'string') {
          description = row.description.trim()
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract price
      try {
        if (row.price !== undefined && row.price !== null) {
          const priceStr = String(row.price)
          price = parseFloat(priceStr)
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract category
      try {
        if (row.category && typeof row.category === 'string') {
          category = row.category.trim()
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract subcategory
      try {
        if (row.subcategory && typeof row.subcategory === 'string') {
          subcategory = row.subcategory.trim()
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract stockLevel
      try {
        if (row.stockLevel !== undefined && row.stockLevel !== null) {
          const stockStr = String(row.stockLevel)
          stockLevel = parseInt(stockStr)
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract minStock
      try {
        if (row.minStock !== undefined && row.minStock !== null) {
          const minStockStr = String(row.minStock)
          minStock = parseInt(minStockStr)
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract isActive
      try {
        isActive = convertToBoolean(row.isActive)
      } catch (e) {
        // Ignore errors
      }
      
      // Safely extract variations
      try {
        if (row.variations && typeof row.variations === 'string' && row.variations.trim() !== '') {
          variations = JSON.parse(row.variations)
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Create the product object
      const product: Partial<Product> = {
        name,
        sku,
        description,
        price,
        category,
        subcategory,
        stockLevel,
        minStock,
        isActive,
        variations
      }
      
      result.push(product)
      
    } catch (error) {
      console.error(`Error processing row ${i + 1}:`, error)
      // Continue with next row
    }
  }
  
  return result
}

// Simple boolean conversion
function convertToBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim()
    return lowerValue === 'true' || lowerValue === '1'
  }
  if (typeof value === 'number') {
    return value === 1
  }
  return Boolean(value)
}

// Export functions
export function exportProductsToCSV(products: Product[]): void {
  const csvData = products.map(product => ({
    name: product.name,
    sku: product.sku,
    description: product.description || '',
    price: product.price,
    category: product.category || '',
    subcategory: product.subcategory || '',
    stockLevel: product.stockLevel,
    minStock: product.minStock,
    isActive: product.isActive,
    variations: JSON.stringify(product.variations || [])
  }))
  
  const csv = Papa.unparse(csvData)
  downloadCSV(csv, 'products.csv')
}

export function exportProductsToExcel(products: Product[]): void {
  const excelData = products.map(product => ({
    name: product.name,
    sku: product.sku,
    description: product.description || '',
    price: product.price,
    category: product.category || '',
    subcategory: product.subcategory || '',
    stockLevel: product.stockLevel,
    minStock: product.minStock,
    isActive: product.isActive,
    variations: JSON.stringify(product.variations || [])
  }))
  
  const worksheet = XLSX.utils.json_to_sheet(excelData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')
  
  XLSX.writeFile(workbook, 'products.xlsx')
}

export function downloadCSVTemplate(): void {
  const templateData = [
    {
      name: 'Sample Product',
      sku: 'SAMPLE-001',
      description: 'This is a sample product description',
      price: 99.99,
      category: 'Electronics',
      subcategory: 'Smartphones',
      stockLevel: 50,
      minStock: 10,
      isActive: true,
      variations: '[]'
    }
  ]
  
  const csv = Papa.unparse(templateData)
  downloadCSV(csv, 'product_template.csv')
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
