/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Prevent build failures due to eslint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Prevent build failures due to TypeScript compiler errors (checked during testing)
    ignoreBuildErrors: false,
  },
  // Ensure we can render external assets / components safely if needed
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;
