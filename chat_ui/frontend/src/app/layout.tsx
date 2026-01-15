import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Kipper Energy Solutions | AI Command Center',
  description: 'AI-powered command center for MEP contractor operations - HVAC, Plumbing, Electrical, Solar, Fire Protection',
  keywords: ['MEP contractor', 'HVAC', 'Plumbing', 'Electrical', 'Solar', 'AI', 'Voice AI', 'Work Orders'],
  authors: [{ name: 'Kipper Energy Solutions' }],
  openGraph: {
    title: 'Kipper Energy Solutions | AI Command Center',
    description: 'AI-powered command center for MEP contractor operations',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
