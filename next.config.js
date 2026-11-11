/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,

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
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    // منع Webpack من معالجة حزم WASM والذكاء الاصطناعي كموديولات داخلية وتوجيهها للمتصفح مباشرة
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