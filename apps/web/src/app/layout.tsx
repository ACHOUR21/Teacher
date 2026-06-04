import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'EduAI Ultimate — AI-Powered Education Platform',
    template: '%s | EduAI Ultimate',
  },
  description:
    'The complete AI-powered education SaaS platform for schools, universities, and tutoring services. Intelligent tutoring, live classrooms, course management, and more.',
  keywords: [
    'education platform',
    'AI tutor',
    'LMS',
    'online learning',
    'school management',
    'e-learning',
  ],
  authors: [{ name: 'EduAI Team' }],
  creator: 'EduAI Ultimate',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.eduai.io'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'EduAI Ultimate',
    description: 'The complete AI-powered education SaaS platform',
    siteName: 'EduAI Ultimate',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduAI Ultimate',
    description: 'The complete AI-powered education SaaS platform',
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

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
