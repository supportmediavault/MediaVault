import './globals.css';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'iMedia | 100% Client-Side Media Converter',
  description: 'Convert images, audio, and video files directly in your browser with absolute privacy guaranteed.',
  icons: {
    icon: '/icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'iMedia',
    'operatingSystem': 'All',
    'applicationCategory': 'MultimediaApplication',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
    'description': 'Free, secure, and fast browser-based client-side media converter using WebAssembly.',
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
        
        {/* سكريبت تسجيل ومراقبة تحديثات الـ Service Worker تلقائياً */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then((registration) => {
                    registration.update();
                  });

                  let refreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (!refreshing) {
                      refreshing = true;
                      window.location.reload();
                    }
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}