import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { siteDescription, siteName, siteUrl } from './site';

const geist = Geist({
  variable: '--font-geist-ticket',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'Project N',
    '프로젝트 N',
    '평가원 수학 아카이브',
    '평가원 수학',
    '수능 수학',
    '수학 기출문제',
    '모의평가 수학',
    '수능 기출문제',
  ],
  applicationName: 'Project N',
  creator: 'Project N',
  publisher: 'Project N',
  category: 'education',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName,
    title: siteName,
    description: siteDescription,
    ...(siteUrl ? { url: siteUrl } : {}),
  },
  twitter: {
    card: 'summary',
    title: siteName,
    description: siteDescription,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
};

const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteName,
  alternateName: ['Project N', '프로젝트 N', '평가원 수학 아카이브'],
  description: siteDescription,
  inLanguage: 'ko-KR',
  ...(siteUrl ? { url: siteUrl } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geist.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData).replace(/</g, '\\u003c') }}
        />
        {children}
      </body>
    </html>
  );
}
