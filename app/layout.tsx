'use client';

import './globals.css';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // تسجيل الـ Service Worker لتفعيل وضع الـ PWA والعمل بدون إنترنت
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Service Worker Registered successfully:', reg.scope))
        .catch((err) => console.log('Service Worker Registration Failed:', err));
    }
  }, []);

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
        <title>iMedia | 100% Client-Side Media Converter</title>
        <meta name="description" content="Convert images, audio, and video files directly in your browser with absolute privacy guaranteed." />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}