'use client'

import React, { useState, useRef } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Loading } from './Loading'
import { Badge } from './Badge'
import { 
  Download, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  X,
  FileSpreadsheet,
  File
} from 'lucide-react'
import { 
  exportProductsToCSV, 
  exportProductsToExcel, 
  downloadCSVTemplate, 
  parseCSVFile, 
  parseExcelFile, 
  validateCSVData, 
  convertCSVToProducts,
  ProductCSVRow 
} from '@/lib/csv-utils'
import { Product } from '@/types'
import { DuplicateSKUDialog } from './DuplicateSKUDialog'

interface ImportExportModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  onImport: (products: Partial<Product>[], overwrite?: boolean) => Promise<void>
  onExport: () => void
}

export function ImportExportModal({ 
  isOpen, 
  onClose, 
  products, 
  onImport, 
  onExport 
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('export')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ProductCSVRow[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const [duplicateSKUDialogOpen, setDuplicateSKUDialogOpen] = useState(false)
  const [duplicateSKUs, setDuplicateSKUs] = useState<string[]>([])
  const [pendingImportData, setPendingImportData] = useState<Partial<Product>[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportFile(file)
    setIsValidating(true)
    setValidationErrors([])
    setImportData([])

    try {
      let data: ProductCSVRow[]
      
      if (file.name.endsWith('.csv')) {
        data = await parseCSVFile(file)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await parseExcelFile(file)
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.')
      }

      // Additional safety check - ensure data is clean
      if (!Array.isArray(data)) {
        throw new Error('Invalid file format: Expected array of products')
      }

      setImportData(data)
      
      // Validate the data
      try {
        const validation = validateCSVData(data)
        setValidationErrors(validation.errors)
        setIsValid(!validation.valid)
        
        if (!validation.valid) {
          setImportSuccess(false)
        }
      } catch (validationError) {
        console.error('Validation error:', validationError)
        setValidationErrors(['Failed to validate CSV data. Please check the file format.'])
        setIsValid(false)
        setImportSuccess(false)
      }
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Failed to parse file'])
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (validationErrors.length > 0) return

    setIsProcessing(true)
    try {
      let productsToImport: Partial<Product>[]
      
      try {
        productsToImport = convertCSVToProducts(importData)
      } catch (conversionError) {
        console.error('CSV conversion error:', conversionError)
        if (conversionError instanceof Error && conversionError.message?.includes('circular structure')) {
          setValidationErrors(['CSV data contains circular references. Please check the file and try again.'])
        } else {
          setValidationErrors(['Failed to convert CSV data. Please check the file format.'])
        }
        return
      }
      
      // If we have pending import data (from duplicate SKU dialog), use that
      const dataToImport = pendingImportData.length > 0 ? pendingImportData : productsToImport
      const shouldOverwrite = pendingImportData.length > 0 // Always overwrite when coming from duplicate SKU dialog
      
      await onImport(dataToImport, shouldOverwrite)
      setImportSuccess(true)
      setTimeout(() => {
        setImportSuccess(false)
        onClose()
        resetForm()
      }, 2000)
    } catch (error: any) {
      // Check if it's a duplicate SKU error
      if (error.message?.includes('Duplicate SKUs found') || error.duplicateSKUs) {
        setDuplicateSKUs(error.duplicateSKUs || [])
        setPendingImportData(convertCSVToProducts(importData))
        setDuplicateSKUDialogOpen(true)
      } else {
        setValidationErrors([error instanceof Error ? error.message : 'Failed to import products'])
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExportCSV = () => {
    exportProductsToCSV(products)
    onClose()
  }

  const handleExportExcel = () => {
    exportProductsToExcel(products)
    onClose()
  }

  const handleDownloadTemplate = () => {
    downloadCSVTemplate()
  }

  const resetForm = () => {
    setImportFile(null)
    setImportData([])
    setValidationErrors([])
    setIsValid(false)
    setImportSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleOverwrite = async () => {
    setDuplicateSKUDialogOpen(false)
    await handleImport()
  }

  const handleCancelImport = () => {
    setDuplicateSKUDialogOpen(false)
    setPendingImportData([])
    setDuplicateSKUs([])
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Import / Export Products</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Export Products
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Import Products
          </button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <Download className="w-16 h-16 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Export Products
              </h3>
              <p className="text-slate-600 mb-6">
                Download your products data in CSV or Excel format
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2"
                >
                  <File className="w-4 h-4" />
                  <span>Export as CSV</span>
                </Button>
                <Button
                  onClick={handleExportExcel}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export as Excel</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Template Download */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-1">Download Template</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Download our CSV template to see the expected format and structure for importing products.
                  </p>
                  <Button
                    onClick={handleDownloadTemplate}
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Upload File
                </h3>
                <p className="text-slate-600 mb-4">
                  Choose a CSV or Excel file to import products
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mb-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                {importFile && (
                  <div className="mt-4">
                    <Badge variant="secondary" className="flex items-center space-x-2 w-fit mx-auto">
                      <FileText className="w-4 h-4" />
                      <span>{importFile.name}</span>
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Results */}
            {isValidating && (
              <div className="flex items-center justify-center py-4">
                <Loading size="sm" text="Validating file..." />
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 mb-2">Validation Errors</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {importData.length > 0 && validationErrors.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 mb-1">File Validated Successfully</h4>
                    <p className="text-sm text-green-700">
                      Found {importData.length} products ready to import
                    </p>
                  </div>
                </div>
              </div>
            )}

            {importSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">Import Successful!</h4>
                    <p className="text-sm text-green-700">
                      Products have been imported successfully
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={validationErrors.length > 0 || importData.length === 0 || isProcessing}
                loading={isProcessing}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Products
              </Button>
            </div>
          </div>
        )}

        {/* Duplicate SKU Dialog */}
        <DuplicateSKUDialog
          isOpen={duplicateSKUDialogOpen}
          onClose={handleCancelImport}
          onOverwrite={handleOverwrite}
          onCancel={handleCancelImport}
          duplicateSKUs={duplicateSKUs}
          loading={isProcessing}
        />
      </div>
    </Modal>
  )
}
