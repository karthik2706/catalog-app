import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateProductRequest, ProductFilters } from '@/types'
import jwt from 'jsonwebtoken'
import { generateSignedUrl } from '@/lib/aws'

interface JWTPayload {
  userId: string
  email: string
  role: string
  clientId?: string
  clientSlug?: string
}

function getUserFromRequest(request: NextRequest): { userId: string; role: string; clientId?: string } | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload
      return {
        userId: decoded.userId,
        role: decoded.role,
        clientId: decoded.clientId
      }
    } catch (error) {
      console.error('Error decoding token:', error)
    }
  }
  return null
}

// Helper function to process media and generate signed URLs
async function processMediaWithUrls(products: any[]): Promise<any[]> {
  console.log('processMediaWithUrls called with:', {
    productCount: products.length,
    productsWithMedia: products.filter(p => p.media && p.media.length > 0).length,
    productsWithLegacyImages: products.filter(p => p.images && p.images.length > 0).length
  })
  
  const processedProducts = await Promise.all(
    products.map(async (product) => {
      console.log('Processing product:', {
        sku: product.sku,
        hasMedia: !!(product.media && product.media.length > 0),
        hasLegacyImages: !!(product.images && product.images.length > 0),
        mediaCount: product.media?.length || 0,
        legacyImageCount: product.images?.length || 0
      })
      
      let processedMedia = []
      let processedImages = []
      let processedVideos = []
      
      // Process new media table
      if (product.media && product.media.length > 0) {
        processedMedia = await Promise.all(
          product.media.map(async (media: any) => {
            try {
              const signedUrl = await generateSignedUrl(media.s3Key, 7 * 24 * 60 * 60) // 7 days
              console.log('Generated signed URL for new media:', {
                s3Key: media.s3Key,
                signedUrl: signedUrl,
                isSigned: signedUrl.includes('X-Amz-Signature'),
                hasSignature: signedUrl.includes('X-Amz-Signature')
              })
              
              // Ensure we have a valid signed URL
              if (!signedUrl || !signedUrl.includes('X-Amz-Signature')) {
                throw new Error('Generated URL is not properly signed')
              }
              
              return {
                ...media,
                url: signedUrl,
                key: media.s3Key, // Map s3Key to key for compatibility
                fileName: media.s3Key.split('/').pop() || 'unknown', // Extract filename from s3Key
                fileType: media.kind === 'image' ? 'image/jpeg' : 'video/mp4', // Default types
                fileSize: 0, // Not stored in Media table
                uploadedAt: media.createdAt,
                id: media.id.toString() // Convert BigInt to string
              }
            } catch (error) {
              console.error('Error generating signed URL for media:', {
                s3Key: media.s3Key,
                error: error.message,
                stack: error.stack
              })
              return {
                ...media,
                url: null,
                key: media.s3Key,
                fileName: media.s3Key.split('/').pop() || 'unknown',
                fileType: media.kind === 'image' ? 'image/jpeg' : 'video/mp4',
                fileSize: 0,
                uploadedAt: media.createdAt,
                id: media.id.toString()
              }
            }
          })
        )
        
        // Separate images and videos for backward compatibility
        processedImages = processedMedia.filter(m => m.kind === 'image')
        processedVideos = processedMedia.filter(m => m.kind === 'video')
      }
      
      // Process legacy images field
      if (product.images && product.images.length > 0) {
        console.log('Processing legacy images for', product.sku, ':', product.images)
        processedImages = await Promise.all(
          product.images.map(async (image: any) => {
            try {
              // Always generate a new signed URL for security and consistency
              const s3Key = image.key || image.s3Key
              if (s3Key) {
                const signedUrl = await generateSignedUrl(s3Key, 7 * 24 * 60 * 60) // 7 days
                console.log('Generated signed URL for legacy image:', {
                  s3Key: s3Key,
                  signedUrl: signedUrl.substring(0, 100) + '...',
                  isSigned: signedUrl.includes('X-Amz-Signature')
                })
                
                return {
                  ...image,
                  url: signedUrl
                }
              }
              
              // If no s3Key, return original image
              return image
            } catch (error) {
              console.error('Error processing legacy image:', {
                image: image,
                error: error.message
              })
              return image
            }
          })
        )
      }
      
      // Process legacy videos field
      if (product.videos && product.videos.length > 0) {
        console.log('Processing legacy videos for', product.sku, ':', product.videos)
        processedVideos = await Promise.all(
          product.videos.map(async (video: any) => {
            try {
              // Always generate a new signed URL for security and consistency
              const s3Key = video.key || video.s3Key
              if (s3Key) {
                const signedUrl = await generateSignedUrl(s3Key, 7 * 24 * 60 * 60) // 7 days
                console.log('Generated signed URL for legacy video:', {
                  s3Key: s3Key,
                  signedUrl: signedUrl.substring(0, 100) + '...',
                  isSigned: signedUrl.includes('X-Amz-Signature')
                })
                
                return {
                  ...video,
                  url: signedUrl
                }
              }
              
              // If no s3Key, return original video
              return video
            } catch (error) {
              console.error('Error processing legacy video:', {
                video: video,
                error: error.message
              })
              return video
            }
          })
        )
      }
      
      const result = {
        ...product,
        media: processedMedia,
        images: processedImages,
        videos: processedVideos
      }
      
      // Debug logging for KB-002
      if (product.sku === 'KB-002') {
        console.log('Final result for KB-002:', {
          sku: result.sku,
          images: result.images,
          videos: result.videos,
          media: result.media,
          processedImagesLength: processedImages.length,
          processedVideosLength: processedVideos.length,
          processedMediaLength: processedMedia.length
        })
      }
      
      return result
    })
  )
  
  return processedProducts
}

// GET /api/products - Get all products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For super admin, show all products; for regular users, show client-specific products
    const isSuperAdmin = user.role === 'SUPER_ADMIN'
    const whereClause = isSuperAdmin ? {} : { clientId: user.clientId }

    const { searchParams } = new URL(request.url)
    
    const filters: ProductFilters = {
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      lowStock: searchParams.get('lowStock') === 'true' ? true : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    }

    try {
      // Try to fetch from database first
      const skip = ((filters.page || 1) - 1) * (filters.limit || 10)
      const take = filters.limit || 10

      // Build where clause with tenant isolation
      const where: any = {
        ...whereClause, // Use the appropriate where clause for super admin or client
        isActive: true,
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ]
      }

      if (filters.category) {
        where.categoryId = filters.category
      }

      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {}
        if (filters.minPrice !== undefined) {
          where.price.gte = filters.minPrice
        }
        if (filters.maxPrice !== undefined) {
          where.price.lte = filters.maxPrice
        }
      }

      if (filters.inStock) {
        where.stockLevel = { gt: 0 }
      }

      // Note: lowStock filtering will be done after fetching data
      // since Prisma doesn't easily support comparing two fields in the same table

      // Build orderBy clause
      const orderBy: any = {}
      orderBy[filters.sortBy || 'name'] = filters.sortOrder || 'asc'

      const [allProducts, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            categoryRef: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            categories: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    parentId: true
                  }
                }
              }
            },
            inventoryHistory: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        }),
        prisma.product.count({ where })
      ])

      // Fetch media data separately and attach to products
      const productIds = allProducts.map(p => p.id)
      console.log('Fetching media for product IDs:', productIds)
      
      const mediaData = productIds.length > 0 ? await prisma.media.findMany({
        where: {
          productId: { in: productIds }
        },
        select: {
          id: true,
          productId: true,
          kind: true,
          s3Key: true,
          width: true,
          height: true,
          durationMs: true,
          status: true,
          error: true,
          createdAt: true,
          updatedAt: true
        }
      }) : []

      console.log('Raw media data from database:', {
        mediaCount: mediaData.length,
        mediaData: mediaData.map(m => ({ id: m.id, productId: m.productId, kind: m.kind, s3Key: m.s3Key }))
      })

      // Group media by productId
      const mediaByProduct = mediaData.reduce((acc, media) => {
        if (!acc[media.productId]) {
          acc[media.productId] = []
        }
        acc[media.productId].push(media)
        return acc
      }, {} as Record<string, any[]>)

      console.log('Media grouped by product:', mediaByProduct)

      // Attach media to products
      const productsWithMedia = allProducts.map(product => ({
        ...product,
        media: mediaByProduct[product.id] || []
      }))

      console.log('Products with media attached:', {
        productCount: productsWithMedia.length,
        firstProduct: {
          id: productsWithMedia[0]?.id,
          sku: productsWithMedia[0]?.sku,
          mediaCount: productsWithMedia[0]?.media?.length,
          media: productsWithMedia[0]?.media,
          images: productsWithMedia[0]?.images,
          videos: productsWithMedia[0]?.videos,
          thumbnailUrl: productsWithMedia[0]?.thumbnailUrl
        }
      })

      // Filter for low stock items if requested
      let products = productsWithMedia
      let filteredTotal = total
      if (filters.lowStock) {
        products = productsWithMedia.filter(product => 
          product.stockLevel !== null && 
          product.minStock !== null && 
          product.stockLevel <= product.minStock
        )
        filteredTotal = products.length
      }

      // Process media to generate signed URLs
      console.log('Processing products for media URLs:', {
        productCount: products.length,
        productsWithMedia: products.filter(p => p.media && p.media.length > 0).length,
        firstProductMedia: products[0]?.media
      })
      const processedProducts = await processMediaWithUrls(products)
      console.log('Processed products:', {
        processedCount: processedProducts.length,
        firstProcessedMedia: processedProducts[0]?.media,
        firstProductImages: processedProducts[0]?.images,
        firstProductVideos: processedProducts[0]?.videos,
        firstProductThumbnail: processedProducts[0]?.thumbnailUrl
      })

      return NextResponse.json({
        products: processedProducts,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: filteredTotal,
          pages: Math.ceil(filteredTotal / (filters.limit || 10))
        }
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: CreateProductRequest = await request.json()
    
    // Determine clientId based on user role
    let clientId: string
    if (user.role === 'SUPER_ADMIN') {
      // For super admin, require a clientId in the request body
      if (!body.clientId) {
        return NextResponse.json(
          { error: 'Client ID required for super admin' },
          { status: 400 }
        )
      }
      clientId = body.clientId
    } else if (!user.clientId) {
      return NextResponse.json(
        { error: 'Client context required' },
        { status: 400 }
      )
    } else {
      clientId = user.clientId
    }
    
    // Validate required fields
    if (!body.name || !body.sku || !body.price || !body.categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku, price, categoryId' },
        { status: 400 }
      )
    }

    try {
      // Try to create in database first
      // Check if SKU already exists within the client
      const existingProduct = await prisma.product.findFirst({
        where: { 
          sku: body.sku,
          clientId 
        }
      })

      if (existingProduct) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 409 }
        )
      }

      // Get category name for backward compatibility
      const category = await prisma.category.findFirst({
        where: { id: body.categoryId, clientId }
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        )
      }

      const product = await prisma.product.create({
        data: {
          name: body.name,
          sku: body.sku,
          description: body.description,
          price: body.price,
          category: category.name, // For backward compatibility
          categoryId: body.categoryId,
          variations: body.variations || [],
          stockLevel: body.stockLevel || 0,
          minStock: body.minStock || 0,
          clientId, // Ensure tenant isolation
          // Media fields
          images: body.images || [],
          videos: body.videos || [],
          thumbnailUrl: body.thumbnailUrl || null,
          categories: body.categoryIds ? {
            create: body.categoryIds.map((categoryId: string) => ({
              categoryId
            }))
          } : undefined
        },
        include: {
          categoryRef: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  parentId: true
                }
              }
            }
          },
          inventoryHistory: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        }
      })

      return NextResponse.json(product, { status: 201 })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}