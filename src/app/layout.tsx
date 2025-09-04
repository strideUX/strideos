import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexProvider } from "@/providers/convex-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { GlobalErrorBoundary } from "@/components/error-boundaries/global-error-boundary";
import { ErrorMonitoringInitializer } from "@/components/error-monitoring-initializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'strideOS',
    template: '%s | strideOS',
  },
  description: 'Modern project management platform that embeds PM functionality within rich, collaborative documents.',
  keywords: [
    'project management',
    'documentation',
    'collaboration',
    'real-time',
    'productivity',
    'team management',
  ],
  authors: [{ name: 'strideOS Team' }],
  creator: 'strideOS',
  publisher: 'strideOS',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'strideOS - Document-Centric Project Management',
    description: 'Modern project management platform that embeds PM functionality within rich, collaborative documents.',
    siteName: 'strideOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'strideOS - Document-Centric Project Management',
    description: 'Modern project management platform that embeds PM functionality within rich, collaborative documents.',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <GlobalErrorBoundary>
            <ErrorMonitoringInitializer>
              <ConvexProvider>
                <ThemeProvider>
                  {children}
                  <Toaster />
                </ThemeProvider>
              </ConvexProvider>
            </ErrorMonitoringInitializer>
          </GlobalErrorBoundary>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
