const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // El proxy ahora se maneja a través de API Routes en app/api/admin/
  // para tener mejor control sobre CORS y headers
  transpilePackages: [],
  // Disable typed routes to avoid compatibility issues
  typedRoutes: false,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add webpack aliases to ensure @ paths work correctly
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
};

module.exports = nextConfig; 