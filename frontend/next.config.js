/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://cogumelos-api:8080'}/api/:path*`,
      },
      {
        source: '/oauth2/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://cogumelos-api:8080'}/oauth2/:path*`,
      },
    ]
  },
}
module.exports = nextConfig
