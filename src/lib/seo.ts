import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product' | 'profile'
  siteName?: string
  locale?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
  price?: {
    amount: number
    currency: string
  }
  availability?: 'in stock' | 'out of stock' | 'preorder'
  brand?: string
  category?: string
  sku?: string
  rating?: {
    value: number
    count: number
  }
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url,
    type = 'website',
    siteName = 'Stock Mind',
    locale = 'en_US',
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = [],
    price,
    availability,
    brand,
    category,
    sku,
    rating
  } = config

  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`
  const fullDescription = description.length > 160 ? description.substring(0, 157) + '...' : description

  const metadata: Metadata = {
    title: fullTitle,
    description: fullDescription,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : undefined,
    creator: author,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: url,
      siteName: siteName,
      locale: locale,
      type: type,
      images: image ? [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        }
      ] : undefined,
      publishedTime: publishedTime,
      modifiedTime: modifiedTime,
      authors: author ? [author] : undefined,
      section: section,
      tags: tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: image ? [image] : undefined,
      creator: author ? `@${author.replace(/\s+/g, '').toLowerCase()}` : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION_ID,
      yandex: process.env.YANDEX_VERIFICATION_ID,
      yahoo: process.env.YAHOO_VERIFICATION_ID,
    },
  }

  // Add product-specific metadata
  if (type === 'product') {
    metadata.other = {
      ...metadata.other,
      'product:price:amount': price?.amount?.toString(),
      'product:price:currency': price?.currency,
      'product:availability': availability,
      'product:brand': brand,
      'product:category': category,
      'product:sku': sku,
      'product:rating': rating ? `${rating.value}/5` : undefined,
      'product:rating_count': rating?.count?.toString(),
    }
  }

  return metadata
}

export function generateStructuredData(config: SEOConfig) {
  const {
    title,
    description,
    url,
    type,
    image,
    publishedTime,
    modifiedTime,
    author,
    price,
    availability,
    brand,
    category,
    sku,
    rating
  } = config

  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'product' ? 'Product' : type === 'article' ? 'Article' : 'WebPage',
    name: title,
    description: description,
    url: url,
    image: image,
    datePublished: publishedTime,
    dateModified: modifiedTime,
    author: author ? {
      '@type': 'Person',
      name: author
    } : undefined,
  }

  if (type === 'product') {
    return {
      ...baseStructuredData,
      '@type': 'Product',
      sku: sku,
      brand: brand ? {
        '@type': 'Brand',
        name: brand
      } : undefined,
      category: category,
      offers: price ? {
        '@type': 'Offer',
        price: price.amount,
        priceCurrency: price.currency,
        availability: availability === 'in stock' ? 'https://schema.org/InStock' : 
                     availability === 'out of stock' ? 'https://schema.org/OutOfStock' : 
                     'https://schema.org/PreOrder',
        seller: {
          '@type': 'Organization',
          name: 'Stock Mind'
        }
      } : undefined,
      aggregateRating: rating ? {
        '@type': 'AggregateRating',
        ratingValue: rating.value,
        reviewCount: rating.count
      } : undefined,
    }
  }

  if (type === 'article') {
    return {
      ...baseStructuredData,
      '@type': 'Article',
      headline: title,
      publisher: {
        '@type': 'Organization',
        name: 'Stock Mind',
        logo: {
          '@type': 'ImageObject',
          url: `${process.env.NEXTAUTH_URL}/logo.png`
        }
      }
    }
  }

  return baseStructuredData
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Stock Mind',
    url: process.env.NEXTAUTH_URL,
    logo: `${process.env.NEXTAUTH_URL}/logo.png`,
    description: 'A comprehensive inventory management system for smart stock tracking',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@stockmind.com'
    },
    sameAs: [
      'https://twitter.com/stockmind',
      'https://linkedin.com/company/stockmind'
    ]
  }
}

export function generateWebSiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Stock Mind',
    url: process.env.NEXTAUTH_URL,
    description: 'A comprehensive inventory management system for smart stock tracking',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXTAUTH_URL}/products?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }
}
