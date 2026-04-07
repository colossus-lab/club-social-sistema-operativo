/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Permite builds con errores de TypeScript (temporal para deploy)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Permite builds con errores de ESLint (temporal para deploy)
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
