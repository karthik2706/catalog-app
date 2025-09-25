'use client'

import React from 'react'
import Head from 'next/head'
import { SEOConfig, generateStructuredData, generateBreadcrumbStructuredData, generateOrganizationStructuredData, generateWebSiteStructuredData } from '@/lib/seo'

interface SEOHeadProps {
  config: SEOConfig
  breadcrumbs?: Array<{ name: string; url: string }>
  includeOrganization?: boolean
  includeWebSite?: boolean
}

export default function SEOHead({ 
  config, 
  breadcrumbs, 
  includeOrganization = false, 
  includeWebSite = false 
}: SEOHeadProps) {
  const structuredData = generateStructuredData(config)
  const breadcrumbData = breadcrumbs ? generateBreadcrumbStructuredData(breadcrumbs) : null
  const organizationData = includeOrganization ? generateOrganizationStructuredData() : null
  const webSiteData = includeWebSite ? generateWebSiteStructuredData() : null

  const allStructuredData = [
    structuredData,
    breadcrumbData,
    organizationData,
    webSiteData
  ].filter(Boolean)

  return (
    <Head>
      {/* Structured Data */}
      {allStructuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data, null, 2)
          }}
        />
      ))}

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Stock Mind" />
      
      {/* Performance Hints */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
  )
}
