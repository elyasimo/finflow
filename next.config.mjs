/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'finflow.com',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone',
}

export default nextConfig
