import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./mobile-responsive.css";
import { AuthProvider } from '@/components/AuthProvider';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

// Utility function to safely get the base URL
function getBaseUrl(): string {
  const envUrl = process.env.NEXTAUTH_URL;
  
  // If no environment URL, use localhost for development
  if (!envUrl) {
    return "http://localhost:3000";
  }
  
  // If URL already has protocol, use as is
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    return envUrl;
  }
  
  // If URL doesn't have protocol, add https://
  return `https://${envUrl}`;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = generateSEOMetadata({
  title: "Stock Mind - Advanced Inventory Management System",
  description: "Streamline your business operations with Stock Mind's comprehensive inventory management platform. Track products, manage stock levels, analyze performance, and optimize your supply chain with real-time insights and AI-powered features.",
  keywords: [
    "inventory management",
    "stock tracking",
    "supply chain",
    "warehouse management",
    "product catalog",
    "business analytics",
    "stock optimization",
    "inventory control",
    "retail management",
    "e-commerce",
    "barcode scanning",
    "stock alerts",
    "inventory reports",
    "multi-location",
    "real-time tracking"
  ],
  type: "website",
  siteName: "Stock Mind",
  locale: "en_US",
  url: getBaseUrl(),
  image: `${getBaseUrl()}/og-image.png`,
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Stock Mind",
              "url": getBaseUrl(),
              "logo": `${getBaseUrl()}/logo.png`,
              "description": "A comprehensive inventory management system for smart stock tracking",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "support@stockmind.com"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
