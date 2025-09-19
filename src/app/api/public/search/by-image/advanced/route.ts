import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchSimilarImages } from '@/lib/search'

// Optional API key validation for public access
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  const expectedApiKey = process.env.PUBLIC_API_KEY
  
  // If no API key is configured, allow public access
  if (!expectedApiKey) {
    return true
  }
  
  // If API key is configured, validate it
  return apiKey === expectedApiKey
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key if configured
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      )
    }

    const clientSlug = request.nextUrl.searchParams.get('client')
    const similarityThreshold = parseInt(request.nextUrl.searchParams.get('threshold') || '95')
    const maxResults = parseInt(request.nextUrl.searchParams.get('limit') || '10')
    
    if (!clientSlug) {
      return NextResponse.json(
        { error: 'Client slug is required. Use ?client=your-client-slug' },
        { status: 400 }
      )
    }

    // Validate parameters
    if (similarityThreshold < 0 || similarityThreshold > 100) {
      return NextResponse.json(
        { error: 'Similarity threshold must be between 0 and 100' },
        { status: 400 }
      )
    }

    if (maxResults < 1 || maxResults > 50) {
      return NextResponse.json(
        { error: 'Max results must be between 1 and 50' },
        { status: 400 }
      )
    }

    // Find client by slug
    const client = await prisma.client.findFirst({
      where: {
        slug: clientSlug,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        currency: {
          select: {
            code: true,
            symbol: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or inactive' },
        { status: 404 }
      )
    }

    // Get the uploaded file
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Generate embedding using the embedding service
    const embeddingServiceUrl = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000'
    
    const embeddingFormData = new FormData()
    embeddingFormData.append('file', file)

    const embeddingResponse = await fetch(`${embeddingServiceUrl}/embed-image`, {
      method: 'POST',
      body: embeddingFormData,
    })

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text()
      console.error('Embedding service error:', errorText)
      return NextResponse.json(
        { error: 'Failed to process image for search' },
        { status: 500 }
      )
    }

    const embeddingData = await embeddingResponse.json()
    
    if (!embeddingData.embedding || !Array.isArray(embeddingData.embedding)) {
      return NextResponse.json(
        { error: 'Invalid embedding response from service' },
        { status: 500 }
      )
    }

    // Search for similar images
    const searchResults = await searchSimilarImages(
      embeddingData.embedding,
      client.id,
      Math.max(maxResults * 2, 50) // Get more results to filter
    )

    // Filter results by similarity threshold
    const filteredResults = searchResults.filter(result => result.similarityPercent >= similarityThreshold)

    // Enrich results with product and media data
    const enrichedResults = await Promise.all(
      filteredResults.slice(0, maxResults).map(async (result) => {
        const product = await prisma.product.findUnique({
          where: { id: result.productId },
          select: {
            id: true,
            name: true,
            sku: true,
            description: true,
            price: true,
            stockLevel: true,
            minStock: true,
            category: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        })

        if (!product) return null

        const media = await prisma.media.findFirst({
          where: {
            productId: result.productId,
            kind: 'image',
            status: 'completed'
          },
          select: {
            id: true,
            s3Key: true,
            url: true,
            width: true,
            height: true,
            fileType: true
          }
        })

        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          description: product.description,
          price: product.price,
          currency: client.currency?.code || 'USD',
          currencySymbol: client.currency?.symbol || '$',
          stockLevel: product.stockLevel,
          minStock: product.minStock,
          category: product.category,
          isActive: product.isActive,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          similarity: {
            percent: result.similarityPercent,
            score: result.score
          },
          image: media ? {
            id: media.id,
            url: media.url,
            s3Key: media.s3Key,
            width: media.width,
            height: media.height,
            fileType: media.fileType
          } : null,
          client: {
            id: client.id,
            name: client.name,
            slug: client.slug
          }
        }
      })
    )

    // Remove null results and sort by similarity
    const validResults = enrichedResults
      .filter(result => result !== null)
      .sort((a, b) => b.similarity.percent - a.similarity.percent)

    const response = {
      success: true,
      data: {
        results: validResults,
        total: validResults.length,
        query: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          model: embeddingData.model || 'CLIP-ViT-B/32',
          device: embeddingData.device || 'cpu',
          similarityThreshold: similarityThreshold,
          maxResults: maxResults
        },
        client: {
          id: client.id,
          name: client.name,
          slug: client.slug
        },
        filters: {
          applied: {
            similarityThreshold: similarityThreshold,
            maxResults: maxResults
          },
          available: {
            minSimilarityThreshold: 0,
            maxSimilarityThreshold: 100,
            minMaxResults: 1,
            maxMaxResults: 50
          }
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in advanced public image search:', error)
    return NextResponse.json(
      { error: 'Failed to process image search' },
      { status: 500 }
    )
  }
}
