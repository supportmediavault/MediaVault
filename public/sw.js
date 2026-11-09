import './globals.css';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'iMedia | 100% Client-Side Media Converter',
  description: 'Convert images, audio, and video files directly in your browser with absolute privacy guaranteed.',
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
        
        {/* سكريبت تسجيل ومراقبة التحديثات بأمان دون قطع عمل المستخدم */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then((registration) => {
                    // فحص التحديثات عند الفتح
                    registration.update();
                  });

                  // تطبيق التحديث فقط عند إعادة فتح التطبيق في المرة القادمة تلقائياً
                  // بدلاً من عمل Refresh مفاجئ أثناء العمل
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}