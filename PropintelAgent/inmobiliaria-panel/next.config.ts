import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El proxy ahora se maneja a través de API Routes en app/api/admin/
  // para tener mejor control sobre CORS y headers
};

export default nextConfig;
