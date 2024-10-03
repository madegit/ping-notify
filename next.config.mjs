/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'porkbun.com',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'stickermule.com',
      },
      {
        protocol: 'https',
        hostname: 'gumroad.com',
      },
      {
        protocol: 'https',
        hostname: '*.com',
      },
      {
        protocol: 'https',
        hostname: 'zoom.us',
      },
      {
        protocol: 'https',
        hostname: '*.cloud',
      },
      {
        protocol: 'https',
        hostname: '*.microsoft.com',
      },
    ],
  },
};

export default nextConfig;