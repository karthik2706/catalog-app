'use client'

import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Badge } from './Badge'
import { 
  AlertTriangle, 
  X,
  Package,
  RefreshCw
} from 'lucide-react'

interface DuplicateSKUDialogProps {
  isOpen: boolean
  onClose: () => void
  onOverwrite: () => void
  onCancel: () => void
  duplicateSKUs: string[]
  loading?: boolean
}

export function DuplicateSKUDialog({ 
  isOpen, 
  onClose, 
  onOverwrite, 
  onCancel,
  duplicateSKUs,
  loading = false
}: DuplicateSKUDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Duplicate SKUs Found</h2>
              <p className="text-sm text-slate-600">Some products already exist in your inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900 mb-2">
                  {duplicateSKUs.length} product{duplicateSKUs.length > 1 ? 's' : ''} with duplicate SKU{duplicateSKUs.length > 1 ? 's' : ''} found
                </h3>
                <p className="text-sm text-orange-800 mb-3">
                  The following SKUs already exist in your inventory. You can choose to overwrite them with the new data or cancel the import.
                </p>
                <div className="flex flex-wrap gap-2">
                  {duplicateSKUs.map((sku, index) => (
                    <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                      <Package className="w-3 h-3 mr-1" />
                      {sku}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Overwrite Option</h4>
                <p className="text-sm text-blue-800">
                  This will update the existing products with the new information from your import file. 
                  The existing product data will be completely replaced.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <X className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-slate-900 mb-1">Cancel Option</h4>
                <p className="text-sm text-slate-700">
                  This will cancel the import and you can modify your file to use different SKUs or remove the duplicate entries.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel Import
          </Button>
          <Button
            onClick={onOverwrite}
            loading={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Overwrite & Import
          </Button>
        </div>
      </div>
    </Modal>
  )
}
