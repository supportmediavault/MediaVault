/** @type {import('next').NextConfig} */
const nextConfig = {
  // تعطيل ملفات الخريطة في الإنتاج لحماية الكود من إعادة الهندسة والنسخ[cite: 6]
  productionBrowserSourceMaps: false,

  // تمكين الترويسات المطلوبة لعمل FFmpeg WASM وأداء (SharedArrayBuffer) وحماية الموقع[cite: 6]
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
            value: 'DENY', // يمنع عرض موقعك داخل إطار في مواقع أخرى (حماية من Clickjacking)[cite: 6]
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // يمنع المتصفح من تخمين أنواع الملفات حمايةً من الثغرات[cite: 6]
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    // دعم ملفات WebAssembly[cite: 6]
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // تجاهل تحذيرات وحدات التفسير الحديثة لتجنب أخطاء البناء أثناء الرفع
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    // منع أخطاء وحدات Node.js داخل متصفح المستخدم[cite: 6]
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