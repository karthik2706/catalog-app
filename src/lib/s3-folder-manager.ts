import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { s3Client, S3_BUCKET_NAME } from './aws'

// S3 Folder Management Utilities
export class S3FolderManager {
  private client: S3Client
  private bucketName: string

  constructor() {
    this.client = s3Client
    this.bucketName = S3_BUCKET_NAME
  }

  // List all files in a product's media folder
  async listProductMedia(clientId: string, sku: string): Promise<string[]> {
    try {
      const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
      const prefix = `clients/${clientId}/products/${cleanSku}/media/`
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      })

      const response = await this.client.send(command)
      return response.Contents?.map(obj => obj.Key || '') || []
    } catch (error) {
      console.error('Error listing product media:', error)
      return []
    }
  }

  // Delete all files in a product's media folder
  async deleteProductMedia(clientId: string, sku: string): Promise<boolean> {
    try {
      const files = await this.listProductMedia(clientId, sku)
      
      if (files.length === 0) {
        return true
      }

      // Delete all files
      const deletePromises = files.map(key => 
        this.client.send(new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }))
      )

      await Promise.all(deletePromises)
      return true
    } catch (error) {
      console.error('Error deleting product media:', error)
      return false
    }
  }

  // Delete a specific file
  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }))
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  // Get folder size for a product
  async getProductMediaSize(clientId: string, sku: string): Promise<number> {
    try {
      const files = await this.listProductMedia(clientId, sku)
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `clients/${clientId}/products/${sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()}/media/`,
      })

      const response = await this.client.send(command)
      return response.Contents?.reduce((total, obj) => total + (obj.Size || 0), 0) || 0
    } catch (error) {
      console.error('Error getting folder size:', error)
      return 0
    }
  }

  // List all clients
  async listClients(): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: 'clients/',
        Delimiter: '/',
      })

      const response = await this.client.send(command)
      return response.CommonPrefixes?.map(prefix => 
        prefix.Prefix?.replace('clients/', '').replace('/', '') || ''
      ).filter(Boolean) || []
    } catch (error) {
      console.error('Error listing clients:', error)
      return []
    }
  }

  // List all products for a client
  async listClientProducts(clientId: string): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `clients/${clientId}/products/`,
        Delimiter: '/',
      })

      const response = await this.client.send(command)
      return response.CommonPrefixes?.map(prefix => {
        const productPath = prefix.Prefix?.replace(`clients/${clientId}/products/`, '').replace('/', '') || ''
        return productPath.replace(/^[^-]+-/, '') // Remove timestamp prefix if any
      }).filter(Boolean) || []
    } catch (error) {
      console.error('Error listing client products:', error)
      return []
    }
  }
}

// Export singleton instance
export const s3FolderManager = new S3FolderManager()

// Helper function to generate folder structure info
export function getFolderStructureInfo(clientId: string, sku: string) {
  const cleanSku = sku.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
  
  return {
    clientFolder: `clients/${clientId}`,
    productFolder: `clients/${clientId}/products/${cleanSku}`,
    mediaFolder: `clients/${clientId}/products/${cleanSku}/media`,
    imageFolder: `clients/${clientId}/products/${cleanSku}/media/image`,
    videoFolder: `clients/${clientId}/products/${cleanSku}/media/video`,
    thumbnailFolder: `clients/${clientId}/products/${cleanSku}/media/thumbnails`,
  }
}
