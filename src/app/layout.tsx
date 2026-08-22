import type { Metadata, Viewport } from 'next';
import { Inter, Press_Start_2P } from 'next/font/google';
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import Web3Provider from '@/components/web3/Web3Provider/Web3Provider';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, X_HANDLE } from '@/config/site';
import { TAGLINE } from '@/config/protocol';
import '@/styles/globals.css';

const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-press-start',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'UNEST',
    'on-chain NFT',
    'generative art',
    'Uniswap v4',
    'Ethereum',
    'ERC-20',
    'ERC-721',
    'pixel art',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: SITE_DESCRIPTION,
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: SITE_DESCRIPTION,
    site: X_HANDLE,
    creator: X_HANDLE,
  },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0d0f11',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pressStart.variable} ${inter.variable}`}>
      <body>
        <Web3Provider>
          <a href="#main" className="visuallyHidden">
            Skip to content
          </a>
          <Navbar />
          <main id="main">{children}</main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
