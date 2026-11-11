/** @type {import('next').NextConfig} */
const nextConfig = {
  // تعطيل ملفات الخريطة في الإنتاج لحماية الكود من إعادة الهندسة والنسخ
  productionBrowserSourceMaps: false,

  // تمكين الترويسات المطلوبة لعمل FFmpeg WASM وأداء (SharedArrayBuffer) وحماية الموقع
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY', // يمنع عرض موقعك داخل إطار في مواقع أخرى (حماية من Clickjacking)
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // يمنع المتصفح من تخمين أنواع الملفات حمايةً من الثغرات
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    // دعم ملفات WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // منع أخطاء وحدات Node.js داخل متصفح المستخدم
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
      };
    }

    return config;
  },
};

export default nextConfig;