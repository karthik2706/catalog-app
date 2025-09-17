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

// Simple CSV parsing without any complex data manipulation
export function parseCSVFile(file: File): Promise<ProductCSVRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => {
        // Simple string trimming - no complex object manipulation
        return typeof value === 'string' ? value.trim() : value
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
          return
        }
        
        // Convert to our interface with simple type checking
        const cleanData: ProductCSVRow[] = results.data.map((row: any) => ({
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
        }))
        
        resolve(cleanData)
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

// Simple Excel parsing
export function parseExcelFile(file: File): Promise<ProductCSVRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        // Convert to our interface with simple type checking
        const cleanData: ProductCSVRow[] = jsonData.map((row: any) => ({
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
        }))
        
        resolve(cleanData)
      } catch (error) {
        reject(new Error('Failed to parse Excel file'))
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read Excel file'))
    reader.readAsArrayBuffer(file)
  })
}

// Simple validation without any complex object manipulation
export function validateCSVData(data: ProductCSVRow[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!Array.isArray(data)) {
    errors.push('Invalid data format: Expected array of products')
    return { valid: false, errors }
  }
  
  if (data.length === 0) {
    errors.push('No data found in file')
    return { valid: false, errors }
  }
  
  data.forEach((row, index) => {
    const rowNum = index + 2 // +2 because CSV has header and arrays are 0-indexed
    
    if (!row.name || row.name.trim() === '') {
      errors.push(`Row ${rowNum}: Name is required`)
    }
    
    if (!row.sku || row.sku.trim() === '') {
      errors.push(`Row ${rowNum}: SKU is required`)
    }
    
    if (isNaN(row.price) || row.price < 0) {
      errors.push(`Row ${rowNum}: Price must be a valid positive number`)
    }
    
    if (!row.category || row.category.trim() === '') {
      errors.push(`Row ${rowNum}: Category is required`)
    }
    
    if (isNaN(row.stockLevel) || row.stockLevel < 0) {
      errors.push(`Row ${rowNum}: Stock Level must be a valid non-negative number`)
    }
    
    if (isNaN(row.minStock) || row.minStock < 0) {
      errors.push(`Row ${rowNum}: Min Stock must be a valid non-negative number`)
    }
    
    if (row.variations && row.variations.trim() !== '') {
      try {
        JSON.parse(row.variations)
      } catch {
        errors.push(`Row ${rowNum}: Variations must be valid JSON format`)
      }
    }
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Simple conversion to product format
export function convertCSVToProducts(csvData: ProductCSVRow[]): Partial<Product>[] {
  return csvData.map(row => ({
    name: row.name.trim(),
    sku: row.sku.trim(),
    description: row.description?.trim() || '',
    price: row.price,
    category: row.category.trim(),
    subcategory: row.subcategory?.trim() || '',
    stockLevel: row.stockLevel,
    minStock: row.minStock,
    isActive: row.isActive,
    variations: row.variations ? JSON.parse(row.variations) : []
  }))
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
