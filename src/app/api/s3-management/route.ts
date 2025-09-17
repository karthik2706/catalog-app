import { NextRequest, NextResponse } from 'next/server'
import { s3FolderManager, getFolderStructureInfo } from '@/lib/s3-folder-manager'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

function getClientIdFromRequest(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return decoded.clientId || null
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

// GET /api/s3-management - Get folder structure info
export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sku = searchParams.get('sku')
    const action = searchParams.get('action')

    if (action === 'list-products') {
      const products = await s3FolderManager.listClientProducts(clientId)
      return NextResponse.json({ products })
    }

    if (action === 'list-media' && sku) {
      const mediaFiles = await s3FolderManager.listProductMedia(clientId, sku)
      return NextResponse.json({ mediaFiles })
    }

    if (action === 'folder-info' && sku) {
      const folderInfo = getFolderStructureInfo(clientId, sku)
      const mediaFiles = await s3FolderManager.listProductMedia(clientId, sku)
      const folderSize = await s3FolderManager.getProductMediaSize(clientId, sku)
      
      return NextResponse.json({
        folderInfo,
        mediaFiles,
        folderSize,
        fileCount: mediaFiles.length
      })
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    )

  } catch (error) {
    console.error('S3 management error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/s3-management - Delete files or folders
export async function DELETE(request: NextRequest) {
  try {
    const clientId = getClientIdFromRequest(request)
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sku = searchParams.get('sku')
    const key = searchParams.get('key')
    const action = searchParams.get('action')

    if (action === 'delete-product-media' && sku) {
      const success = await s3FolderManager.deleteProductMedia(clientId, sku)
      return NextResponse.json({ success })
    }

    if (action === 'delete-file' && key) {
      const success = await s3FolderManager.deleteFile(key)
      return NextResponse.json({ success })
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    )

  } catch (error) {
    console.error('S3 delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
