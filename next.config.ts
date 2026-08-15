import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Emits .next/standalone — a self-contained server with only the traced
  // dependencies, so the runtime image copies that instead of the whole
  // node_modules tree. Without it the Docker image carries ~1GB of dev
  // dependencies it never runs.
  output: 'standalone',
  basePath: process.env.BASEPATH,
  eslint: {
    // Allow production builds to complete even with ESLint warnings
    // These are pre-existing unused variable warnings in view components
    ignoreDuringBuilds: true,
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
