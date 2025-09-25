'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import InventoryDashboard from '@/components/InventoryDashboard'
import InventoryManagementModal from '@/components/InventoryManagementModal'
import { Product } from '@/types'

export default function InventoryPage() {
  const router = useRouter()
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const handleViewProduct = (productId: string) => {
    router.push(`/products/${productId}`)
  }

  const handleUpdateInventory = (productId: string) => {
    // For now, we'll need to fetch the product data
    // In a real implementation, you might want to pass the product data directly
    // or fetch it here before opening the modal
    setSelectedProduct({ id: productId } as Product)
    setInventoryModalOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="page-container">
        <InventoryDashboard 
          onViewProduct={handleViewProduct}
          onUpdateInventory={handleUpdateInventory}
        />
      </div>

      {/* Inventory Management Modal */}
      <InventoryManagementModal
        isOpen={inventoryModalOpen}
        onClose={() => {
          setInventoryModalOpen(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        onInventoryUpdate={() => {
          // Refresh the dashboard data
          window.location.reload() // Simple refresh for now
        }}
      />
    </DashboardLayout>
  )
}
