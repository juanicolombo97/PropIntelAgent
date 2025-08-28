/** @type {import('next').NextConfig} */
const nextConfig = {
  // El proxy ahora se maneja a través de API Routes en app/api/admin/
  // para tener mejor control sobre CORS y headers
  transpilePackages: [],
  // Disable typed routes to avoid compatibility issues
  typedRoutes: false,
};

module.exports = nextConfig; 