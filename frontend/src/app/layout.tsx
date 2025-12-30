import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://stockle.fun'),
  title: {
    default: 'Stockle - Daily Stock Guessing Game',
    template: '%s | Stockle'
  },
  description: 'Can you guess the stock from the chart? A daily Wordle-style game for stock market enthusiasts. New puzzle every day!',
  keywords: [
    // Primary - Wordle variants for stocks/finance
    'stock market wordle', 'stock wordle', 'stockle', 'stocks wordle',
    'finance wordle', 'market wordle', 'money wordle', 'trading wordle',
    's&p 500 wordle', 's&p500 wordle', 'nasdaq wordle', 'wall street wordle',
    'stock game wordle', 'investing wordle', 'ticker wordle',
    // Daily game searches
    'daily stock game', 'daily stock market game', 'daily finance game',
    'daily stock puzzle', 'daily stock challenge', 'daily trading game',
    // General stock game searches
    'stock guessing game', 'guess the stock', 'stock ticker game',
    'stock market game', 'stock quiz', 'stock puzzle',
    // Broader game searches
    'finance game', 'trading game', 'investing game', 'market game',
    'free stock game', 'online stock game', 'browser stock game'
  ],
  authors: [{ name: 'Oliver Grabner', url: 'https://olivergrabner.com' }],
  creator: 'Oliver Grabner',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://stockle.fun',
    siteName: 'Stockle',
    title: 'Stockle - Daily Stock Guessing Game',
    description: 'Can you guess the stock from the chart? A daily Wordle-style game for stock market enthusiasts.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Stockle - Daily Stock Guessing Game' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stockle - Daily Stock Guessing Game',
    description: 'Can you guess the stock from the chart? New puzzle every day!',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${dmSerif.variable} antialiased`}
      >
        {children}
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
